set check_function_bodies = off;
set search_path = public;

create or replace function public.reorder_organization_tasks_transition(
  p_actor_id uuid,
  p_project_id uuid,
  p_expected_org_id uuid,
  p_ordered_task_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_current_task_ids uuid[];
  v_expected_task_ids uuid[];
  v_org_id uuid;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if coalesce(cardinality(p_ordered_task_ids), 0) = 0
    or exists (
      select 1
      from unnest(p_ordered_task_ids) as requested(task_id)
      where requested.task_id is null
    )
    or cardinality(p_ordered_task_ids) <> (
      select count(distinct requested.task_id)
      from unnest(p_ordered_task_ids) as requested(task_id)
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_order');
  end if;

  select project.org_id
  into v_org_id
  from public.organization_projects project
  where project.id = p_project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'project_not_found');
  end if;

  if v_org_id is distinct from p_expected_org_id then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  perform task.id
  from public.organization_tasks task
  where task.org_id = v_org_id
    and task.project_id = p_project_id
  order by task.id
  for update;

  select array_agg(task.id order by task.id)
  into v_current_task_ids
  from public.organization_tasks task
  where task.org_id = v_org_id
    and task.project_id = p_project_id;

  select array_agg(requested.task_id order by requested.task_id)
  into v_expected_task_ids
  from unnest(p_ordered_task_ids) as requested(task_id);

  if v_current_task_ids is distinct from v_expected_task_ids then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  update public.organization_tasks task
  set
    sort_order = (requested.ordinality - 1)::integer,
    updated_by = p_actor_id
  from unnest(p_ordered_task_ids) with ordinality as requested(id, ordinality)
  where task.id = requested.id
    and task.org_id = v_org_id
    and task.project_id = p_project_id;

  return jsonb_build_object(
    'ok', true,
    'projectId', p_project_id
  );
end;
$$;

revoke all on function public.reorder_organization_tasks_transition(
  uuid,
  uuid,
  uuid,
  uuid[]
) from public, anon, authenticated;

grant execute on function public.reorder_organization_tasks_transition(
  uuid,
  uuid,
  uuid,
  uuid[]
) to service_role;
