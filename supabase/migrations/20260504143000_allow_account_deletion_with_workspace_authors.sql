set check_function_bodies = off;
set search_path = public;

alter table if exists organization_projects
  drop constraint if exists organization_projects_created_by_fkey,
  alter column created_by drop not null,
  add constraint organization_projects_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;

alter table if exists organization_tasks
  drop constraint if exists organization_tasks_created_by_fkey,
  alter column created_by drop not null,
  add constraint organization_tasks_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;

alter table if exists organization_task_assignees
  drop constraint if exists organization_task_assignees_created_by_fkey,
  alter column created_by drop not null,
  add constraint organization_task_assignees_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;

alter table if exists organization_project_notes
  drop constraint if exists organization_project_notes_created_by_fkey,
  alter column created_by drop not null,
  add constraint organization_project_notes_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;

alter table if exists organization_project_quick_links
  drop constraint if exists organization_project_quick_links_created_by_fkey,
  alter column created_by drop not null,
  add constraint organization_project_quick_links_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;

alter table if exists organization_project_assets
  drop constraint if exists organization_project_assets_created_by_fkey,
  alter column created_by drop not null,
  add constraint organization_project_assets_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;
