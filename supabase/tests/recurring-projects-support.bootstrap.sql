alter table organization_projects
  add column project_kind text not null default 'standard',
  add column canonical_org_id uuid,
  add column description text,
  add column schedule_confirmed boolean not null default true,
  add column guided_setup jsonb,
  add column creation_request_id uuid unique;
alter table organization_tasks
  add column description text,
  add column priority text not null default 'medium',
  add column tag_label text,
  add column workstream_name text;
create table organization_project_overview_documents(
  org_id uuid references organizations(user_id), project_id uuid references organization_projects(id) on delete cascade,
  document_html text, document_text text, created_by uuid, updated_by uuid, unique(org_id, project_id));
create table organization_project_assets(
  org_id uuid, project_id uuid, name text, asset_type text, external_url text, created_by uuid, updated_by uuid);
grant select, insert, update, delete on organization_projects, organization_tasks, organization_task_assignees to authenticated, service_role;

create table platform_admin_project_workstream_states(owner_id uuid, project_id uuid references organization_projects(id) on delete cascade, category_id uuid, primary key(owner_id,project_id));
