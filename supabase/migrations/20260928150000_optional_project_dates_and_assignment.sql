-- Dates and the displayed organization assignment are optional. org_id remains
-- the security/ownership boundary for projects and their dependent records.
-- Unassigned projects retain their owning organization and existing RLS.
alter table public.organization_projects
  alter column start_date drop not null,
  alter column end_date drop not null,
  add column organization_unassigned boolean not null default false,
  add constraint organization_projects_unassigned_standard_check check (
    not organization_unassigned or (project_kind = 'standard' and canonical_org_id is null)
  );
comment on column public.organization_projects.organization_unassigned is
  'No displayed organization assignment; org_id still controls ownership and authorization.';

set check_function_bodies = off;
set search_path = public;

create or replace function public.create_organization_project_transition(
  p_actor_id uuid,
  p_org_id uuid,
  p_project jsonb,
  p_has_overview_document boolean,
  p_overview_document_html text,
  p_overview_document_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_project public.organization_projects%rowtype;
  v_project_id uuid;
begin
  if p_actor_id is null or p_org_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  perform 1
  from public.organizations
  where user_id = p_org_id
  for key share;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'organization_not_found');
  end if;

  v_project := jsonb_populate_record(
    null::public.organization_projects,
    p_project
  );

  if nullif(btrim(coalesce(v_project.name, '')), '') is null
    or v_project.status not in (
      'backlog', 'planned', 'active', 'cancelled', 'completed'
    )
    or v_project.priority not in ('urgent', 'high', 'medium', 'low')
    or v_project.end_date < v_project.start_date then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  if coalesce(p_has_overview_document, false)
    and (
      p_overview_document_html is null
      or p_overview_document_text is null
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_overview');
  end if;

  insert into public.organization_projects (
    organization_unassigned,
    recurrence,
    recurrence_anchor_start,
    recurrence_anchor_end,
    client_name,
    created_by,
    created_source,
    description,
    duration_label,
    end_date,
    member_labels,
    name,
    org_id,
    priority,
    progress,
    project_kind,
    start_date,
    status,
    tags,
    task_count,
    type_label,
    updated_by
  ) values (
    coalesce(v_project.organization_unassigned, false),
    coalesce(v_project.recurrence, 'none'),
    v_project.start_date,
    v_project.end_date,
    v_project.client_name,
    p_actor_id,
    'user',
    v_project.description,
    v_project.duration_label,
    v_project.end_date,
    coalesce(v_project.member_labels, '{}'::text[]),
    btrim(v_project.name),
    p_org_id,
    v_project.priority,
    0,
    'standard',
    v_project.start_date,
    v_project.status,
    coalesce(v_project.tags, '{}'::text[]),
    0,
    v_project.type_label,
    p_actor_id
  )
  returning id into v_project_id;

  if coalesce(p_has_overview_document, false) then
    insert into public.organization_project_overview_documents (
      created_by,
      document_html,
      document_text,
      org_id,
      project_id,
      updated_by
    ) values (
      p_actor_id,
      p_overview_document_html,
      p_overview_document_text,
      p_org_id,
      v_project_id,
      p_actor_id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'projectId', v_project_id
  );
end;
$$;

revoke all on function public.create_organization_project_transition(uuid, uuid, jsonb, boolean, text, text)
  from public, anon, authenticated;

grant execute on function public.create_organization_project_transition(uuid, uuid, jsonb, boolean, text, text)
  to service_role;

set check_function_bodies = off;
set search_path = public;

create or replace function public.update_organization_project_transition(
  p_project_id uuid,
  p_actor_id uuid,
  p_expected_org_id uuid,
  p_expected_updated_at timestamptz,
  p_project jsonb,
  p_has_overview_document boolean,
  p_overview_document_html text,
  p_overview_document_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_existing public.organization_projects%rowtype;
  v_project public.organization_projects%rowtype;
  v_updated_at timestamptz := now();
begin
  if p_actor_id is null or p_expected_org_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  select *
  into v_existing
  from public.organization_projects
  where id = p_project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_existing.org_id <> p_expected_org_id then
    return jsonb_build_object('ok', false, 'code', 'scope_changed');
  end if;

  if p_expected_updated_at is null
    or v_existing.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  v_project := jsonb_populate_record(
    null::public.organization_projects,
    p_project
  );

  if nullif(btrim(coalesce(v_project.name, '')), '') is null
    or v_project.status not in (
      'backlog', 'planned', 'active', 'cancelled', 'completed'
    )
    or v_project.priority not in ('urgent', 'high', 'medium', 'low')
    or v_project.end_date < v_project.start_date then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  if coalesce(p_has_overview_document, false)
    and (
      p_overview_document_html is null
      or p_overview_document_text is null
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_overview');
  end if;

  update public.organization_projects
  set
    organization_unassigned = coalesce(v_project.organization_unassigned, v_existing.organization_unassigned),
    recurrence = coalesce(v_project.recurrence, v_existing.recurrence),
    recurrence_anchor_start = case when v_project.start_date is distinct from v_existing.start_date
      or v_project.end_date is distinct from v_existing.end_date then v_project.start_date else v_existing.recurrence_anchor_start end,
    recurrence_anchor_end = case when v_project.start_date is distinct from v_existing.start_date
      or v_project.end_date is distinct from v_existing.end_date then v_project.end_date else v_existing.recurrence_anchor_end end,
    recurrence_occurrence = case when v_project.start_date is distinct from v_existing.start_date
      or v_project.end_date is distinct from v_existing.end_date then 0 else v_existing.recurrence_occurrence end,
    client_name = v_project.client_name,
    description = v_project.description,
    duration_label = v_project.duration_label,
    end_date = v_project.end_date,
    member_labels = coalesce(v_project.member_labels, '{}'::text[]),
    name = btrim(v_project.name),
    priority = v_project.priority,
    start_date = v_project.start_date,
    status = v_project.status,
    tags = coalesce(v_project.tags, '{}'::text[]),
    type_label = v_project.type_label,
    updated_at = v_updated_at,
    updated_by = p_actor_id
  where id = v_existing.id;

  if coalesce(p_has_overview_document, false) then
    insert into public.organization_project_overview_documents (
      created_by,
      document_html,
      document_text,
      org_id,
      project_id,
      updated_by
    ) values (
      p_actor_id,
      p_overview_document_html,
      p_overview_document_text,
      v_existing.org_id,
      v_existing.id,
      p_actor_id
    )
    on conflict (org_id, project_id) do update
    set
      document_html = excluded.document_html,
      document_text = excluded.document_text,
      updated_by = excluded.updated_by;
  end if;

  return jsonb_build_object(
    'ok', true,
    'projectId', v_existing.id,
    'updatedAt', v_updated_at
  );
end;
$$;

revoke all on function public.update_organization_project_transition(uuid, uuid, uuid, timestamptz, jsonb, boolean, text, text)
  from public, anon, authenticated;

grant execute on function public.update_organization_project_transition(uuid, uuid, uuid, timestamptz, jsonb, boolean, text, text)
  to service_role;

create or replace function public.create_guided_organization_project(
  p_actor_id uuid, p_org_id uuid, p_request_id uuid, p_setup jsonb,
  p_member_labels text[], p_overview_html text, p_overview_text text
) returns jsonb language plpgsql security definer
set search_path = '' set row_security = off as $$
declare
  v_result jsonb;
  v_project_id uuid;
  v_existing public.organization_projects%rowtype;
  v_task jsonb;
  v_file jsonb;
  v_task_id uuid;
  v_position integer := 0;
begin
  if p_actor_id is null or p_org_id is null or p_request_id is null then
    raise exception 'Invalid creation request';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text, 0));
  select * into v_existing from public.organization_projects where creation_request_id = p_request_id;
  if found then
    if v_existing.org_id <> p_org_id or v_existing.created_by is distinct from p_actor_id then
      raise exception 'Creation request belongs to another actor or organization';
    end if;
    return jsonb_build_object('ok', true, 'projectId', v_existing.id);
  end if;
  if jsonb_typeof(p_setup->'tasks') <> 'array' or jsonb_typeof(p_setup->'files') <> 'array'
    or jsonb_array_length(p_setup->'tasks') > 50 or jsonb_array_length(p_setup->'files') > 30 then
    raise exception 'Invalid setup';
  end if;
  v_result := public.create_organization_project_transition(
    p_actor_id, p_org_id,
    jsonb_build_object('organization_unassigned', nullif(p_setup->>'organizationId', '') is null, 'recurrence', coalesce(p_setup->>'recurrence', 'none'), 'name', p_setup->>'name', 'description', p_overview_html,
      'status', 'planned', 'priority', 'medium', 'start_date', nullif(p_setup->>'startDate', ''),
      'end_date', nullif(p_setup->>'endDate', ''), 'member_labels', to_jsonb(p_member_labels),
      'tags', '[]'::jsonb, 'type_label', 'Project'),
    true, p_overview_html, p_overview_text
  );
  if not coalesce((v_result->>'ok')::boolean, false) then return v_result; end if;
  v_project_id := (v_result->>'projectId')::uuid;
  update public.organization_projects set guided_setup = p_setup, creation_request_id = p_request_id where id = v_project_id;
  for v_task in select value from jsonb_array_elements(p_setup->'tasks') loop
    if (v_task->>'startDate')::date < (nullif(p_setup->>'startDate', ''))::date
      or (v_task->>'endDate')::date > (nullif(p_setup->>'endDate', ''))::date
      or (v_task->>'endDate')::date < (v_task->>'startDate')::date then
      raise exception 'Task dates must fall within project dates';
    end if;
    insert into public.organization_tasks(org_id, project_id, title, task_type, status,
      start_date, end_date, priority, workstream_name, sort_order, created_source, created_by, updated_by)
    values(p_org_id, v_project_id, v_task->>'title', 'task', 'todo',
      (v_task->>'startDate')::date, (v_task->>'endDate')::date, 'medium', v_task->>'workstream',
      v_position, 'user', p_actor_id, p_actor_id) returning id into v_task_id;
    if nullif(v_task->>'assigneeId', '') is not null then
      insert into public.organization_task_assignees(org_id, task_id, user_id, created_by)
      values(p_org_id, v_task_id, (v_task->>'assigneeId')::uuid, p_actor_id);
    end if;
    v_position := v_position + 1;
  end loop;
  for v_file in select value from jsonb_array_elements(p_setup->'files') loop
    if v_file->>'id' !~ '^[a-zA-Z0-9_-]{10,200}$' then raise exception 'Invalid Drive file'; end if;
    insert into public.organization_project_assets(org_id, project_id, name, asset_type, external_url, created_by, updated_by)
    values(p_org_id, v_project_id, v_file->>'name', 'file',
      'https://drive.google.com/file/d/' || (v_file->>'id') || '/view', p_actor_id, p_actor_id);
  end loop;
  update public.organization_projects set task_count = v_position where id = v_project_id;
  return jsonb_build_object('ok', true, 'projectId', v_project_id);
end;
$$;
revoke all on function public.create_guided_organization_project(uuid, uuid, uuid, jsonb, text[], text, text) from public, anon, authenticated;
grant execute on function public.create_guided_organization_project(uuid, uuid, uuid, jsonb, text[], text, text) to service_role;

-- Keep monthly anchors aligned when the timeline or date editor changes a schedule.
create or replace function public.confirm_changed_project_schedule()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date then
    new.schedule_confirmed := new.start_date is not null and new.end_date is not null;
    new.recurrence_anchor_start := new.start_date;
    new.recurrence_anchor_end := new.end_date;
    new.recurrence_occurrence := 0;
  end if;
  return new;
end;
$$;

create or replace function public.generate_next_monthly_project()
returns trigger language plpgsql security definer
set search_path = '' set row_security = off as $$
declare
  v_project public.organization_projects%rowtype;
  v_task public.organization_tasks%rowtype;
  v_next_id uuid;
  v_task_id uuid;
  v_start date;
  v_end date;
  v_occurrence integer;
  v_task_start_anchor date;
  v_task_end_anchor date;
begin
  -- Re-read after all statements in the transaction, including option/overview updates.
  select * into v_project from public.organization_projects where id = new.id for update;
  if not found or v_project.status <> 'completed' or v_project.recurrence <> 'monthly'
    or v_project.recurrence_generated or v_project.project_kind <> 'standard'
    or v_project.canonical_org_id is not null then return null; end if;

  v_occurrence := v_project.recurrence_occurrence + 1;
  v_start := (coalesce(v_project.recurrence_anchor_start, v_project.start_date)
    + make_interval(months => v_occurrence))::date;
  v_end := (coalesce(v_project.recurrence_anchor_end, v_project.end_date)
    + make_interval(months => v_occurrence))::date;

  insert into public.organization_projects(org_id, organization_unassigned, project_kind, name, description,
    status, priority, progress, start_date, end_date, client_name, type_label,
    duration_label, tags, member_labels, task_count, created_source, created_by, updated_by,
    schedule_confirmed, option_settings, recurrence, recurrence_anchor_start,
    recurrence_anchor_end, recurrence_occurrence)
  values(v_project.org_id, v_project.organization_unassigned, 'standard', v_project.name, v_project.description,
    'planned', v_project.priority, 0, v_start, v_end, v_project.client_name, v_project.type_label,
    v_project.duration_label, v_project.tags, v_project.member_labels, 0, 'user',
    v_project.updated_by, v_project.updated_by, true, v_project.option_settings, 'monthly',
    coalesce(v_project.recurrence_anchor_start, v_project.start_date),
    coalesce(v_project.recurrence_anchor_end, v_project.end_date), v_occurrence)
  returning id into v_next_id;

  for v_task in select * from public.organization_tasks
    where project_id = v_project.id and org_id = v_project.org_id order by sort_order, id loop
    v_task_start_anchor := v_task.recurrence_anchor_start;
    v_task_end_anchor := v_task.recurrence_anchor_end;
    -- Keep the original calendar day through short months; honor later task edits.
    if v_task_start_anchor is null or least(v_project.end_date, greatest(v_project.start_date,
      (v_task_start_anchor + make_interval(months => v_project.recurrence_occurrence))::date)) <> v_task.start_date then
      v_task_start_anchor := (v_task.start_date - make_interval(months => v_project.recurrence_occurrence))::date;
    end if;
    if v_task_end_anchor is null or least(v_project.end_date, greatest(v_project.start_date,
      (v_task_end_anchor + make_interval(months => v_project.recurrence_occurrence))::date)) <> v_task.end_date then
      v_task_end_anchor := (v_task.end_date - make_interval(months => v_project.recurrence_occurrence))::date;
    end if;
    insert into public.organization_tasks(org_id, project_id, title, description, task_type,
      status, start_date, end_date, priority, tag_label, workstream_name, sort_order,
      created_source, created_by, updated_by, recurrence_anchor_start, recurrence_anchor_end)
    values(v_project.org_id, v_next_id, v_task.title, v_task.description, v_task.task_type,
      'todo', least(v_end, greatest(v_start, (v_task_start_anchor + make_interval(months => v_occurrence))::date)),
      least(v_end, greatest(v_start, (v_task_end_anchor + make_interval(months => v_occurrence))::date)),
      v_task.priority, v_task.tag_label, v_task.workstream_name, v_task.sort_order,
      'user', v_project.updated_by, v_project.updated_by, v_task_start_anchor, v_task_end_anchor)
    returning id into v_task_id;
    insert into public.organization_task_assignees(org_id, task_id, user_id, created_by)
      select v_project.org_id, v_task_id, user_id, v_project.updated_by
      from public.organization_task_assignees
      where task_id = v_task.id and org_id = v_project.org_id;
  end loop;

  insert into public.organization_project_overview_documents(org_id, project_id, document_html,
    document_text, created_by, updated_by)
    select org_id, v_next_id, document_html, document_text, v_project.updated_by, v_project.updated_by
    from public.organization_project_overview_documents
    where project_id = v_project.id and org_id = v_project.org_id;

  update public.organization_projects set task_count = (
    select count(*) from public.organization_tasks where project_id = v_next_id
  ) where id = v_next_id;
  -- Persist even if the next occurrence is later deleted; reopening cannot duplicate it.
  update public.organization_projects set recurrence_generated = true where id = v_project.id;
  return null;
end;
$$;
revoke all on function public.generate_next_monthly_project() from public, anon, authenticated;

create or replace function public.update_organization_project_schedule_transition(
  p_project_id uuid,
  p_actor_id uuid,
  p_expected_org_id uuid,
  p_expected_updated_at timestamptz,
  p_start_date date,
  p_end_date date
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
  if p_end_date < p_start_date then
    return jsonb_build_object('ok', false, 'code', 'invalid_schedule');
  end if;

  select * into v_project
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
    schedule_confirmed = p_start_date is not null and p_end_date is not null,
    start_date = p_start_date,
    end_date = p_end_date,
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

revoke all on function public.update_organization_project_schedule_transition(uuid, uuid, uuid, timestamptz, date, date)
  from public, anon, authenticated;

grant execute on function public.update_organization_project_schedule_transition(uuid, uuid, uuid, timestamptz, date, date)
  to service_role;

-- Rollback: restore transition/generator definitions from 20260928090000 and
-- the schedule transition from 20260920103000. Keep dates nullable until every
-- newly undated project has an explicitly chosen schedule; never invent dates
-- or delete projects to restore NOT NULL. Keep the assignment flag while the
-- current app is running. No existing project contents or access grants change.
