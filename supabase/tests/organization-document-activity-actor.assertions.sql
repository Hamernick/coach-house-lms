-- PostgREST service-role requests have no authenticated subject.
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'service_role', false);
select set_config('request.headers', '{"x-coach-house-actor-id":"a0000000-0000-4000-8000-000000000001"}', false);
insert into organizations values ('10000000-0000-4000-8000-000000000001', '{}');
update organizations set profile = '{"roadmap":{"sections":[{"id":"mission","content":"staff edit"}]}}';
insert into organization_document_files values ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Library.pdf', null, null, now());
do $$ begin
 if (select count(*) from organization_project_activity_events) <> 2 or exists(select 1 from organization_project_activity_events where actor_id is distinct from 'a0000000-0000-4000-8000-000000000001'::uuid) then raise exception 'staff document/upload attribution failed'; end if;
end $$;
delete from organization_project_activity_events;
-- A second staff member edits/removes the first member's upload.
select set_config('request.headers', '{"x-coach-house-actor-id":"b0000000-0000-4000-8000-000000000002"}', false);
update organization_document_files set name = 'Renamed.pdf';
update organization_document_files set deleted_at = now();
update organization_document_files set deleted_at = null;
delete from organization_document_files;
insert into organization_external_documents values ('50000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Drive document', 'active', now(), now());
insert into organization_projects values ('60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001');
insert into organization_project_assets values ('70000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000006','Project file');
do $$ begin
 if (select count(*) from organization_project_activity_events) <> 6 or exists(select 1 from organization_project_activity_events where actor_id is distinct from 'b0000000-0000-4000-8000-000000000002'::uuid) then raise exception 'second staff/file lifecycle attribution failed'; end if;
end $$;
delete from organization_project_activity_events;
-- A normal user cannot spoof another actor through this header.
grant select, update on organizations to authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
set role authenticated;
update organizations set profile = jsonb_set(profile, '{roadmap,sections,0,content}', '"member edit"');
do $$ begin
 if (select count(*) from organization_project_activity_events) <> 1 or exists(select 1 from organization_project_activity_events where actor_id is distinct from auth.uid()) then raise exception 'forged actor header accepted'; end if;
 begin perform public.organization_activity_actor_id(); raise exception 'direct actor helper access allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from organization_project_activity_events;
-- Unattributed background work must not inherit a previous request's actor.
select set_config('request.jwt.claim.role', 'service_role', false);
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.headers', '{}', false);
update organizations set profile = jsonb_set(profile, '{roadmap,sections,0,content}', '"system edit"');
do $$ begin
 if (select count(*) from organization_project_activity_events) <> 1 or exists(select 1 from organization_project_activity_events where actor_id is not null) then raise exception 'actor leaked into system request'; end if;
end $$;
delete from organizations;
