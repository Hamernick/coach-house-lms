-- Refuse rollback if people have edited imported work or added content to it.
create function public.rollback_task_tracker_batch(p_batch_id uuid)
returns jsonb language plpgsql security definer set search_path = '' set row_security = off as $$
declare b public.task_tracker_import_batches%rowtype; item jsonb; version timestamptz;
begin
  select * into strict b from public.task_tracker_import_batches where id = p_batch_id for update;
  perform pg_advisory_xact_lock(hashtextextended(b.namespace, 0));
  if b.status = 'rolled_back' then return jsonb_build_object('batchId',b.id,'status',b.status); end if;
  if b.status <> 'complete' or jsonb_array_length(b.manifest->'links') <> 0 then
    raise exception 'Batch is not eligible for automatic rollback';
  end if;
  for item in select value from jsonb_array_elements((b.manifest->'records') || (b.manifest->'auxiliaryRecords')) loop
    if item->>'nativeType' = 'project' then
      select updated_at into strict version from public.organization_projects where id = (item->>'destinationId')::uuid for update;
    elsif item->>'nativeType' = 'task' then
      select updated_at into strict version from public.organization_tasks where id = (item->>'destinationId')::uuid for update;
    elsif item->>'nativeType' = 'note' then
      select updated_at into strict version from public.organization_project_notes where id = (item->>'destinationId')::uuid for update;
    else continue;
    end if;
    if not exists(select 1 from public.task_tracker_import_records r where r.batch_id = b.id
      and r.entity_type = item->>'entityType' and r.source_id = item->>'sourceId' and r.destination_version = version)
    then raise exception 'Imported content changed; manual recovery required: %', item->>'destinationId'; end if;
  end loop;
  -- A newly added child may not touch the parent's updated_at. Never cascade it away.
  if exists(select 1 from public.organization_tasks t where t.project_id in
      (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'projects'))
      and t.id not in (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'tasks')))
    or exists(select 1 from public.organization_project_notes n where n.project_id in
      (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'projects'))
      and n.id not in (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'notes')))
    or exists(select 1 from public.organization_project_assets a where a.project_id in
      (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'projects')))
    or exists(select 1 from public.organization_project_quick_links l where l.project_id in
      (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'projects')))
    or exists(select 1 from public.organization_project_overview_documents d where d.project_id in
      (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'projects')))
  then raise exception 'Imported projects contain new content; manual recovery required'; end if;
  -- Also catch direct assignment changes that do not update the task timestamp.
  for item in select value from jsonb_array_elements(b.manifest->'tasks') loop
    if (select count(*) from public.organization_task_assignees where task_id = (item->>'id')::uuid) <>
        (case when item->>'assigneeId' is null then 0 else 1 end)
      or exists(select 1 from public.organization_task_assignees where task_id = (item->>'id')::uuid
        and user_id is distinct from (item->>'assigneeId')::uuid)
    then raise exception 'Task assignments changed; manual recovery required'; end if;
  end loop;
  update public.task_tracker_import_batches set status = 'applying' where id = b.id;
  perform set_config('app.task_tracker_import_batch', b.id::text, true);
  delete from public.organization_projects where org_id = b.org_id and id in
    (select (value->>'id')::uuid from jsonb_array_elements(b.manifest->'projects'));
  insert into public.organization_project_activity_events(org_id, entity_type, entity_id, event_type, title, actor_id, metadata)
    values(b.org_id, 'project', b.id, 'deleted', 'Rolled back Coach House tracker import', b.actor_id, jsonb_build_object('importBatchId', b.id));
  update public.task_tracker_import_batches set status = 'rolled_back' where id = b.id;
  perform set_config('app.task_tracker_import_batch', '', true);
  return jsonb_build_object('batchId',b.id,'status','rolled_back');
end;
$$;
revoke all on function public.rollback_task_tracker_batch(uuid) from public, anon, authenticated;
grant execute on function public.rollback_task_tracker_batch(uuid) to service_role;
