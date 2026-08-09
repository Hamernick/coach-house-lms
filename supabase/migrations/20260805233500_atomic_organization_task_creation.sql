set check_function_bodies = off;
set search_path = public;

create or replace function public.create_organization_task_transition(
  p_actor_id uuid,
  p_project_id uuid,
  p_title text,
  p_description text,
  p_task_type text,
  p_status text,
  p_start_date date,
  p_end_date date,
  p_priority text,
  p_tag_label text,
  p_workstream_name text,
  p_assignee_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_org_id uuid;
  v_sort_order integer;
  v_task_id uuid;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_title');
  end if;

  if p_task_type not in ('bug', 'improvement', 'task')
    or p_status not in ('todo', 'in-progress', 'done')
    or p_priority not in ('no-priority', 'low', 'medium', 'high', 'urgent')
    or p_start_date is null
    or p_end_date is null
    or p_end_date < p_start_date then
    return jsonb_build_object('ok', false, 'code', 'invalid_task');
  end if;

  select project.org_id
  into v_org_id
  from public.organization_projects project
  where project.id = p_project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'project_not_found');
  end if;

  if p_assignee_id is not null
    and p_assignee_id <> v_org_id
    and not exists (
      select 1
      from public.organization_memberships membership
      where membership.org_id = v_org_id
        and membership.member_id = p_assignee_id
    )
    and not exists (
      select 1
      from public.platform_staff_members staff
      where staff.user_id = p_assignee_id
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_assignee');
  end if;

  select coalesce(max(task.sort_order) + 1, 0)
  into v_sort_order
  from public.organization_tasks task
  where task.org_id = v_org_id
    and task.project_id = p_project_id;

  insert into public.organization_tasks (
    org_id,
    project_id,
    title,
    description,
    task_type,
    status,
    start_date,
    end_date,
    priority,
    tag_label,
    workstream_name,
    sort_order,
    created_source,
    created_by,
    updated_by
  ) values (
    v_org_id,
    p_project_id,
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_task_type,
    p_status,
    p_start_date,
    p_end_date,
    p_priority,
    nullif(btrim(coalesce(p_tag_label, '')), ''),
    nullif(btrim(coalesce(p_workstream_name, '')), ''),
    v_sort_order,
    'user',
    p_actor_id,
    p_actor_id
  )
  returning id into v_task_id;

  if p_assignee_id is not null then
    insert into public.organization_task_assignees (
      org_id,
      task_id,
      user_id,
      created_by
    ) values (
      v_org_id,
      v_task_id,
      p_assignee_id,
      p_actor_id
    );
  end if;

  update public.organization_projects
  set
    task_count = (
      select count(*)::integer
      from public.organization_tasks task
      where task.org_id = v_org_id
        and task.project_id = p_project_id
    ),
    updated_by = p_actor_id
  where id = p_project_id
    and org_id = v_org_id;

  return jsonb_build_object(
    'ok', true,
    'taskId', v_task_id,
    'projectId', p_project_id
  );
end;
$$;

drop policy if exists "organization_tasks_insert"
  on public.organization_tasks;

revoke all on function public.create_organization_task_transition(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  uuid
) from public, anon, authenticated;

grant execute on function public.create_organization_task_transition(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  uuid
) to service_role;
