begin;

-- These policies existed when the atomic task migrations were first applied.
-- Remove them in a forward migration so task assignment writes can only pass
-- through the service-role transition functions.
drop policy if exists "organization_task_assignees_insert"
  on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_update"
  on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_delete"
  on public.organization_task_assignees;

commit;
