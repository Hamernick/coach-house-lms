set search_path = public;

delete from organization_tasks
where created_source = 'starter_seed'
  and starter_seed_key not in ('1:1-1', '1:1-2', '1:1-3');

delete from organization_projects
where created_source = 'starter_seed'
  and project_kind = 'standard'
  and starter_seed_key <> '1';

update organization_projects
set
  name = 'Projects preview',
  description = 'A short sample project that shows how Coach House projects, tasks, and timelines work.',
  status = 'planned',
  priority = 'medium',
  progress = 20,
  start_date = date '2026-01-12',
  end_date = date '2026-01-26',
  client_name = 'Organization',
  type_label = 'Preview',
  duration_label = '2 weeks',
  tags = array['preview', 'getting-started']::text[],
  member_labels = array['Workspace owner']::text[],
  task_count = 3,
  starter_seed_version = 2,
  updated_at = timezone('utc', now())
where created_source = 'starter_seed'
  and project_kind = 'standard'
  and starter_seed_key = '1';

with starter_tasks as (
  select *
  from (
    values
      ('1:1-1', 'Review the sample project', 'task', 'done', date '2026-01-12', date '2026-01-14', 0),
      ('1:1-2', 'Try adding a real project', 'task', 'in-progress', date '2026-01-15', date '2026-01-19', 1),
      ('1:1-3', 'Clear this preview when ready', 'task', 'todo', date '2026-01-20', date '2026-01-26', 2)
  ) as seed(
    starter_seed_key,
    title,
    task_type,
    status,
    start_date,
    end_date,
    sort_order
  )
)
update organization_tasks task
set
  title = starter_tasks.title,
  description = null,
  task_type = starter_tasks.task_type,
  status = starter_tasks.status,
  start_date = starter_tasks.start_date,
  end_date = starter_tasks.end_date,
  priority = 'medium',
  tag_label = null,
  workstream_name = null,
  sort_order = starter_tasks.sort_order,
  starter_seed_version = 2,
  updated_at = timezone('utc', now())
from starter_tasks
where task.created_source = 'starter_seed'
  and task.starter_seed_key = starter_tasks.starter_seed_key;

update organization_workspace_starter_state
set
  seed_version = greatest(seed_version, 2),
  updated_at = timezone('utc', now())
where exists (
  select 1
  from organization_projects
  where organization_projects.org_id = organization_workspace_starter_state.org_id
    and organization_projects.created_source = 'starter_seed'
    and organization_projects.starter_seed_version = 2
);
