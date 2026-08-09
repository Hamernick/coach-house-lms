set check_function_bodies = off;
set search_path = public;

create table if not exists public.platform_admin_workstream_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default 'slate',
  position integer not null default 0,
  default_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_admin_workstream_categories_owner_id_id_key
    unique (owner_id, id),
  constraint platform_admin_workstream_categories_name_check
    check (char_length(trim(name)) between 1 and 48),
  constraint platform_admin_workstream_categories_color_check
    check (color in ('slate', 'blue', 'amber', 'emerald', 'rose', 'violet')),
  constraint platform_admin_workstream_categories_position_check
    check (position >= 0),
  constraint platform_admin_workstream_categories_default_key_check
    check (
      default_key is null
      or default_key in ('backlog', 'planned', 'active', 'completed', 'cancelled')
    )
);

create unique index if not exists platform_admin_workstream_categories_owner_name_idx
  on public.platform_admin_workstream_categories (owner_id, lower(trim(name)));

create unique index if not exists platform_admin_workstream_categories_owner_default_idx
  on public.platform_admin_workstream_categories (owner_id, default_key)
  where default_key is not null;

create index if not exists platform_admin_workstream_categories_owner_position_idx
  on public.platform_admin_workstream_categories (owner_id, position, created_at);

create table if not exists public.platform_admin_project_workstream_states (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  category_id uuid not null,
  started_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (owner_id, project_id),
  constraint platform_admin_project_workstream_states_category_fkey
    foreign key (owner_id, category_id)
    references public.platform_admin_workstream_categories(owner_id, id)
    on delete cascade
);

create index if not exists platform_admin_project_workstream_states_category_idx
  on public.platform_admin_project_workstream_states (owner_id, category_id, updated_at desc);

update public.organization_projects as project
set task_count = (
  select count(*)::integer
  from public.organization_tasks as task
  where task.project_id = project.id
)
where project.project_kind = 'organization_admin';

create table if not exists public.organization_project_activity_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid references public.organization_projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  title text not null,
  from_status text,
  to_status text,
  actor_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  constraint organization_project_activity_events_entity_type_check
    check (entity_type in ('project', 'task', 'program', 'fiscal_application')),
  constraint organization_project_activity_events_event_type_check
    check (event_type in ('created', 'status_changed', 'scheduled', 'published', 'completed', 'updated')),
  constraint organization_project_activity_events_title_check
    check (char_length(trim(title)) between 1 and 240),
  constraint organization_project_activity_events_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists organization_project_activity_events_project_idx
  on public.organization_project_activity_events (project_id, occurred_at desc, id);

create index if not exists organization_project_activity_events_org_idx
  on public.organization_project_activity_events (org_id, occurred_at desc, id);

create index if not exists organization_project_activity_events_entity_idx
  on public.organization_project_activity_events (entity_type, entity_id, occurred_at, id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_platform_admin_workstream_categories'
  ) then
    create trigger set_updated_at_platform_admin_workstream_categories
      before update on public.platform_admin_workstream_categories
      for each row execute procedure public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_platform_admin_project_workstream_states'
  ) then
    create trigger set_updated_at_platform_admin_project_workstream_states
      before update on public.platform_admin_project_workstream_states
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

create or replace function public.record_organization_project_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_kind text;
begin
  if tg_op = 'INSERT' then
    event_kind := 'created';
  elsif old.status is not distinct from new.status then
    return new;
  elsif new.status = 'completed' then
    event_kind := 'completed';
  else
    event_kind := 'status_changed';
  end if;

  insert into public.organization_project_activity_events (
    org_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    title,
    from_status,
    to_status,
    actor_id,
    metadata,
    occurred_at
  ) values (
    new.org_id,
    new.id,
    'project',
    new.id,
    event_kind,
    new.name,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status,
    coalesce(new.updated_by, new.created_by),
    jsonb_build_object(
      'start_date', new.start_date,
      'end_date', new.end_date,
      'project_kind', new.project_kind
    ),
    coalesce(new.updated_at, timezone('utc', now()))
  );

  return new;
