create table if not exists organization_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  project_id uuid not null references organization_projects(id) on delete cascade,
  title text not null,
  task_type text not null default 'task',
  status text not null default 'todo',
  start_date date not null,
  end_date date not null,
  sort_order integer not null default 0,
  created_source text not null default 'user',
  starter_seed_key text,
  starter_seed_version integer,
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_tasks_type_check
    check (task_type in ('bug', 'improvement', 'task')),
  constraint organization_tasks_status_check
    check (status in ('todo', 'in-progress', 'done')),
  constraint organization_tasks_end_date_check
    check (end_date >= start_date),
  constraint organization_tasks_sort_order_check
    check (sort_order >= 0),
  constraint organization_tasks_created_source_check
    check (created_source in ('starter_seed', 'user', 'system')),
  constraint organization_tasks_starter_seed_fields_check
    check (
      (
        created_source = 'starter_seed'
        and starter_seed_key is not null
        and starter_seed_version is not null
      )
      or (
        created_source <> 'starter_seed'
        and starter_seed_key is null
        and starter_seed_version is null
      )
    )
);

create index if not exists organization_tasks_org_id_project_id_idx
  on organization_tasks (org_id, project_id);
create index if not exists organization_tasks_org_id_status_idx
  on organization_tasks (org_id, status);
create index if not exists organization_tasks_org_id_created_source_idx
  on organization_tasks (org_id, created_source);
create index if not exists organization_tasks_org_id_start_date_idx
  on organization_tasks (org_id, start_date);
create unique index if not exists organization_tasks_org_id_starter_seed_key_idx
  on organization_tasks (org_id, starter_seed_key);

create table if not exists organization_task_assignees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  task_id uuid not null references organization_tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_task_assignees_unique unique (task_id, user_id)
);

create index if not exists organization_task_assignees_org_id_user_id_idx
  on organization_task_assignees (org_id, user_id);
create index if not exists organization_task_assignees_org_id_task_id_idx
  on organization_task_assignees (org_id, task_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_organization_tasks'
  ) then
    create trigger set_updated_at_organization_tasks
      before update on organization_tasks
      for each row
      execute function handle_updated_at();
  end if;
end $$;

alter table organization_tasks enable row level security;
alter table organization_tasks force row level security;
alter table organization_task_assignees enable row level security;
alter table organization_task_assignees force row level security;

drop policy if exists "organization_tasks_select" on public.organization_tasks;
drop policy if exists "organization_tasks_insert" on public.organization_tasks;
drop policy if exists "organization_tasks_update" on public.organization_tasks;
drop policy if exists "organization_tasks_delete" on public.organization_tasks;

create policy "organization_tasks_select" on public.organization_tasks
  for select
  using (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_tasks.org_id
        and om.member_id = auth.uid()
    )
  );

create policy "organization_tasks_insert" on public.organization_tasks
  for insert
  with check (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_tasks.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_tasks_update" on public.organization_tasks
  for update
  using (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_tasks.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  )
  with check (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_tasks.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_tasks_delete" on public.organization_tasks
  for delete
  using (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_tasks.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_task_assignees_select" on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_insert" on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_update" on public.organization_task_assignees;
drop policy if exists "organization_task_assignees_delete" on public.organization_task_assignees;

create policy "organization_task_assignees_select" on public.organization_task_assignees
  for select
  using (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_task_assignees.org_id
        and om.member_id = auth.uid()
    )
  );

create policy "organization_task_assignees_insert" on public.organization_task_assignees
  for insert
  with check (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_task_assignees.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_task_assignees_update" on public.organization_task_assignees
  for update
  using (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_task_assignees.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  )
  with check (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_task_assignees.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_task_assignees_delete" on public.organization_task_assignees
  for delete
  using (
    auth.uid() = org_id
    or exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    or exists (
      select 1
      from organization_memberships om
      where om.org_id = organization_task_assignees.org_id
        and om.member_id = auth.uid()
        and om.role in ('admin', 'staff')
    )
  );
