-- Forward repair for already-applied document activity triggers.
-- Only the service-role JWT may supply server-verified actor context. A normal
-- caller's headers cannot override its signed subject; system jobs stay null.
create or replace function public.organization_activity_actor_id()
returns uuid language sql stable set search_path = '' as $$
  select case when auth.role() = 'service_role'
    then (nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-coach-house-actor-id')::uuid
    else auth.uid()
  end;
$$;
revoke all on function public.organization_activity_actor_id() from public, anon, authenticated;

create or replace function public.record_organization_document_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  change record;
  previous_profile jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else coalesce(old.profile, '{}'::jsonb) end;
  event_kind text;
  document_title text;
begin
  for change in
    select coalesce(before.document_key, after.document_key) as key, before.document_value as previous, after.document_value as current
    from public.organization_activity_document_entries(previous_profile) before
    full join public.organization_activity_document_entries(coalesce(new.profile, '{}'::jsonb)) after using (document_key)
    where before.document_value is distinct from after.document_value
  loop
    -- Serialization may introduce untouched default roadmap sections. Do not call those edits.
    if change.previous is null and change.key like 'roadmap:%'
      and coalesce(change.current->>'content', '') = ''
      and coalesce(change.current->'budgetRows', '[]'::jsonb) in ('[]'::jsonb, 'null'::jsonb)
      and coalesce(change.current->>'imageUrl', '') = ''
      and coalesce(change.current->>'status', 'not_started') = 'not_started'
    then continue; end if;
    event_kind := case
      when change.current is null then 'removed'
      when change.key like 'upload:%' and (change.previous is null or change.previous->>'path' is distinct from change.current->>'path') then 'uploaded'
      when change.previous is null then 'created'
      else 'updated' end;
    document_title := left(coalesce(nullif(change.current->>'title', ''), nullif(change.previous->>'title', ''), nullif(change.current->>'name', ''), nullif(change.previous->>'name', ''), split_part(change.key, ':', 2)), 240);
    insert into public.organization_project_activity_events (org_id, entity_type, entity_id, event_type, title, actor_id, metadata)
    values (new.user_id, 'document', new.user_id, event_kind, document_title, public.organization_activity_actor_id(), jsonb_build_object('documentKey', change.key));
  end loop;
  return new;
end;
$$;

create or replace function public.record_organization_file_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  previous jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  current jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  item jsonb := coalesce(current, previous);
  event_kind text;
begin
  if not exists (select 1 from public.organizations where user_id = (item->>'org_id')::uuid) then
    return coalesce(new, old); -- Organization cascade deletion must remain possible.
  end if;
  -- Compliance uploads are already captured by their profile document mutation.
  if tg_table_name = 'organization_document_files' and item->>'document_kind' is not null then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' and (previous->>'deleted_at' is not null or previous->>'status' = 'trashed') then
    return old; -- Retention cleanup is not a second user removal.
  end if;
  if tg_op = 'UPDATE'
    and (previous - array['updated_at', 'last_checked_at', 'last_synced_at']) is not distinct from (current - array['updated_at', 'last_checked_at', 'last_synced_at'])
  then return new; end if;
  event_kind := case
    when tg_op = 'DELETE' then 'removed'
    when tg_op = 'INSERT' then 'uploaded'
    when (previous->>'deleted_at' is null and current->>'deleted_at' is not null) or (previous->>'status' is distinct from 'trashed' and current->>'status' = 'trashed') then 'removed'
    when (previous->>'deleted_at' is not null and current->>'deleted_at' is null) or (previous->>'status' = 'trashed' and current->>'status' is distinct from 'trashed') then 'restored'
    else 'updated' end;
  insert into public.organization_project_activity_events (org_id, project_id, entity_type, entity_id, event_type, title, actor_id, metadata)
  values ((item->>'org_id')::uuid, (select id from public.organization_projects where id = (item->>'project_id')::uuid), 'file', (item->>'id')::uuid, event_kind, left(coalesce(nullif(item->>'name', ''), 'File'), 240), public.organization_activity_actor_id(), jsonb_build_object('source', tg_table_name));
  return coalesce(new, old);
end;
$$;

