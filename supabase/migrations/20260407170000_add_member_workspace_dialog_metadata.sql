alter table public.organization_projects
  add column if not exists description text;

alter table public.organization_tasks
  add column if not exists description text,
  add column if not exists priority text not null default 'no-priority',
  add column if not exists tag_label text,
  add column if not exists workstream_name text;

alter table public.organization_tasks
  drop constraint if exists organization_tasks_priority_check;

alter table public.organization_tasks
  add constraint organization_tasks_priority_check
    check (priority in ('no-priority', 'low', 'medium', 'high', 'urgent'));
