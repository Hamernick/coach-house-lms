set check_function_bodies = off;
set search_path = public;

create table if not exists organization_workspace_objective_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  title text not null,
  kind text not null default 'custom',
  source_type text,
  archived_at timestamptz,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_objective_groups_title_check check (char_length(trim(title)) > 0),
  constraint organization_workspace_objective_groups_kind_check check (kind in ('system', 'custom')),
  constraint organization_workspace_objective_groups_source_type_check check (
    source_type is null
    or source_type in ('accelerator', 'roadmap', 'calendar', 'communications', 'economic_engine', 'none')
  )
);

create index if not exists organization_workspace_objective_groups_org_id_idx
  on organization_workspace_objective_groups (org_id);
create index if not exists organization_workspace_objective_groups_org_id_kind_idx
  on organization_workspace_objective_groups (org_id, kind);
create unique index if not exists organization_workspace_objective_groups_org_id_title_active_key
  on organization_workspace_objective_groups (org_id, lower(title))
  where archived_at is null;

create table if not exists organization_workspace_objectives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  group_id uuid references organization_workspace_objective_groups(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'normal',
  kind text not null default 'custom',
  source_type text not null default 'custom',
  source_key text,
  due_at timestamptz,
  completed_at timestamptz,
  position_rank numeric(12, 6) not null default 0,
  created_by uuid not null references profiles(id) on delete cascade,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_objectives_title_check check (char_length(trim(title)) > 0),
  constraint organization_workspace_objectives_status_check check (status in ('todo', 'in_progress', 'blocked', 'done', 'archived')),
  constraint organization_workspace_objectives_priority_check check (priority in ('low', 'normal', 'high', 'critical')),
  constraint organization_workspace_objectives_kind_check check (kind in ('system', 'custom')),
  constraint organization_workspace_objectives_source_type_check check (
    source_type in ('accelerator_module', 'accelerator_step', 'roadmap_section', 'calendar_event', 'custom')
  ),
  constraint organization_workspace_objectives_completed_at_check check (
    status <> 'done' or completed_at is not null
  )
);

create index if not exists organization_workspace_objectives_org_id_idx
  on organization_workspace_objectives (org_id);
create index if not exists organization_workspace_objectives_org_id_status_updated_at_idx
  on organization_workspace_objectives (org_id, status, updated_at desc);
create index if not exists organization_workspace_objectives_org_id_group_id_updated_at_idx
  on organization_workspace_objectives (org_id, group_id, updated_at desc);
create index if not exists organization_workspace_objectives_open_feed_idx
  on organization_workspace_objectives (org_id, updated_at desc)
  where status in ('todo', 'in_progress', 'blocked');
create unique index if not exists organization_workspace_objectives_org_source_key_system_key
  on organization_workspace_objectives (org_id, source_type, source_key)
  where kind = 'system' and source_key is not null;

create table if not exists organization_workspace_objective_steps (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references organization_workspace_objectives(id) on delete cascade,
  org_id uuid not null references organizations(user_id) on delete cascade,
  step_order integer not null,
  step_type text not null,
  title text not null,
  status text not null default 'todo',
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_objective_steps_step_order_check check (step_order >= 0),
  constraint organization_workspace_objective_steps_title_check check (char_length(trim(title)) > 0),
  constraint organization_workspace_objective_steps_step_type_check check (
    step_type in ('video', 'notes', 'resources', 'assignment', 'budget', 'roadmap_checkpoint', 'custom')
  ),
  constraint organization_workspace_objective_steps_status_check check (status in ('todo', 'in_progress', 'blocked', 'done')),
  constraint organization_workspace_objective_steps_unique_order unique (objective_id, step_order)
);

create index if not exists organization_workspace_objective_steps_org_id_idx
  on organization_workspace_objective_steps (org_id);
create index if not exists organization_workspace_objective_steps_objective_id_step_order_idx
  on organization_workspace_objective_steps (objective_id, step_order);

