-- One transaction per reviewed manifest; private service-role operation only.
create function public.import_task_tracker_batch(p_manifest_text text)
returns jsonb language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  m jsonb := p_manifest_text::jsonb;
  batch uuid := (m->>'batchId')::uuid;
  tenant uuid := (m->>'orgId')::uuid;
  actor uuid := (m->>'actorId')::uuid;
  v_namespace text := m->>'namespace';
  fingerprint text := encode(sha256(convert_to(p_manifest_text, 'UTF8')), 'hex');
  prior public.task_tracker_import_batches%rowtype;
  item jsonb; destination uuid; version timestamptz; v_result jsonb;
begin
  if tenant is null or actor is null or v_namespace is null or m->>'sourceHash' is null
    or jsonb_typeof(m->'records') is distinct from 'array'
    or jsonb_typeof(m->'projects') is distinct from 'array'
    or jsonb_typeof(m->'tasks') is distinct from 'array'
    or jsonb_typeof(m->'notes') is distinct from 'array'
    or m->'links' is distinct from '[]'::jsonb
    or tenant <> 'c5405481-cea7-418a-b0c3-531ec942c047'::uuid
    or v_namespace <> 'coach-house-tracker-20260928'
    or length(m->>'sourceHash') <> 64
    or jsonb_array_length(m->'records') <> 348
    or not exists(select 1 from public.platform_staff_members where user_id = actor and access_level = 'developer')
  then raise exception 'Unapproved tracker import scope'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_namespace, 0));
  select * into prior from public.task_tracker_import_batches b where b.namespace = v_namespace and b.source_hash = m->>'sourceHash';
  if found then
    if prior.manifest_hash = fingerprint and prior.status = 'complete' then return prior.result; end if;
    raise exception 'Batch already exists with a different manifest or state';
  end if;
  insert into public.task_tracker_import_batches(id, namespace, source_hash, manifest_hash, org_id, actor_id, status, manifest)
    values(batch, v_namespace, m->>'sourceHash', fingerprint, tenant, actor, 'applying', m);
  perform set_config('app.task_tracker_import_batch', batch::text, true);
  for item in select value from jsonb_array_elements(m->'projects') loop
    insert into public.organization_projects(id, org_id, name, description, status, priority, start_date, end_date,
      project_kind, created_source, created_by, updated_by, client_name, type_label, tags, member_labels,
      tracker_metadata, schedule_confirmed)
    values((item->>'id')::uuid, tenant, item->>'name', item->>'description', item->>'status', item->>'priority',
      (item->>'startDate')::date, (item->>'endDate')::date, 'standard', 'user', actor, actor, 'Coach House',
      item->>'typeLabel', array(select jsonb_array_elements_text(item->'tags')),
      array(select jsonb_array_elements_text(item->'members')), item->'tracker', false);
  end loop;
  for item in select value from jsonb_array_elements(m->'tasks') loop
    if not exists(select 1 from public.organization_projects where id = (item->>'projectId')::uuid
      and id in (select (value->>'id')::uuid from jsonb_array_elements(m->'projects')) and org_id = tenant and project_kind = 'standard')
      then raise exception 'Task parent outside import tenant'; end if;
    insert into public.organization_tasks(id, org_id, project_id, title, description, status, start_date, end_date,
      priority, tag_label, workstream_name, sort_order, created_source, created_by, updated_by, tracker_metadata)
    values((item->>'id')::uuid, tenant, (item->>'projectId')::uuid, item->>'title', item->>'description', item->>'status',
      (item->>'startDate')::date, (item->>'endDate')::date, item->>'priority', item->>'workArea', item->>'workArea',
      (item->>'sortOrder')::integer, 'user', actor, actor, item->'tracker');
    if item->>'assigneeId' is not null then
      if not exists(select 1 from public.platform_staff_members where user_id = (item->>'assigneeId')::uuid)
        then raise exception 'Unresolved task assignee'; end if;
      insert into public.organization_task_assignees(org_id, task_id, user_id, created_by)
        values(tenant, (item->>'id')::uuid, (item->>'assigneeId')::uuid, actor);
    end if;
  end loop;
  for item in select value from jsonb_array_elements(m->'notes') loop
    if not exists(select 1 from public.organization_projects where id = (item->>'projectId')::uuid
      and id in (select (value->>'id')::uuid from jsonb_array_elements(m->'projects')) and org_id = tenant)
      then raise exception 'Reference parent outside import tenant'; end if;
    insert into public.organization_project_notes(id, org_id, project_id, title, content, created_by, updated_by)
      values((item->>'id')::uuid, tenant, (item->>'projectId')::uuid, item->>'title', item->>'content', actor, actor);
  end loop;
  update public.organization_projects p set
    task_count = (select count(*) from public.organization_tasks t where t.project_id = p.id),
    progress = coalesce((select round(100.0 * count(*) filter(where t.status = 'done') / nullif(count(*),0))::integer
      from public.organization_tasks t where t.project_id = p.id),0)
    where p.org_id = tenant and p.id in (select (value->>'projectId')::uuid from jsonb_array_elements(m->'tasks'));
  for item in select value from jsonb_array_elements((m->'records') || (m->'auxiliaryRecords')) loop
    destination := (item->>'destinationId')::uuid;
    version := null;
    if item->>'nativeType' = 'project' then
      select updated_at into strict version from public.organization_projects where id = destination and org_id = tenant;
    elsif item->>'nativeType' = 'task' then
      select updated_at into strict version from public.organization_tasks where id = destination and org_id = tenant;
    elsif item->>'nativeType' = 'note' then
      select updated_at into strict version from public.organization_project_notes where id = destination and org_id = tenant;
    end if;
    insert into public.task_tracker_import_records(namespace, entity_type, source_id, batch_id, source_row,
      source_payload, disposition, reason, destination_id, destination_version)
      values(v_namespace, item->>'entityType', item->>'sourceId', batch, (item->>'sourceRow')::integer,
        item->'source', item->>'disposition', item->>'reason', destination, version);
  end loop;
  v_result := jsonb_build_object('batchId',batch,'sourceRecords',jsonb_array_length(m->'records'),
    'projectsCreated',jsonb_array_length(m->'projects'),'tasksCreated',jsonb_array_length(m->'tasks'),
    'notesCreated',jsonb_array_length(m->'notes'));
  insert into public.organization_project_activity_events(org_id, project_id, entity_type, entity_id, event_type, title, actor_id, metadata)
    values(tenant, (m->'projects'->0->>'id')::uuid, 'project', batch, 'updated', 'Imported Coach House tracker', actor,
      jsonb_build_object('importBatchId', batch, 'projects', jsonb_array_length(m->'projects'), 'tasks', jsonb_array_length(m->'tasks')));
  update public.task_tracker_import_batches set status = 'complete', completed_at = now(), result = v_result where id = batch;
  perform set_config('app.task_tracker_import_batch', '', true);
  return v_result;
end;
$$;
revoke all on function public.import_task_tracker_batch(text) from public, anon, authenticated;
grant execute on function public.import_task_tracker_batch(text) to service_role;
