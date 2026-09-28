create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception '%', message; end if; end;
$$;
grant select, insert, update, delete on notifications to authenticated, service_role;
insert into organization_projects(id,org_id,name,status,start_date,end_date,created_source,created_by,updated_by)
values('00000000-0000-4000-8000-000000000110','00000000-0000-4000-8000-000000000001','Assignment project','active',null,null,'user','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001');
select public.create_organization_task_transition('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000110','Assignment test',null,'task','todo','2026-09-28','2026-09-29','medium',null,null,'00000000-0000-4000-8000-000000000002');
select pg_temp.assert_true((select count(*)=2 from notifications),'One notification for the assignee and one for assigning staff');
select pg_temp.assert_true((select user_id='00000000-0000-4000-8000-000000000002' and href='/tasks' and description like '%Assignment test%' from notifications where type='task_assigned'),'Assignee gets an actionable Tasks link');
select pg_temp.assert_true((select user_id='00000000-0000-4000-8000-000000000001' and href='/projects/00000000-0000-4000-8000-000000000110' and description like '%Assigned coach%' from notifications where type='task_assignment_confirmed'),'Assigning admin can open the project and see who received the task');
select public.update_organization_task_transition('00000000-0000-4000-8000-000000000001',id,org_id,project_id,project_id,'Renamed task',null,'task','todo',start_date,end_date,'high',null,null,'00000000-0000-4000-8000-000000000002') from organization_tasks where title='Assignment test';
select pg_temp.assert_true((select count(*)=2 from notifications),'Unrelated edits do not resend assignment notifications');
select public.update_organization_task_transition('00000000-0000-4000-8000-000000000001',id,org_id,project_id,project_id,title,null,'task','todo',start_date,end_date,'high',null,null,'00000000-0000-4000-8000-000000000001') from organization_tasks where title='Renamed task';
select pg_temp.assert_true((select count(*)=3 from notifications),'Reassignment sends a new notice, with no duplicate for self-assignment');
select pg_temp.assert_true((select count(*)=1 from organization_task_assignees a join organization_tasks t on t.id=a.task_id where t.title='Renamed task' and a.user_id='00000000-0000-4000-8000-000000000001'),'Old assignee is removed');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
select pg_temp.assert_true((select count(*)=0 from notifications),'Unrelated users cannot read assignment notifications');
select pg_temp.assert_true(not has_function_privilege(current_user,'public.notify_organization_task_assignment()','EXECUTE'),'Authenticated users cannot invoke the privileged notification helper');
reset role;
-- Notification failure must roll back task and assignment together.
alter table notifications add constraint test_assignment_failure check (description not like '%Must roll back%');
do $$ begin
  perform public.create_organization_task_transition('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000110','Must roll back',null,'task','todo','2026-09-28','2026-09-29','medium',null,null,'00000000-0000-4000-8000-000000000002');
  raise exception 'Expected notification failure';
exception when check_violation then null; end $$;
select pg_temp.assert_true((select count(*)=0 from organization_tasks where title='Must roll back'),'No partial task after notification failure');
alter table notifications drop constraint test_assignment_failure;
