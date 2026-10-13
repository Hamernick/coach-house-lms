-- Additive support for importing real, unscheduled internal work.
alter table public.organization_tasks
  alter column start_date drop not null,
  alter column end_date drop not null,
  add column tracker_metadata jsonb;
alter table public.organization_projects add column tracker_metadata jsonb;

alter table public.organization_tasks drop constraint organization_tasks_status_check;
alter table public.organization_tasks add constraint organization_tasks_status_check
  check (status in ('todo', 'in-progress', 'waiting', 'done'));
alter table public.organization_projects drop constraint organization_projects_status_check;
alter table public.organization_projects add constraint organization_projects_status_check
  check (status in ('backlog', 'planned', 'active', 'on-hold', 'cancelled', 'completed'));
alter table public.organization_tasks add constraint organization_tasks_tracker_metadata_check
  check (tracker_metadata is null or jsonb_typeof(tracker_metadata) = 'object');
alter table public.organization_projects add constraint organization_projects_tracker_metadata_check
  check (tracker_metadata is null or jsonb_typeof(tracker_metadata) = 'object');

create index organization_tasks_tracker_proposed_user_idx
  on public.organization_tasks ((tracker_metadata->>'proposedUserId'))
  where tracker_metadata is not null;
create index organization_tasks_tracker_collaborators_idx
  on public.organization_tasks using gin ((tracker_metadata->'collaboratorUserIds'))
  where tracker_metadata is not null;

-- Keep the already-applied transactional implementations and privileges, changing
-- only their validation contracts. Fail if the expected baseline is absent.
do $$
declare f record; original text; revised text; changed integer := 0;
begin
  for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'create_organization_task_transition', 'update_organization_task_transition',
      'create_organization_project_transition', 'update_organization_project_transition',
      'update_organization_project_status_transition', 'create_guided_organization_project'
    ) loop
    original := pg_get_functiondef(f.oid);
    revised := replace(original, '''todo'', ''in-progress'', ''done''', '''todo'', ''in-progress'', ''waiting'', ''done''');
    revised := replace(revised, '''backlog'', ''planned'', ''active'', ''cancelled'', ''completed''', '''backlog'', ''planned'', ''active'', ''on-hold'', ''cancelled'', ''completed''');
    revised := replace(revised, E'    or p_start_date is null\n', '');
    revised := replace(revised, E'    or p_end_date is null\n', '');
    revised := replace(revised, '(v_task->>''startDate'')::date', '(nullif(v_task->>''startDate'', ''''))::date');
    revised := replace(revised, '(v_task->>''endDate'')::date', '(nullif(v_task->>''endDate'', ''''))::date');
    if revised = original then raise exception 'Unexpected tracker transition baseline: %', f.proname; end if;
    execute revised;
    changed := changed + 1;
  end loop;
  if changed <> 6 then raise exception 'Expected six tracker transitions; found %', changed; end if;

  original := pg_get_functiondef('public.generate_next_monthly_project()'::regprocedure);
  revised := replace(original,
    'least(v_end, greatest(v_start, (v_task_start_anchor + make_interval(months => v_occurrence))::date))',
    'case when v_task.start_date is null then null else least(v_end, greatest(v_start, (v_task_start_anchor + make_interval(months => v_occurrence))::date)) end');
  revised := replace(revised,
    'least(v_end, greatest(v_start, (v_task_end_anchor + make_interval(months => v_occurrence))::date))',
    'case when v_task.end_date is null then null else least(v_end, greatest(v_start, (v_task_end_anchor + make_interval(months => v_occurrence))::date)) end');
  if revised = original then raise exception 'Unexpected monthly recurrence baseline'; end if;
  execute revised;
end;
$$;

-- Source payloads include held personal records. No authenticated/anonymous
-- table access: only the narrowly scoped service import can read/write them.
create table public.task_tracker_import_batches (
  id uuid primary key,
  namespace text not null,
  source_hash text not null,
  manifest_hash text not null,
  org_id uuid not null references public.organizations(user_id),
  actor_id uuid not null references public.profiles(id),
  status text not null check (status in ('applying', 'complete', 'rolled_back')),
  manifest jsonb not null,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(namespace, source_hash)
);
create table public.task_tracker_import_records (
  namespace text not null,
  entity_type text not null,
  source_id text not null,
  batch_id uuid not null references public.task_tracker_import_batches(id),
  source_row integer,
  source_payload jsonb not null,
  disposition text not null check (disposition in ('created', 'linked', 'reference', 'held')),
  reason text,
  destination_id uuid,
  destination_version timestamptz,
  primary key(namespace, entity_type, source_id)
);
alter table public.task_tracker_import_batches enable row level security;
alter table public.task_tracker_import_batches force row level security;
alter table public.task_tracker_import_records enable row level security;
alter table public.task_tracker_import_records force row level security;
revoke all on public.task_tracker_import_batches, public.task_tracker_import_records from public, anon, authenticated;
grant select, insert, update, delete on public.task_tracker_import_batches, public.task_tracker_import_records to service_role;

create function public.is_task_tracker_import_active() returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select exists(select 1 from public.task_tracker_import_batches
    where id::text = current_setting('app.task_tracker_import_batch', true) and status = 'applying');
$$;
revoke all on function public.is_task_tracker_import_active() from public, anon, authenticated;

-- Suppression is local to an authorized batch transaction, never a global
-- trigger disable. Subsequent normal edits/assignments use the existing events.
do $$
declare name text; target regprocedure; original text; revised text;
begin
  foreach name in array array['notify_organization_task_assignment', 'record_organization_project_activity', 'record_organization_task_activity'] loop
    target := to_regprocedure('public.' || name || '()');
    if target is null then
      if name = 'notify_organization_task_assignment' then raise exception 'Missing assignment notification trigger'; end if;
      continue;
    end if;
    original := pg_get_functiondef(target);
    revised := regexp_replace(original, '(?i)\mbegin\M', E'begin\n  if public.is_task_tracker_import_active() then return new; end if;');
    if original = revised then raise exception 'Unexpected trigger baseline: %', name; end if;
    execute revised;
  end loop;
end;
$$;

-- Rollback must first remove/resolve this batch's native NULL-date/new-status
-- records. Do not restore NOT NULL or old status checks over imported data.
