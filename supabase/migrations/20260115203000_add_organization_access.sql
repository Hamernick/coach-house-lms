set check_function_bodies = off;
set search_path = public;

-- Organization access: per-org membership + invite tokens.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'organization_member_role'
  ) then
    create type organization_member_role as enum ('owner', 'admin', 'staff', 'board', 'member');
  end if;
end $$;

create table if not exists organization_memberships (
  org_id uuid not null references organizations(user_id) on delete cascade,
  member_id uuid not null references auth.users on delete cascade,
  role organization_member_role not null default 'member',
  member_email text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (org_id, member_id)
);

create index if not exists organization_memberships_org_id_idx on organization_memberships (org_id);
create index if not exists organization_memberships_member_id_idx on organization_memberships (member_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_memberships'
  ) then
    create trigger set_updated_at_organization_memberships
    before update on organization_memberships
    for each row execute procedure public.handle_updated_at();
  end if;
end $$;

create table if not exists organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  email text not null,
  role organization_member_role not null default 'member',
  token text not null unique,
  expires_at timestamptz not null,
  invited_by uuid references auth.users on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists organization_invites_org_id_idx on organization_invites (org_id);
create index if not exists organization_invites_email_idx on organization_invites (email);
create index if not exists organization_invites_token_idx on organization_invites (token);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_invites'
  ) then
    create trigger set_updated_at_organization_invites
    before update on organization_invites
    for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_memberships enable row level security;
alter table organization_memberships force row level security;
alter table organization_invites enable row level security;
alter table organization_invites force row level security;

-- Memberships: org owners manage; members can read their own.
drop policy if exists "organization_memberships_select" on public.organization_memberships;
drop policy if exists "organization_memberships_insert" on public.organization_memberships;
drop policy if exists "organization_memberships_update" on public.organization_memberships;
drop policy if exists "organization_memberships_delete" on public.organization_memberships;

create policy "organization_memberships_select" on public.organization_memberships
  for select
  to authenticated
  using (
    public.is_admin()
    or member_id = (select auth.uid())
    or org_id = (select auth.uid())
  );

create policy "organization_memberships_insert" on public.organization_memberships
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
  );

create policy "organization_memberships_update" on public.organization_memberships
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
  );

create policy "organization_memberships_delete" on public.organization_memberships
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
  );

-- Invites: org owners manage + can read; invite acceptance handled server-side.
drop policy if exists "organization_invites_select" on public.organization_invites;
drop policy if exists "organization_invites_insert" on public.organization_invites;
drop policy if exists "organization_invites_update" on public.organization_invites;
drop policy if exists "organization_invites_delete" on public.organization_invites;

create policy "organization_invites_select" on public.organization_invites
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
  );

create policy "organization_invites_insert" on public.organization_invites
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
  );

create policy "organization_invites_update" on public.organization_invites
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
  );

create policy "organization_invites_delete" on public.organization_invites
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
  );