create table if not exists organization_workspace_objective_assignees (
  objective_id uuid not null references organization_workspace_objectives(id) on delete cascade,
  org_id uuid not null references organizations(user_id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'assignee',
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_objective_assignees_role_check check (role in ('owner', 'assignee', 'watcher')),
  constraint organization_workspace_objective_assignees_pkey primary key (objective_id, user_id)
);

create index if not exists organization_workspace_objective_assignees_org_id_user_id_objective_id_idx
  on organization_workspace_objective_assignees (org_id, user_id, objective_id);

create table if not exists organization_workspace_objective_links (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references organization_workspace_objectives(id) on delete cascade,
  org_id uuid not null references organizations(user_id) on delete cascade,
  card_id text not null,
  entity_type text,
  entity_id text,
  link_kind text not null default 'primary',
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_objective_links_card_id_check check (
    card_id in (
      'organization-overview',
      'formation-status',
      'brand-kit',
      'economic-engine',
      'calendar',
      'communications',
      'deck',
      'vault',
      'atlas'
    )
  ),
  constraint organization_workspace_objective_links_entity_type_check check (
    entity_type is null or entity_type in ('roadmap_section', 'calendar_event', 'module', 'assignment', 'none')
  ),
  constraint organization_workspace_objective_links_link_kind_check check (
    link_kind in ('primary', 'secondary', 'dependency')
  )
);

create index if not exists organization_workspace_objective_links_org_id_card_id_objective_id_idx
  on organization_workspace_objective_links (org_id, card_id, objective_id);
create index if not exists organization_workspace_objective_links_objective_id_idx
  on organization_workspace_objective_links (objective_id);

create table if not exists organization_workspace_objective_activity (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references organization_workspace_objectives(id) on delete cascade,
  org_id uuid not null references organizations(user_id) on delete cascade,
  actor_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_objective_activity_event_type_check check (char_length(trim(event_type)) > 0)
);

create index if not exists organization_workspace_objective_activity_objective_id_created_at_idx
  on organization_workspace_objective_activity (objective_id, created_at desc);
create index if not exists organization_workspace_objective_activity_org_id_created_at_idx
  on organization_workspace_objective_activity (org_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_objective_groups'
  ) then
    create trigger set_updated_at_organization_workspace_objective_groups
      before update on organization_workspace_objective_groups
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_objectives'
  ) then
    create trigger set_updated_at_organization_workspace_objectives
      before update on organization_workspace_objectives
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_objective_steps'
  ) then
    create trigger set_updated_at_organization_workspace_objective_steps
      before update on organization_workspace_objective_steps
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_workspace_objective_groups enable row level security;
alter table organization_workspace_objective_groups force row level security;
alter table organization_workspace_objectives enable row level security;
alter table organization_workspace_objectives force row level security;
alter table organization_workspace_objective_steps enable row level security;
alter table organization_workspace_objective_steps force row level security;
alter table organization_workspace_objective_assignees enable row level security;
alter table organization_workspace_objective_assignees force row level security;
alter table organization_workspace_objective_links enable row level security;
alter table organization_workspace_objective_links force row level security;
alter table organization_workspace_objective_activity enable row level security;
alter table organization_workspace_objective_activity force row level security;

drop policy if exists "organization_workspace_objective_groups_select" on public.organization_workspace_objective_groups;
drop policy if exists "organization_workspace_objective_groups_insert" on public.organization_workspace_objective_groups;
drop policy if exists "organization_workspace_objective_groups_update" on public.organization_workspace_objective_groups;
drop policy if exists "organization_workspace_objective_groups_delete" on public.organization_workspace_objective_groups;

create policy "organization_workspace_objective_groups_select" on public.organization_workspace_objective_groups
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_groups.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_objective_groups_insert" on public.organization_workspace_objective_groups
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_groups.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objective_groups_update" on public.organization_workspace_objective_groups
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_groups.org_id
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
      where om.org_id = organization_workspace_objective_groups.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objective_groups_delete" on public.organization_workspace_objective_groups
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_groups.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_workspace_objectives_select" on public.organization_workspace_objectives;
drop policy if exists "organization_workspace_objectives_insert" on public.organization_workspace_objectives;
drop policy if exists "organization_workspace_objectives_update" on public.organization_workspace_objectives;
drop policy if exists "organization_workspace_objectives_delete" on public.organization_workspace_objectives;

