set check_function_bodies = off;
set search_path = public;

create or replace function public.update_organization_task_transition(
  p_actor_id uuid,
  p_task_id uuid,
  p_expected_org_id uuid,
  p_expected_project_id uuid,
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
  v_assignee_org_id uuid;
  v_next_sort_order integer;
  v_task public.organization_tasks%rowtype;
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
  where project.id in (v_task.project_id, p_project_id)
  order by project.id
  for update;

  select project.org_id
  into v_assignee_org_id
  from public.organization_projects project
  where project.id = p_project_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'project_not_found');
  end if;

  if p_assignee_id is not null
    and p_assignee_id <> v_assignee_org_id
    and not exists (
      select 1
      from public.organization_memberships membership
      where membership.org_id = v_assignee_org_id
        and membership.member_id = p_assignee_id
    )
    and not exists (
      select 1
      from public.platform_staff_members staff
      where staff.user_id = p_assignee_id
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_assignee');
  end if;

  if v_task.project_id is distinct from p_project_id then
    select coalesce(max(task.sort_order) + 1, 0)
    into v_next_sort_order
    from public.organization_tasks task
    where task.org_id = v_assignee_org_id
      and task.project_id = p_project_id;
  else
    v_next_sort_order := v_task.sort_order;
  end if;

  update public.organization_tasks
  set
    org_id = v_assignee_org_id,
    project_id = p_project_id,
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    task_type = p_task_type,
    status = p_status,
    start_date = p_start_date,
    end_date = p_end_date,
    priority = p_priority,
    tag_label = nullif(btrim(coalesce(p_tag_label, '')), ''),
    workstream_name = nullif(btrim(coalesce(p_workstream_name, '')), ''),
    sort_order = v_next_sort_order,
    updated_by = p_actor_id
  where id = v_task.id;

  delete from public.organization_task_assignees
  where task_id = v_task.id
    and (user_id is distinct from p_assignee_id or org_id is distinct from v_assignee_org_id);

  if p_assignee_id is not null then
    insert into public.organization_task_assignees (
      org_id,
      task_id,
      user_id,
      created_by
    ) values (
      v_assignee_org_id,
      v_task.id,
      p_assignee_id,
      p_actor_id
    ) on conflict (task_id, user_id) do nothing;
  end if;

  update public.organization_projects project
  set
    task_count = (
      select count(*)::integer
      from public.organization_tasks task
      where task.org_id = project.org_id
        and task.project_id = project.id
    ),
    updated_by = p_actor_id
  where project.id in (v_task.project_id, p_project_id);

  return jsonb_build_object(
    'ok', true,
    'taskId', v_task.id,
    'previousProjectId', v_task.project_id,
    'projectId', p_project_id
  );
end;
$$;

drop policy if exists "organization_tasks_update"
  on public.organization_tasks;

revoke all on function public.update_organization_task_transition(
  uuid,
  uuid,
  uuid,
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

grant execute on function public.update_organization_task_transition(
  uuid,
  uuid,
  uuid,
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

-- Only assignment changes emit notifications; task saves retain unchanged rows.
create or replace function public.notify_organization_task_assignment()
returns trigger language plpgsql security definer
set search_path = '' set row_security = off as $$
declare
  v_task public.organization_tasks%rowtype;
  v_project public.organization_projects%rowtype;
  v_actor_name text;
  v_assignee_name text;
  v_href text;
begin
  if tg_op = 'UPDATE' and new.user_id = old.user_id and new.task_id = old.task_id then
    return new;
  end if;
  select * into v_task from public.organization_tasks where id = new.task_id and org_id = new.org_id;
  if not found or v_task.created_source <> 'user' then return new; end if;
  select * into v_project from public.organization_projects where id = v_task.project_id;
  if not found or v_project.created_source in ('system', 'starter_seed') and v_project.project_kind <> 'organization_admin' then return new; end if;
  select coalesce(nullif(btrim(full_name), ''), email, 'A teammate') into v_actor_name
    from public.profiles where id = new.created_by;
  select coalesce(nullif(btrim(full_name), ''), email, 'a teammate') into v_assignee_name
    from public.profiles where id = new.user_id;
  v_href := case when v_project.project_kind = 'organization_admin' then '/organizations/' else '/projects/' end || v_project.id::text;

  insert into public.notifications(user_id, title, description, href, tone, type, org_id, actor_id, metadata)
  values(new.user_id, 'Task assigned to you',
    coalesce(v_actor_name, 'A teammate') || ' assigned you “' || v_task.title || '” in ' || v_project.name || '.',
    '/tasks', 'info', 'task_assigned', new.org_id, new.created_by,
    jsonb_build_object('taskId', new.task_id, 'projectId', v_task.project_id, 'assigneeId', new.user_id));

  if new.created_by is not null and new.created_by <> new.user_id
    and exists(select 1 from public.platform_staff_members where user_id = new.created_by) then
    insert into public.notifications(user_id, title, description, href, tone, type, org_id, actor_id, metadata)
    values(new.created_by, 'Task assignment confirmed',
      '“' || v_task.title || '” was assigned to ' || coalesce(v_assignee_name, 'a teammate') || ' in ' || v_project.name || '.',
      v_href, 'success', 'task_assignment_confirmed', new.org_id, new.created_by,
      jsonb_build_object('taskId', new.task_id, 'projectId', v_task.project_id, 'assigneeId', new.user_id));
  end if;
  return new;
end;
$$;
revoke all on function public.notify_organization_task_assignment() from public, anon, authenticated;
create trigger organization_task_assignment_notification
  after insert or update of user_id, task_id on public.organization_task_assignees
  for each row execute function public.notify_organization_task_assignment();

-- No historical notification backfill. Rollback: drop this trigger/function and
-- restore update_organization_task_transition from 20260805234500 if required.
