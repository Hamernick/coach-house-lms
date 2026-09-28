create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception '%', message; end if; end;
$$;
insert into profiles values ('00000000-0000-4000-8000-000000000001','member'), ('00000000-0000-4000-8000-000000000002','member');
insert into organizations select id from profiles;
insert into organization_projects(id,org_id,name,status,start_date,end_date,created_by,updated_by,recurrence,recurrence_anchor_start,recurrence_anchor_end)
values('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','Monthly finance','active','2027-01-01','2027-01-31',
 '00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','monthly','2027-01-01','2027-01-31');
insert into organization_tasks(id,org_id,project_id,title,status,start_date,end_date,created_by)
values('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010','Balance checkbook','done','2027-01-01','2027-01-31','00000000-0000-4000-8000-000000000001');
insert into organization_task_assignees(org_id,task_id,user_id,created_by) values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001');

insert into platform_admin_project_workstream_states(owner_id,project_id,category_id)
values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000030');
-- Ordinary authorized updates exercise the same trigger as both protected RPCs.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
update organization_projects set status='completed' where id='00000000-0000-4000-8000-000000000010';
reset role;
select pg_temp.assert_true((select count(*)=2 from organization_projects),'One next occurrence');
select pg_temp.assert_true((select count(*)=1 from platform_admin_project_workstream_states),'Next occurrence uses its planned status instead of inheriting a completed board column');
select pg_temp.assert_true((select start_date='2027-02-01' and end_date='2027-02-28' and status='planned' and progress=0 and task_count=1 from organization_projects where recurrence_occurrence=1),'February dates and reset state');
select pg_temp.assert_true((select count(*)=1 from organization_tasks t join organization_projects p on p.id=t.project_id where p.recurrence_occurrence=1 and t.status='todo' and t.end_date='2027-02-28'),'Fresh tasks with shifted dates');
select pg_temp.assert_true((select count(*)=2 from organization_task_assignees),'Assignees copied');
select pg_temp.assert_true((select status='done' from organization_tasks where id='00000000-0000-4000-8000-000000000020'),'Completed history unchanged');
update organization_projects set status='active' where recurrence_occurrence=0;
update organization_projects set status='completed' where recurrence_occurrence=0;
select pg_temp.assert_true((select count(*)=2 from organization_projects),'Reopening cannot duplicate');
update organization_projects set status='completed' where recurrence_occurrence=1;
select pg_temp.assert_true((select end_date='2027-03-31' from organization_projects where recurrence_occurrence=2),'Month-end anchor survives February');
update organization_projects set status='cancelled' where recurrence_occurrence=2;
select pg_temp.assert_true((select count(*)=3 from organization_projects),'Cancellation creates nothing');
update organization_projects set recurrence='none', status='completed' where recurrence_occurrence=2;
select pg_temp.assert_true((select count(*)=3 from organization_projects),'Stopping recurrence creates nothing');

-- Other tenants cannot read or transition this series, or call service RPCs.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
select pg_temp.assert_true((select count(*)=0 from organization_projects),'Project tenant isolation');
select pg_temp.assert_true((select count(*)=0 from organization_tasks),'Task tenant isolation');
update organization_projects set status='active';
select pg_temp.assert_true(not has_function_privilege(current_user,'public.update_organization_project_transition(uuid,uuid,uuid,timestamptz,jsonb,boolean,text,text)','EXECUTE'),'RPC inaccessible to members');
select pg_temp.assert_true(not has_function_privilege(current_user,'public.generate_next_monthly_project()','EXECUTE'),'Trigger helper inaccessible');
reset role;
select pg_temp.assert_true((select bool_and(status='completed') from organization_projects),'Unauthorized update leaves rows unchanged');

-- Atomic edit handles recurrence and completion together, including options wrappers.
select update_organization_project_with_options(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,
 jsonb_build_object('name',name,'status','active','priority',priority,'start_date',start_date,'end_date',end_date,'recurrence','monthly','option_settings',jsonb_build_object('tags','[]'::jsonb,'sprintTypes','[]'::jsonb)),false,null,null)