create policy "organization_workspace_objectives_select" on public.organization_workspace_objectives
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objectives.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_objectives_insert" on public.organization_workspace_objectives
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objectives.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objectives_update" on public.organization_workspace_objectives
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objectives.org_id
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
      where om.org_id = organization_workspace_objectives.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objectives_delete" on public.organization_workspace_objectives
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objectives.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_workspace_objective_steps_select" on public.organization_workspace_objective_steps;
drop policy if exists "organization_workspace_objective_steps_insert" on public.organization_workspace_objective_steps;
drop policy if exists "organization_workspace_objective_steps_update" on public.organization_workspace_objective_steps;
drop policy if exists "organization_workspace_objective_steps_delete" on public.organization_workspace_objective_steps;

create policy "organization_workspace_objective_steps_select" on public.organization_workspace_objective_steps
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_steps.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_objective_steps_insert" on public.organization_workspace_objective_steps
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_steps.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objective_steps_update" on public.organization_workspace_objective_steps
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_steps.org_id
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
      where om.org_id = organization_workspace_objective_steps.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objective_steps_delete" on public.organization_workspace_objective_steps
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_steps.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_workspace_objective_assignees_select" on public.organization_workspace_objective_assignees;
drop policy if exists "organization_workspace_objective_assignees_insert" on public.organization_workspace_objective_assignees;
drop policy if exists "organization_workspace_objective_assignees_update" on public.organization_workspace_objective_assignees;
drop policy if exists "organization_workspace_objective_assignees_delete" on public.organization_workspace_objective_assignees;

create policy "organization_workspace_objective_assignees_select" on public.organization_workspace_objective_assignees
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_assignees.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_objective_assignees_insert" on public.organization_workspace_objective_assignees
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_assignees.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );

create policy "organization_workspace_objective_assignees_update" on public.organization_workspace_objective_assignees
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_assignees.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_assignees.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );

create policy "organization_workspace_objective_assignees_delete" on public.organization_workspace_objective_assignees
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_assignees.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );

drop policy if exists "organization_workspace_objective_links_select" on public.organization_workspace_objective_links;
drop policy if exists "organization_workspace_objective_links_insert" on public.organization_workspace_objective_links;
drop policy if exists "organization_workspace_objective_links_update" on public.organization_workspace_objective_links;
drop policy if exists "organization_workspace_objective_links_delete" on public.organization_workspace_objective_links;

create policy "organization_workspace_objective_links_select" on public.organization_workspace_objective_links
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_links.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_objective_links_insert" on public.organization_workspace_objective_links
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_links.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objective_links_update" on public.organization_workspace_objective_links
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_links.org_id
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
      where om.org_id = organization_workspace_objective_links.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_objective_links_delete" on public.organization_workspace_objective_links
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_links.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_workspace_objective_activity_select" on public.organization_workspace_objective_activity;
drop policy if exists "organization_workspace_objective_activity_insert" on public.organization_workspace_objective_activity;
drop policy if exists "organization_workspace_objective_activity_update" on public.organization_workspace_objective_activity;
drop policy if exists "organization_workspace_objective_activity_delete" on public.organization_workspace_objective_activity;

create policy "organization_workspace_objective_activity_select" on public.organization_workspace_objective_activity
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_activity.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_objective_activity_insert" on public.organization_workspace_objective_activity
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_objective_activity.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );

create policy "organization_workspace_objective_activity_update" on public.organization_workspace_objective_activity
  for update
  to authenticated
  using (
    false
  )
  with check (
    false
  );

create policy "organization_workspace_objective_activity_delete" on public.organization_workspace_objective_activity
  for delete
  to authenticated
  using (
    public.is_admin()
  );