end;
$$;

create or replace function public.record_organization_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_kind text;
begin
  if tg_op = 'INSERT' then
    event_kind := 'created';
  elsif old.status is not distinct from new.status then
    return new;
  elsif new.status = 'done' then
    event_kind := 'completed';
  else
    event_kind := 'status_changed';
  end if;

  insert into public.organization_project_activity_events (
    org_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    title,
    from_status,
    to_status,
    actor_id,
    metadata,
    occurred_at
  ) values (
    new.org_id,
    new.project_id,
    'task',
    new.id,
    event_kind,
    new.title,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status,
    coalesce(new.updated_by, new.created_by),
    jsonb_build_object(
      'start_date', new.start_date,
      'end_date', new.end_date,
      'workstream_name', new.workstream_name
    ),
    coalesce(new.updated_at, timezone('utc', now()))
  );

  return new;
end;
$$;

create or replace function public.record_organization_program_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  canonical_project_id uuid;
  event_kind text;
  previous_status text;
  next_status text;
begin
  previous_status := case
    when tg_op = 'UPDATE' then coalesce(nullif(trim(old.status_label), ''), case when old.is_public then 'Published' else 'Draft' end)
    else null
  end;
  next_status := coalesce(nullif(trim(new.status_label), ''), case when new.is_public then 'Published' else 'Draft' end);

  if tg_op = 'INSERT' then
    event_kind := 'created';
  elsif old.status_label is distinct from new.status_label then
    event_kind := case when lower(next_status) in ('complete', 'completed', 'ended') then 'completed' else 'status_changed' end;
  elsif old.is_public is distinct from new.is_public and new.is_public then
    event_kind := 'published';
  elsif old.start_date is distinct from new.start_date or old.end_date is distinct from new.end_date then
    event_kind := 'scheduled';
  else
    return new;
  end if;

  select project.id
  into canonical_project_id
  from public.organization_projects as project
  where project.canonical_org_id = new.user_id
    and project.project_kind = 'organization_admin'
  limit 1;

  insert into public.organization_project_activity_events (
    org_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    title,
    from_status,
    to_status,
    actor_id,
    metadata,
    occurred_at
  ) values (
    new.user_id,
    canonical_project_id,
    'program',
    new.id,
    event_kind,
    new.title,
    previous_status,
    next_status,
    new.user_id,
    jsonb_build_object(
      'start_date', new.start_date,
      'end_date', new.end_date,
      'is_public', new.is_public
    ),
    coalesce(new.updated_at, timezone('utc', now()))
  );

  return new;
end;
$$;

create or replace function public.record_fiscal_sponsorship_application_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_kind text;
begin
  if tg_op = 'INSERT' then
    event_kind := 'created';
  elsif old.status is not distinct from new.status
    and old.submitted_at is not distinct from new.submitted_at then
    return new;
  elsif new.status = 'submitted'
    or (old.submitted_at is null and new.submitted_at is not null) then
    event_kind := 'published';
  elsif new.status in ('countersigned', 'declined') then
    event_kind := 'completed';
  else
    event_kind := 'status_changed';
  end if;

  insert into public.organization_project_activity_events (
    org_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    title,
    from_status,
    to_status,
    actor_id,
    metadata,
    occurred_at
  ) values (
    new.org_id,
    new.project_id,
    'fiscal_application',
    new.id,
    event_kind,
    coalesce(nullif(trim(new.project_name), ''), 'Fiscal sponsorship application'),
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status,
    coalesce(new.updated_by, new.created_by),
    jsonb_build_object(
      'submitted_at', new.submitted_at,
      'reviewed_at', new.reviewed_at
    ),
    coalesce(new.updated_at, timezone('utc', now()))
  );

  return new;
