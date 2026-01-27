set check_function_bodies = off;
set search_path = public;

-- Roadmap calendar: public events
create table if not exists roadmap_calendar_public_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  recurrence jsonb,
  status text not null default 'active',
  assigned_roles text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Roadmap calendar: internal events
create table if not exists roadmap_calendar_internal_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  recurrence jsonb,
  status text not null default 'active',
  assigned_roles text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists roadmap_calendar_public_events_org_id_idx
  on roadmap_calendar_public_events (org_id);
create index if not exists roadmap_calendar_public_events_org_id_starts_at_idx
  on roadmap_calendar_public_events (org_id, starts_at);

create index if not exists roadmap_calendar_internal_events_org_id_idx
  on roadmap_calendar_internal_events (org_id);
create index if not exists roadmap_calendar_internal_events_org_id_starts_at_idx
  on roadmap_calendar_internal_events (org_id, starts_at);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_roadmap_calendar_public_events'
  ) then
    create trigger set_updated_at_roadmap_calendar_public_events
    before update on roadmap_calendar_public_events
    for each row execute procedure public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_roadmap_calendar_internal_events'
  ) then
    create trigger set_updated_at_roadmap_calendar_internal_events
    before update on roadmap_calendar_internal_events
    for each row execute procedure public.handle_updated_at();
  end if;
end $$;

-- Calendar feed tokens
create table if not exists roadmap_calendar_public_feeds (
  org_id uuid primary key references organizations(user_id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  rotated_at timestamptz not null default timezone('utc', now())
);

create table if not exists roadmap_calendar_internal_feeds (
  org_id uuid primary key references organizations(user_id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  rotated_at timestamptz not null default timezone('utc', now())
);

-- Permissions: staff calendar management toggle
alter table organization_access_settings
  add column if not exists staff_can_manage_calendar boolean not null default false;

alter table roadmap_calendar_public_events enable row level security;
alter table roadmap_calendar_public_events force row level security;

alter table roadmap_calendar_internal_events enable row level security;
alter table roadmap_calendar_internal_events force row level security;

alter table roadmap_calendar_public_feeds enable row level security;
alter table roadmap_calendar_public_feeds force row level security;

alter table roadmap_calendar_internal_feeds enable row level security;
alter table roadmap_calendar_internal_feeds force row level security;

-- Public calendar events

drop policy if exists "roadmap_calendar_public_events_select" on public.roadmap_calendar_public_events;
drop policy if exists "roadmap_calendar_public_events_insert" on public.roadmap_calendar_public_events;
drop policy if exists "roadmap_calendar_public_events_update" on public.roadmap_calendar_public_events;
drop policy if exists "roadmap_calendar_public_events_delete" on public.roadmap_calendar_public_events;

create policy "roadmap_calendar_public_events_select" on public.roadmap_calendar_public_events
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = roadmap_calendar_public_events.org_id
        and om.member_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.organizations orgs
      where orgs.user_id = roadmap_calendar_public_events.org_id
        and orgs.is_public_roadmap = true
    )
  );

create policy "roadmap_calendar_public_events_insert" on public.roadmap_calendar_public_events
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_public_events_update" on public.roadmap_calendar_public_events
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_public_events_delete" on public.roadmap_calendar_public_events
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

-- Internal calendar events

drop policy if exists "roadmap_calendar_internal_events_select" on public.roadmap_calendar_internal_events;
drop policy if exists "roadmap_calendar_internal_events_insert" on public.roadmap_calendar_internal_events;
drop policy if exists "roadmap_calendar_internal_events_update" on public.roadmap_calendar_internal_events;
drop policy if exists "roadmap_calendar_internal_events_delete" on public.roadmap_calendar_internal_events;

create policy "roadmap_calendar_internal_events_select" on public.roadmap_calendar_internal_events
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = roadmap_calendar_internal_events.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "roadmap_calendar_internal_events_insert" on public.roadmap_calendar_internal_events
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_internal_events_update" on public.roadmap_calendar_internal_events
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_internal_events_delete" on public.roadmap_calendar_internal_events
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_events.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

-- Calendar feed tokens

drop policy if exists "roadmap_calendar_public_feeds_select" on public.roadmap_calendar_public_feeds;
drop policy if exists "roadmap_calendar_public_feeds_insert" on public.roadmap_calendar_public_feeds;
drop policy if exists "roadmap_calendar_public_feeds_update" on public.roadmap_calendar_public_feeds;
drop policy if exists "roadmap_calendar_public_feeds_delete" on public.roadmap_calendar_public_feeds;

create policy "roadmap_calendar_public_feeds_select" on public.roadmap_calendar_public_feeds
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_public_feeds_insert" on public.roadmap_calendar_public_feeds
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_public_feeds_update" on public.roadmap_calendar_public_feeds
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_public_feeds_delete" on public.roadmap_calendar_public_feeds
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_public_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

drop policy if exists "roadmap_calendar_internal_feeds_select" on public.roadmap_calendar_internal_feeds;
drop policy if exists "roadmap_calendar_internal_feeds_insert" on public.roadmap_calendar_internal_feeds;
drop policy if exists "roadmap_calendar_internal_feeds_update" on public.roadmap_calendar_internal_feeds;
drop policy if exists "roadmap_calendar_internal_feeds_delete" on public.roadmap_calendar_internal_feeds;

create policy "roadmap_calendar_internal_feeds_select" on public.roadmap_calendar_internal_feeds
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_internal_feeds_insert" on public.roadmap_calendar_internal_feeds
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_internal_feeds_update" on public.roadmap_calendar_internal_feeds
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );

create policy "roadmap_calendar_internal_feeds_delete" on public.roadmap_calendar_internal_feeds
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = roadmap_calendar_internal_feeds.org_id
        and om.member_id = (select auth.uid())
        and (
          om.role = 'admin'
          or (om.role = 'staff' and s.staff_can_manage_calendar = true)
        )
    )
  );
