create table if not exists public.organization_coach_scope_settings (
  id boolean primary key default true check (id),
  assigned_only_enabled boolean not null default false,
  activated_at timestamptz,
  activated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint organization_coach_scope_activation_check check (
    (assigned_only_enabled and activated_at is not null and activated_by is not null)
    or
    (not assigned_only_enabled and activated_at is null and activated_by is null)
  )
);

insert into public.organization_coach_scope_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.organization_coach_scope_events (
  id bigint generated always as identity primary key,
  assigned_only_enabled boolean not null,
  organization_count integer not null check (organization_count >= 0),
  assignment_count integer not null check (assignment_count >= 0),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists organization_coach_scope_events_created_at_idx
  on public.organization_coach_scope_events(created_at desc);

alter table public.organization_coach_scope_settings enable row level security;
alter table public.organization_coach_scope_settings force row level security;
alter table public.organization_coach_scope_events enable row level security;
alter table public.organization_coach_scope_events force row level security;

revoke all on public.organization_coach_scope_settings from public, anon;
revoke all on public.organization_coach_scope_events from public, anon;
grant select on public.organization_coach_scope_settings to authenticated;
grant select on public.organization_coach_scope_events to authenticated;

drop policy if exists organization_coach_scope_settings_staff_select
  on public.organization_coach_scope_settings;
create policy organization_coach_scope_settings_staff_select
on public.organization_coach_scope_settings
for select
to authenticated
using ((select public.is_platform_staff()));

drop policy if exists organization_coach_scope_events_developer_select
  on public.organization_coach_scope_events;
create policy organization_coach_scope_events_developer_select
on public.organization_coach_scope_events
for select
to authenticated
using ((select public.is_admin()));

create or replace function public.set_organization_coach_scope_enabled(
  p_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_organization_count integer;
  v_assignment_count integer;
begin
  if v_actor_id is null or not public.is_admin() then
    raise exception 'Only developers can change coach visibility.'
      using errcode = '42501';
  end if;

  perform 1
  from public.organization_coach_scope_settings
  where id = true
  for update;

  lock table public.organizations in share mode;
  lock table public.organization_coach_assignments in share mode;

  select count(*)::integer
  into v_organization_count
  from public.organizations;

  select count(*)::integer
  into v_assignment_count
  from public.organization_coach_assignments;

  if p_enabled and v_assignment_count <> v_organization_count then
    raise exception 'Assign every organization before enabling assigned-only coach visibility. % organizations remain unassigned.',
      v_organization_count - v_assignment_count
      using errcode = '23514';
  end if;

  update public.organization_coach_scope_settings
  set
    assigned_only_enabled = p_enabled,
    activated_at = case when p_enabled then now() else null end,
    activated_by = case when p_enabled then v_actor_id else null end,
    updated_at = now(),
    updated_by = v_actor_id
  where id = true;

  insert into public.organization_coach_scope_events (
    assigned_only_enabled,
    organization_count,
    assignment_count,
    changed_by
  )
  values (
    p_enabled,
    v_organization_count,
    v_assignment_count,
    v_actor_id
  );

  return jsonb_build_object(
    'assignedOnlyEnabled', p_enabled,
    'organizationCount', v_organization_count,
    'assignmentCount', v_assignment_count,
    'unassignedCount', v_organization_count - v_assignment_count
  );
end;
$$;

revoke all on function public.set_organization_coach_scope_enabled(boolean)
  from public, anon;
grant execute on function public.set_organization_coach_scope_enabled(boolean)
  to authenticated, service_role;

create or replace function public.protect_active_organization_coach_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'Move coach coverage by reassigning each organization.'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE'
    and coalesce(
      (
        select settings.assigned_only_enabled
        from public.organization_coach_scope_settings settings
        where settings.id = true
      ),
      false
    )
    and exists (
      select 1
      from public.organizations
      where user_id = old.organization_id
    ) then
    raise exception 'Disable assigned-only coach visibility before removing coverage.'
      using errcode = '23514';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists protect_active_organization_coach_assignment_update
  on public.organization_coach_assignments;
create trigger protect_active_organization_coach_assignment_update
before update of organization_id
on public.organization_coach_assignments
for each row execute procedure public.protect_active_organization_coach_assignment();

drop trigger if exists protect_active_organization_coach_assignment_delete
  on public.organization_coach_assignments;
create trigger protect_active_organization_coach_assignment_delete
before delete
on public.organization_coach_assignments
for each row execute procedure public.protect_active_organization_coach_assignment();

revoke execute on function public.protect_active_organization_coach_assignment()
  from public, anon, authenticated;

drop policy if exists organization_coach_assignments_developer_delete
  on public.organization_coach_assignments;
create policy organization_coach_assignments_developer_delete
on public.organization_coach_assignments
for delete
to authenticated
using (
  (select public.is_admin())
  and not coalesce(
    (
      select settings.assigned_only_enabled
      from public.organization_coach_scope_settings settings
      where settings.id = true
    ),
    false
  )
);
