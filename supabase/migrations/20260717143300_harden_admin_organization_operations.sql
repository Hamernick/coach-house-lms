set check_function_bodies = off;
set search_path = public;

revoke all privileges
  on table
    public.platform_admin_workstream_categories,
    public.platform_admin_project_workstream_states,
    public.organization_project_activity_events
  from anon, authenticated;

grant select, insert, update, delete
  on table public.platform_admin_workstream_categories
  to authenticated;

grant select, insert, update, delete
  on table public.platform_admin_project_workstream_states
  to authenticated;

grant select
  on table public.organization_project_activity_events
  to authenticated;

create index if not exists platform_admin_project_workstream_states_project_idx
  on public.platform_admin_project_workstream_states (project_id);

create index if not exists organization_project_activity_events_actor_idx
  on public.organization_project_activity_events (actor_id)
  where actor_id is not null;

-- Apply only after canonical project synchronization stops overwriting task_count.
with canonical_task_counts as (
  select
    project.id as project_id,
    count(task.id)::integer as task_count
  from public.organization_projects as project
  left join public.organization_tasks as task
    on task.project_id = project.id
  where project.project_kind = 'organization_admin'
  group by project.id
)
update public.organization_projects as project
set task_count = counts.task_count
from canonical_task_counts as counts
where project.id = counts.project_id
  and project.task_count is distinct from counts.task_count;
