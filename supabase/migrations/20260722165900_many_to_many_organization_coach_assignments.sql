alter table public.organization_coach_assignments
  drop constraint organization_coach_assignments_pkey;

alter table public.organization_coach_assignments
  add constraint organization_coach_assignments_pkey
  primary key (organization_id, coach_user_id);

create or replace function public.set_organization_coach_assignments(
  p_organization_id uuid,
  p_coach_user_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_coach_user_ids uuid[];
  v_scope_enabled boolean;
begin
  if v_actor_id is null or not public.is_admin() then
    raise exception 'Only developers can change coach assignments.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct coach_user_id order by coach_user_id), '{}')
  into v_coach_user_ids
  from unnest(coalesce(p_coach_user_ids, '{}')) as coach_ids(coach_user_id);

  select settings.assigned_only_enabled
  into v_scope_enabled
  from public.organization_coach_scope_settings settings
  where settings.id = true
  for update;

  if not exists (
    select 1
    from public.organizations organizations
    where organizations.user_id = p_organization_id
    for update
  ) then
    raise exception 'Organization not found.' using errcode = '23503';
  end if;

  if exists (
    select 1
    from unnest(v_coach_user_ids) as requested(coach_user_id)
    left join public.platform_staff_members staff
      on staff.user_id = requested.coach_user_id
      and staff.access_level = 'coach'
    where staff.user_id is null
  ) then
    raise exception 'Assignments require coach-level staff.'
      using errcode = '23503';
  end if;

  if coalesce(v_scope_enabled, false)
    and cardinality(v_coach_user_ids) = 0 then
    raise exception 'Keep at least one coach assigned while assigned-only visibility is active.'
      using errcode = '23514';
  end if;

  delete from public.organization_coach_assignments assignments
  where assignments.organization_id = p_organization_id
    and not (assignments.coach_user_id = any(v_coach_user_ids));

  insert into public.organization_coach_assignments (
    organization_id,
    coach_user_id,
    assigned_by
  )
  select p_organization_id, coach_user_id, v_actor_id
  from unnest(v_coach_user_ids) as requested(coach_user_id)
  on conflict (organization_id, coach_user_id) do nothing;

  return jsonb_build_object(
    'organizationId', p_organization_id,
    'coachUserIds', to_jsonb(v_coach_user_ids)
  );
end;
$$;

revoke all on function public.set_organization_coach_assignments(uuid, uuid[])
  from public, anon;
grant execute on function public.set_organization_coach_assignments(uuid, uuid[])
  to authenticated, service_role;

create or replace function public.assign_all_coaches_to_all_organizations()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_organization_count integer;
  v_coach_count integer;
  v_assignment_count integer;
  v_added_count integer;
begin
  if v_actor_id is null or not public.is_admin() then
    raise exception 'Only developers can change coach assignments.'
      using errcode = '42501';
  end if;

  perform 1
  from public.organization_coach_scope_settings
  where id = true
  for update;

  lock table public.organizations in share mode;
  lock table public.platform_staff_members in share mode;
  lock table public.organization_coach_assignments in row exclusive mode;

  select count(*)::integer
  into v_organization_count
  from public.organizations;

  select count(*)::integer
  into v_coach_count
  from public.platform_staff_members
  where access_level = 'coach';

  if v_organization_count = 0 or v_coach_count = 0 then
    raise exception 'At least one organization and one coach are required.'
      using errcode = '23514';
  end if;

  insert into public.organization_coach_assignments (
    organization_id,
    coach_user_id,
    assigned_by
  )
  select organizations.user_id, coaches.user_id, v_actor_id
  from public.organizations organizations
  cross join public.platform_staff_members coaches
  where coaches.access_level = 'coach'
  on conflict (organization_id, coach_user_id) do nothing;

  get diagnostics v_added_count = row_count;

  select count(*)::integer
  into v_assignment_count
  from public.organization_coach_assignments;

  return jsonb_build_object(
    'organizationCount', v_organization_count,
    'coachCount', v_coach_count,
    'assignmentCount', v_assignment_count,
    'addedCount', v_added_count
  );
end;
$$;

revoke all on function public.assign_all_coaches_to_all_organizations()
  from public, anon;
grant execute on function public.assign_all_coaches_to_all_organizations()
  to authenticated, service_role;

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
  v_covered_organization_count integer;
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

  select count(*)::integer, count(distinct organization_id)::integer
  into v_assignment_count, v_covered_organization_count
  from public.organization_coach_assignments;

  if p_enabled and v_covered_organization_count <> v_organization_count then
    raise exception 'Assign every organization before enabling assigned-only coach visibility. % organizations remain unassigned.',
      v_organization_count - v_covered_organization_count
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
    'unassignedCount', v_organization_count - v_covered_organization_count
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
  if tg_op = 'UPDATE'
    and (
      new.organization_id is distinct from old.organization_id
      or new.coach_user_id is distinct from old.coach_user_id
    ) then
    raise exception 'Change coach coverage by adding or removing assignments.'
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
    )
    and not exists (
      select 1
      from public.organization_coach_assignments assignments
      where assignments.organization_id = old.organization_id
        and assignments.coach_user_id <> old.coach_user_id
    ) then
    raise exception 'Keep at least one coach assigned while assigned-only visibility is active.'
      using errcode = '23514';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists protect_active_organization_coach_assignment_update
  on public.organization_coach_assignments;
create trigger protect_active_organization_coach_assignment_update
before update of organization_id, coach_user_id
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
using ((select public.is_admin()));
