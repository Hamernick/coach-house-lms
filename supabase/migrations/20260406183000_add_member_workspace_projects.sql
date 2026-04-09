set check_function_bodies = off;
set search_path = public;

create table if not exists organization_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  name text not null,
  status text not null default 'planned',
  priority text not null default 'medium',
  progress integer not null default 0,
  start_date date not null,
  end_date date not null,
  client_name text,
  type_label text,
  duration_label text,
  tags text[] not null default '{}'::text[],
  member_labels text[] not null default '{}'::text[],
  task_count integer not null default 0,
  created_source text not null default 'user',
  starter_seed_key text,
  starter_seed_version integer,
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_projects_status_check
    check (status in ('backlog', 'planned', 'active', 'cancelled', 'completed')),
  constraint organization_projects_priority_check
    check (priority in ('urgent', 'high', 'medium', 'low')),
  constraint organization_projects_progress_check
    check (progress between 0 and 100),
  constraint organization_projects_task_count_check
    check (task_count >= 0),
  constraint organization_projects_end_date_check
    check (end_date >= start_date),
  constraint organization_projects_created_source_check
    check (created_source in ('starter_seed', 'user', 'system')),
  constraint organization_projects_starter_seed_fields_check
    check (
      (created_source = 'starter_seed' and starter_seed_key is not null and starter_seed_version is not null)
      or created_source <> 'starter_seed'
    )
);

create index if not exists organization_projects_org_id_updated_at_idx
  on organization_projects (org_id, updated_at desc);
create index if not exists organization_projects_org_id_status_idx
  on organization_projects (org_id, status);
create index if not exists organization_projects_org_id_priority_idx
  on organization_projects (org_id, priority);
create index if not exists organization_projects_org_id_created_source_idx
  on organization_projects (org_id, created_source);
create unique index if not exists organization_projects_org_id_starter_seed_key_idx
  on organization_projects (org_id, starter_seed_key);

create table if not exists organization_workspace_starter_state (
  org_id uuid primary key references organizations(user_id) on delete cascade,
  seed_version integer not null default 1,
  seeded_at timestamptz not null default timezone('utc', now()),
  last_reset_at timestamptz,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_starter_state_seed_version_check
    check (seed_version >= 1)
);

create index if not exists organization_workspace_starter_state_seeded_at_idx
  on organization_workspace_starter_state (seeded_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_projects'
  ) then
    create trigger set_updated_at_organization_projects
      before update on organization_projects
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_starter_state'
  ) then
    create trigger set_updated_at_organization_workspace_starter_state
      before update on organization_workspace_starter_state
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_projects enable row level security;
alter table organization_projects force row level security;
alter table organization_workspace_starter_state enable row level security;
alter table organization_workspace_starter_state force row level security;

drop policy if exists "organization_projects_select" on public.organization_projects;
drop policy if exists "organization_projects_insert" on public.organization_projects;
drop policy if exists "organization_projects_update" on public.organization_projects;
drop policy if exists "organization_projects_delete" on public.organization_projects;

create policy "organization_projects_select" on public.organization_projects
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_projects.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_projects_insert" on public.organization_projects
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_projects.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_projects_update" on public.organization_projects
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_projects.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_projects.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_projects_delete" on public.organization_projects
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_projects.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_workspace_starter_state_select" on public.organization_workspace_starter_state;
drop policy if exists "organization_workspace_starter_state_insert" on public.organization_workspace_starter_state;
drop policy if exists "organization_workspace_starter_state_update" on public.organization_workspace_starter_state;
drop policy if exists "organization_workspace_starter_state_delete" on public.organization_workspace_starter_state;

create policy "organization_workspace_starter_state_select" on public.organization_workspace_starter_state
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_starter_state.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_starter_state_insert" on public.organization_workspace_starter_state
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_starter_state.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_starter_state_update" on public.organization_workspace_starter_state
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_starter_state.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_starter_state.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_starter_state_delete" on public.organization_workspace_starter_state
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_starter_state.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );
