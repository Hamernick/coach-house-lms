set check_function_bodies = off;
set search_path = public;

create table if not exists organization_workspace_boards (
  org_id uuid primary key references organizations(user_id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists organization_workspace_boards_updated_at_idx
  on organization_workspace_boards (updated_at desc);

create table if not exists organization_workspace_invites (
  id text primary key,
  org_id uuid not null references organizations(user_id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  user_name text,
  user_email text,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  duration_value integer not null default 1,
  duration_unit text not null default 'hours',
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_invites_duration_value_check check (duration_value between 1 and 12),
  constraint organization_workspace_invites_duration_unit_check check (duration_unit in ('hours', 'days', 'months'))
);

create index if not exists organization_workspace_invites_org_id_idx
  on organization_workspace_invites (org_id);
create index if not exists organization_workspace_invites_user_id_idx
  on organization_workspace_invites (user_id);
create index if not exists organization_workspace_invites_expires_at_idx
  on organization_workspace_invites (expires_at);
create index if not exists organization_workspace_invites_active_idx
  on organization_workspace_invites (org_id, expires_at)
  where revoked_at is null;

-- Backfill saved board layouts from legacy organizations.profile JSON storage.
insert into organization_workspace_boards (org_id, state, updated_by)
select
  o.user_id,
  o.profile::jsonb -> 'workspace_board_v1',
  o.user_id
from organizations o
where jsonb_typeof(o.profile::jsonb -> 'workspace_board_v1') = 'object'
on conflict (org_id) do nothing;

-- Backfill legacy workspace collaboration invites stored in organizations.profile.
insert into organization_workspace_invites (
  id,
  org_id,
  user_id,
  user_name,
  user_email,
  created_by,
  created_at,
  expires_at,
  revoked_at,
  duration_value,
  duration_unit
)
select
  coalesce(nullif(invite_entry ->> 'id', ''), gen_random_uuid()::text) as id,
  o.user_id as org_id,
  (invite_entry ->> 'userId')::uuid as user_id,
  nullif(invite_entry ->> 'userName', '') as user_name,
  nullif(invite_entry ->> 'userEmail', '') as user_email,
  coalesce(
    case
      when coalesce(invite_entry ->> 'createdBy', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (invite_entry ->> 'createdBy')::uuid
      else null
    end,
    o.user_id
  ) as created_by,
  case
    when coalesce(invite_entry ->> 'createdAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
      then (invite_entry ->> 'createdAt')::timestamptz
    else timezone('utc', now())
  end as created_at,
  (invite_entry ->> 'expiresAt')::timestamptz as expires_at,
  case
    when coalesce(invite_entry ->> 'revokedAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
      then (invite_entry ->> 'revokedAt')::timestamptz
    else null
  end as revoked_at,
  least(
    greatest(
      case
        when coalesce(invite_entry ->> 'durationValue', '') ~ '^\d+$'
          then (invite_entry ->> 'durationValue')::integer
        else 1
      end,
      1
    ),
    12
  ) as duration_value,
  case
    when invite_entry ->> 'durationUnit' in ('hours', 'days', 'months')
      then invite_entry ->> 'durationUnit'
    else 'hours'
  end as duration_unit
from organizations o
cross join lateral jsonb_array_elements(o.profile::jsonb -> 'workspace_collaboration_v1') as invite_entry
where jsonb_typeof(o.profile::jsonb -> 'workspace_collaboration_v1') = 'array'
  and coalesce(invite_entry ->> 'userId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and coalesce(invite_entry ->> 'expiresAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_boards'
  ) then
    create trigger set_updated_at_organization_workspace_boards
      before update on organization_workspace_boards
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_invites'
  ) then
    create trigger set_updated_at_organization_workspace_invites
      before update on organization_workspace_invites
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_workspace_boards enable row level security;
alter table organization_workspace_boards force row level security;
alter table organization_workspace_invites enable row level security;
alter table organization_workspace_invites force row level security;

drop policy if exists "organization_workspace_boards_select" on public.organization_workspace_boards;
drop policy if exists "organization_workspace_boards_insert" on public.organization_workspace_boards;
drop policy if exists "organization_workspace_boards_update" on public.organization_workspace_boards;
drop policy if exists "organization_workspace_boards_delete" on public.organization_workspace_boards;

create policy "organization_workspace_boards_select" on public.organization_workspace_boards
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_boards.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_boards_insert" on public.organization_workspace_boards
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_boards.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_boards_update" on public.organization_workspace_boards
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_boards.org_id
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
      where om.org_id = organization_workspace_boards.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_boards_delete" on public.organization_workspace_boards
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_boards.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_workspace_invites_select" on public.organization_workspace_invites;
drop policy if exists "organization_workspace_invites_insert" on public.organization_workspace_invites;
drop policy if exists "organization_workspace_invites_update" on public.organization_workspace_invites;
drop policy if exists "organization_workspace_invites_delete" on public.organization_workspace_invites;

create policy "organization_workspace_invites_select" on public.organization_workspace_invites
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_invites.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_invites_insert" on public.organization_workspace_invites
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );

create policy "organization_workspace_invites_update" on public.organization_workspace_invites
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_invites.org_id
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
      where om.org_id = organization_workspace_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );

create policy "organization_workspace_invites_delete" on public.organization_workspace_invites
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff', 'board')
    )
  );
