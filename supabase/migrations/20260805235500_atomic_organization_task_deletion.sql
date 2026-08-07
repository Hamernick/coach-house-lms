set check_function_bodies = off;
set search_path = public;

create or replace function public.delete_organization_task_transition(
  p_actor_id uuid,
  p_task_id uuid,
  p_expected_org_id uuid,
  p_expected_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_task public.organization_tasks%rowtype;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  select *
  into v_task
  from public.organization_tasks task
  where task.id = p_task_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'task_not_found');
  end if;

  if v_task.org_id is distinct from p_expected_org_id
    or v_task.project_id is distinct from p_expected_project_id then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  perform project.id
  from public.organization_projects project
  where project.id = v_task.project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'project_not_found');
  end if;

  update public.organization_tasks
  set updated_by = p_actor_id
  where id = v_task.id;

  delete from public.organization_tasks
  where id = v_task.id;

  update public.organization_projects project
  set
    task_count = (
      select count(*)::integer
      from public.organization_tasks task
      where task.org_id = project.org_id
        and task.project_id = project.id
    ),
    updated_by = p_actor_id
  where project.id = v_task.project_id
    and project.org_id = v_task.org_id;

  return jsonb_build_object(
    'ok', true,
    'taskId', v_task.id,
    'projectId', v_task.project_id
  );
end;
$$;

drop policy if exists "organization_tasks_delete"
  on public.organization_tasks;

revoke all on function public.delete_organization_task_transition(
  uuid,
  uuid,
  uuid,
  uuid
) from public, anon, authenticated;

grant execute on function public.delete_organization_task_transition(
  uuid,
  uuid,
  uuid,
  uuid
) to service_role;
