set check_function_bodies = off;
set search_path = public;

create or replace function public.has_paid_team_access(org_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = org_user_id
      and s.status in ('active', 'trialing')
      and coalesce(s.stripe_subscription_id, '') not ilike 'stub_%'
      and lower(
        concat_ws(
          ' ',
          s.metadata ->> 'planName',
          s.metadata ->> 'plan_tier',
          s.metadata ->> 'tier'
        )
      ) not like '%free%'
  );
$$;

revoke all on function public.has_paid_team_access(uuid) from public;

create or replace function public.can_read_member_workspace_org(org_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  if not public.has_paid_team_access(org_user_id) then
    return false;
  end if;

  return org_user_id = current_user_id
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = org_user_id
        and om.member_id = current_user_id
    );
exception when others then
  return false;
end;
$$;

create or replace function public.can_write_member_workspace_org(org_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  if not public.has_paid_team_access(org_user_id) then
    return false;
  end if;

  return org_user_id = current_user_id
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = org_user_id
        and om.member_id = current_user_id
        and om.role in ('admin', 'staff')
    );
exception when others then
  return false;
end;
$$;

create or replace function public.can_read_member_workspace_org(org_user_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.can_read_member_workspace_org(org_user_id::uuid);
exception when others then
  return false;
end;
$$;

create or replace function public.can_write_member_workspace_org(org_user_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.can_write_member_workspace_org(org_user_id::uuid);
exception when others then
  return false;
end;
$$;

revoke all on function public.can_read_member_workspace_org(uuid) from public;
revoke all on function public.can_write_member_workspace_org(uuid) from public;
revoke all on function public.can_read_member_workspace_org(text) from public;
revoke all on function public.can_write_member_workspace_org(text) from public;

grant execute on function public.can_read_member_workspace_org(uuid) to authenticated;
grant execute on function public.can_write_member_workspace_org(uuid) to authenticated;
grant execute on function public.can_read_member_workspace_org(text) to authenticated;
grant execute on function public.can_write_member_workspace_org(text) to authenticated;

drop policy if exists "organization_projects_select" on public.organization_projects;
drop policy if exists "organization_projects_insert" on public.organization_projects;
drop policy if exists "organization_projects_update" on public.organization_projects;
drop policy if exists "organization_projects_delete" on public.organization_projects;

create policy "organization_projects_select" on public.organization_projects
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_projects_insert" on public.organization_projects
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_projects_update" on public.organization_projects
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_projects_delete" on public.organization_projects
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "organization_workspace_starter_state_select" on public.organization_workspace_starter_state;
drop policy if exists "organization_workspace_starter_state_insert" on public.organization_workspace_starter_state;
drop policy if exists "organization_workspace_starter_state_update" on public.organization_workspace_starter_state;
drop policy if exists "organization_workspace_starter_state_delete" on public.organization_workspace_starter_state;

create policy "organization_workspace_starter_state_select" on public.organization_workspace_starter_state
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_workspace_starter_state_insert" on public.organization_workspace_starter_state
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_workspace_starter_state_update" on public.organization_workspace_starter_state
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_workspace_starter_state_delete" on public.organization_workspace_starter_state
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "organization_tasks_select" on public.organization_tasks;
drop policy if exists "organization_tasks_insert" on public.organization_tasks;
drop policy if exists "organization_tasks_update" on public.organization_tasks;
drop policy if exists "organization_tasks_delete" on public.organization_tasks;

create policy "organization_tasks_select" on public.organization_tasks
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_tasks_insert" on public.organization_tasks
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_tasks_update" on public.organization_tasks
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_tasks_delete" on public.organization_tasks
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "organization_task_assignees_select" on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_insert" on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_update" on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_delete" on public.organization_task_assignees;

create policy "organization_task_assignees_select" on public.organization_task_assignees
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_task_assignees_insert" on public.organization_task_assignees
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_task_assignees_update" on public.organization_task_assignees
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_task_assignees_delete" on public.organization_task_assignees
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "organization_project_notes_select" on public.organization_project_notes;
drop policy if exists "organization_project_notes_insert" on public.organization_project_notes;
drop policy if exists "organization_project_notes_update" on public.organization_project_notes;
drop policy if exists "organization_project_notes_delete" on public.organization_project_notes;

create policy "organization_project_notes_select" on public.organization_project_notes
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_project_notes_insert" on public.organization_project_notes
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_project_notes_update" on public.organization_project_notes
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_project_notes_delete" on public.organization_project_notes
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "organization_project_quick_links_select" on public.organization_project_quick_links;
drop policy if exists "organization_project_quick_links_insert" on public.organization_project_quick_links;
drop policy if exists "organization_project_quick_links_update" on public.organization_project_quick_links;
drop policy if exists "organization_project_quick_links_delete" on public.organization_project_quick_links;

create policy "organization_project_quick_links_select" on public.organization_project_quick_links
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_project_quick_links_insert" on public.organization_project_quick_links
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_project_quick_links_update" on public.organization_project_quick_links
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_project_quick_links_delete" on public.organization_project_quick_links
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "organization_project_assets_select" on public.organization_project_assets;
drop policy if exists "organization_project_assets_insert" on public.organization_project_assets;
drop policy if exists "organization_project_assets_update" on public.organization_project_assets;
drop policy if exists "organization_project_assets_delete" on public.organization_project_assets;

create policy "organization_project_assets_select" on public.organization_project_assets
  for select
  to authenticated
  using (public.can_read_member_workspace_org(org_id));

create policy "organization_project_assets_insert" on public.organization_project_assets
  for insert
  to authenticated
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_project_assets_update" on public.organization_project_assets
  for update
  to authenticated
  using (public.can_write_member_workspace_org(org_id))
  with check (public.can_write_member_workspace_org(org_id));

create policy "organization_project_assets_delete" on public.organization_project_assets
  for delete
  to authenticated
  using (public.can_write_member_workspace_org(org_id));

drop policy if exists "project_assets_read" on storage.objects;
drop policy if exists "project_assets_insert" on storage.objects;
drop policy if exists "project_assets_update" on storage.objects;
drop policy if exists "project_assets_delete" on storage.objects;

create policy "project_assets_read" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-assets'
    and public.can_read_member_workspace_org(split_part(name, '/', 1))
  );

create policy "project_assets_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-assets'
    and public.can_write_member_workspace_org(split_part(name, '/', 1))
  );

create policy "project_assets_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'project-assets'
    and public.can_write_member_workspace_org(split_part(name, '/', 1))
  )
  with check (
    bucket_id = 'project-assets'
    and public.can_write_member_workspace_org(split_part(name, '/', 1))
  );

create policy "project_assets_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-assets'
    and public.can_write_member_workspace_org(split_part(name, '/', 1))
  );