end;
$$;

drop trigger if exists record_organization_project_activity on public.organization_projects;
create trigger record_organization_project_activity
  after insert or update of status on public.organization_projects
  for each row execute procedure public.record_organization_project_activity();

drop trigger if exists record_organization_task_activity on public.organization_tasks;
create trigger record_organization_task_activity
  after insert or update of status on public.organization_tasks
  for each row execute procedure public.record_organization_task_activity();

drop trigger if exists record_organization_program_activity on public.programs;
create trigger record_organization_program_activity
  after insert or update of status_label, is_public, start_date, end_date on public.programs
  for each row execute procedure public.record_organization_program_activity();

drop trigger if exists record_fiscal_sponsorship_application_activity
  on public.fiscal_sponsorship_applications;
create trigger record_fiscal_sponsorship_application_activity
  after insert or update of status, submitted_at
  on public.fiscal_sponsorship_applications
  for each row execute procedure public.record_fiscal_sponsorship_application_activity();

alter table public.platform_admin_workstream_categories enable row level security;
alter table public.platform_admin_workstream_categories force row level security;
alter table public.platform_admin_project_workstream_states enable row level security;
alter table public.platform_admin_project_workstream_states force row level security;
alter table public.organization_project_activity_events enable row level security;

drop policy if exists "platform_admin_workstream_categories_select" on public.platform_admin_workstream_categories;
drop policy if exists "platform_admin_workstream_categories_insert" on public.platform_admin_workstream_categories;
drop policy if exists "platform_admin_workstream_categories_update" on public.platform_admin_workstream_categories;
drop policy if exists "platform_admin_workstream_categories_delete" on public.platform_admin_workstream_categories;

create policy "platform_admin_workstream_categories_select"
  on public.platform_admin_workstream_categories
  for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_admin()));

create policy "platform_admin_workstream_categories_insert"
  on public.platform_admin_workstream_categories
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_admin()));

create policy "platform_admin_workstream_categories_update"
  on public.platform_admin_workstream_categories
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_admin()))
  with check (owner_id = (select auth.uid()) and (select public.is_admin()));

create policy "platform_admin_workstream_categories_delete"
  on public.platform_admin_workstream_categories
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_admin()));

drop policy if exists "platform_admin_project_workstream_states_select" on public.platform_admin_project_workstream_states;
drop policy if exists "platform_admin_project_workstream_states_insert" on public.platform_admin_project_workstream_states;
drop policy if exists "platform_admin_project_workstream_states_update" on public.platform_admin_project_workstream_states;
drop policy if exists "platform_admin_project_workstream_states_delete" on public.platform_admin_project_workstream_states;

create policy "platform_admin_project_workstream_states_select"
  on public.platform_admin_project_workstream_states
  for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_admin()));

create policy "platform_admin_project_workstream_states_insert"
  on public.platform_admin_project_workstream_states
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_admin()));

create policy "platform_admin_project_workstream_states_update"
  on public.platform_admin_project_workstream_states
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_admin()))
  with check (owner_id = (select auth.uid()) and (select public.is_admin()));

create policy "platform_admin_project_workstream_states_delete"
  on public.platform_admin_project_workstream_states
  for delete to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_admin()));

drop policy if exists "organization_project_activity_events_select" on public.organization_project_activity_events;

create policy "organization_project_activity_events_select"
  on public.organization_project_activity_events
  for select to authenticated
  using (
    (select public.is_admin())
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships as membership
      where membership.org_id = organization_project_activity_events.org_id
        and membership.member_id = (select auth.uid())
    )
  );

revoke insert, update, delete on public.organization_project_activity_events from anon, authenticated;
grant select on public.organization_project_activity_events to authenticated;
grant select, insert, update, delete on public.platform_admin_workstream_categories to authenticated;
grant select, insert, update, delete on public.platform_admin_project_workstream_states to authenticated;