from organization_projects where recurrence_occurrence=2;
select update_organization_project_with_options(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,
 jsonb_build_object('name',name,'status','completed','priority',priority,'start_date',start_date,'end_date',end_date,'recurrence','monthly','option_settings',jsonb_build_object('tags','[]'::jsonb,'sprintTypes','[]'::jsonb)),false,null,null)
from organization_projects where recurrence_occurrence=2;
select pg_temp.assert_true((select count(*)=4 from organization_projects),'Edit completion generates one copy');
select pg_temp.assert_true((select option_settings is not null and end_date='2027-04-30' from organization_projects where recurrence_occurrence=3),'Final settings copied');

-- Fail the task-copy insertion: the status transition and generated project must roll back.
create function pg_temp.fail_task_copy() returns trigger language plpgsql as $$ begin raise exception 'forced task copy failure'; end; $$;
create trigger fail_task_copy before insert on organization_tasks for each row execute function pg_temp.fail_task_copy();
do $$ begin
  begin
    update organization_projects set status='completed' where recurrence_occurrence=3;
    set constraints all immediate;
    raise exception 'Expected task failure';
  exception when others then
    if sqlerrm <> 'forced task copy failure' then raise; end if;
  end;
end $$;
drop trigger fail_task_copy on organization_tasks;
select pg_temp.assert_true((select count(*)=4 from organization_projects),'No partial next project');
select pg_temp.assert_true((select status='planned' and not recurrence_generated from organization_projects where recurrence_occurrence=3),'Completion rolled back');

select delete_organization_project_transition(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at)
from organization_projects where recurrence_occurrence=3;
select pg_temp.assert_true((select count(*)=3 from organization_projects),'Deleting recurring project creates nothing');
update organization_projects set status='active' where recurrence_occurrence=2;
update organization_projects set status='completed' where recurrence_occurrence=2;
select pg_temp.assert_true((select count(*)=3 from organization_projects),'Deleted next occurrence is not recreated');

-- Creation persists the selected rule and a completed initial occurrence rolls forward.
select create_organization_project_transition('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',
 '{"name":"Leap month","recurrence":"monthly","status":"completed","priority":"medium","start_date":"2028-01-31","end_date":"2028-01-31"}'::jsonb,false,null,null);
select pg_temp.assert_true((select count(*)=2 from organization_projects where name='Leap month'),'Completed creation rolls forward');
select pg_temp.assert_true((select start_date='2028-02-29' and end_date='2028-02-29' from organization_projects where name='Leap month' and recurrence_occurrence=1),'Leap-year clamp');

-- Rescheduling through the timeline resets the anchor rather than returning to old dates.
select update_organization_project_schedule_transition(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,'2028-03-15','2028-03-20')
from organization_projects where name='Leap month' and recurrence_occurrence=1;
update organization_projects set status='completed' where name='Leap month' and start_date='2028-03-15';
select pg_temp.assert_true((select count(*)=1 from organization_projects where name='Leap month' and start_date='2028-04-15' and end_date='2028-04-20'),'Changed schedule becomes next anchor');

-- A task on the 30th must recover its own monthly date after a shorter February.
select create_organization_project_transition('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',
 '{"name":"Task month end","recurrence":"monthly","status":"planned","priority":"medium","start_date":"2027-01-01","end_date":"2027-01-31"}'::jsonb,false,null,null);
insert into organization_tasks(org_id,project_id,title,start_date,end_date,created_by)
select org_id,id,'Monthly report','2027-01-30','2027-01-30',created_by from organization_projects where name='Task month end';
update organization_projects set status='completed' where name='Task month end' and recurrence_occurrence=0;
update organization_projects set status='completed' where name='Task month end' and recurrence_occurrence=1;
select pg_temp.assert_true((select t.start_date='2027-03-30' and t.end_date='2027-03-30' from organization_tasks t join organization_projects p on p.id=t.project_id where p.name='Task month end' and p.recurrence_occurrence=2),'Task monthly anchor survives February');
