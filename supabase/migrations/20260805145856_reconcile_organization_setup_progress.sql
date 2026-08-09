set check_function_bodies = off;
set search_path = public;

do $$
declare
  v_completed_at timestamptz := timezone('utc', now());
  v_setup_module_id uuid;
begin
  select id
  into v_setup_module_id
  from modules
  where slug in (
    'organization-setup',
    'workspace-setup',
    'workspace-onboarding-organization-setup'
  )
    and is_published = true
  order by
    case slug
      when 'organization-setup' then 0
      when 'workspace-setup' then 1
      else 2
    end
  limit 1;

  if v_setup_module_id is null then
    raise exception 'Unable to reconcile organization setup progress: published setup module not found.';
  end if;

  with saved_organizations as (
    select organizations.user_id as org_id
    from organizations
    where trim(coalesce(organizations.profile ->> 'name', '')) <> ''
      and trim(coalesce(organizations.public_slug, '')) <> ''
  ),
  affected_users as (
    select saved_organizations.org_id as user_id
    from saved_organizations
    inner join profiles on profiles.id = saved_organizations.org_id

    union

    select organization_memberships.member_id as user_id
    from saved_organizations
    inner join organization_memberships
      on organization_memberships.org_id = saved_organizations.org_id
    inner join profiles
      on profiles.id = organization_memberships.member_id
  )
  insert into module_progress (
    user_id,
    module_id,
    status,
    completed_at,
    updated_at
  )
  select
    affected_users.user_id,
    v_setup_module_id,
    'completed'::module_progress_status,
    v_completed_at,
    v_completed_at
  from affected_users
  on conflict (user_id, module_id) do update
  set
    status = excluded.status,
    completed_at = coalesce(module_progress.completed_at, excluded.completed_at),
    updated_at = excluded.updated_at
  where module_progress.status is distinct from 'completed'::module_progress_status
    or module_progress.completed_at is null;
end $$;
