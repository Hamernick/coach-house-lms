create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception '%', message; end if; end;
$$;
-- Both fields are genuinely NULL, while the non-null tenant ownership is retained.
select public.create_organization_project_transition(
 '00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',
 '{"name":"Undated internal project","status":"active","priority":"medium","organization_unassigned":true,"recurrence":"monthly"}',false,null,null);
select pg_temp.assert_true((select start_date is null and end_date is null and organization_unassigned from organization_projects where name='Undated internal project'),'Creation keeps missing dates and organization choice');
update organization_projects set status='completed' where name='Undated internal project';
select pg_temp.assert_true((select count(*)=2 and bool_and(start_date is null and end_date is null and organization_unassigned) from organization_projects where name='Undated internal project'),'Recurrence preserves missing dates and assignment');
select update_organization_project_transition(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,
 '{"name":"Undated internal project","status":"planned","priority":"medium","end_date":"2027-05-01","organization_unassigned":false}',false,null,null)
from organization_projects where name='Undated internal project' and status='planned';
select pg_temp.assert_true((select start_date is null and end_date='2027-05-01' and not organization_unassigned from organization_projects where name='Undated internal project' and status='planned'),'A due date alone is valid and organization assignment can be restored');
select update_organization_project_transition(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,
 '{"name":"Undated internal project","status":"planned","priority":"medium","organization_unassigned":true}',false,null,null)
from organization_projects where name='Undated internal project' and status='planned';
select pg_temp.assert_true((select end_date is null and organization_unassigned from organization_projects where name='Undated internal project' and status='planned'),'Editing can clear a previously saved date and assignment');
select public.create_guided_organization_project('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099',
 '{"name":"Guided undated","organizationId":"","startDate":"","endDate":"","tasks":[],"files":[]}', '{}', '<p>Overview</p>', 'Overview');
select pg_temp.assert_true((select start_date is null and end_date is null and organization_unassigned from organization_projects where name='Guided undated'),'Guided creation accepts absent dates and assignment');
select public.update_organization_project_schedule_transition(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,'2027-06-01',null)
from organization_projects where name='Guided undated';
select pg_temp.assert_true((select start_date='2027-06-01' and end_date is null from organization_projects where name='Guided undated'),'Schedule editor accepts a start date alone');
select public.update_organization_project_schedule_transition(id,'00000000-0000-4000-8000-000000000001',org_id,updated_at,null,null)
from organization_projects where name='Guided undated';
select pg_temp.assert_true((select start_date is null and end_date is null from organization_projects where name='Guided undated'),'Schedule editor can clear both dates');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
select pg_temp.assert_true((select count(*)=0 from organization_projects where name in ('Undated internal project','Guided undated')),'Removing assignment does not remove tenant isolation');
update organization_projects set name='Unauthorized edit' where organization_unassigned;
reset role;
select pg_temp.assert_true((select count(*)=0 from organization_projects where name='Unauthorized edit'),'Other tenants cannot update unassigned projects');
