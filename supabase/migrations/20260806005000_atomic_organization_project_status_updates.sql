set check_function_bodies = off;
set search_path = public;

create or replace function public.update_organization_project_status_transition(
  p_project_id uuid,
  p_actor_id uuid,
  p_expected_org_id uuid,
  p_expected_updated_at timestamptz,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_project public.organization_projects%rowtype;
  v_updated_at timestamptz := now();
begin
  if p_actor_id is null or p_expected_org_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_status not in (
    'backlog', 'planned', 'active', 'cancelled', 'completed'
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;

  select *
  into v_project
  from public.organization_projects
  where id = p_project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_project.org_id <> p_expected_org_id then
    return jsonb_build_object('ok', false, 'code', 'scope_changed');
  end if;

  if p_expected_updated_at is null
    or v_project.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  update public.organization_projects
  set
    status = p_status,
    updated_at = v_updated_at,
    updated_by = p_actor_id
  where id = v_project.id;

  return jsonb_build_object(
    'ok', true,
    'projectId', v_project.id,
    'updatedAt', v_updated_at
  );
end;
$$;

revoke all on function public.update_organization_project_status_transition(uuid, uuid, uuid, timestamptz, text)
  from public, anon, authenticated;

grant execute on function public.update_organization_project_status_transition(uuid, uuid, uuid, timestamptz, text)
  to service_role;
