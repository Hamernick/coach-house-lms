set check_function_bodies = off;
set search_path = public;

create table if not exists organization_access_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  invitee_user_id uuid not null references profiles(id) on delete cascade,
  invitee_email text not null,
  role organization_member_role not null default 'member',
  status text not null default 'pending',
  invited_by_user_id uuid references profiles(id) on delete set null,
  organization_invite_id uuid references organization_invites(id) on delete set null,
  message text,
  created_at timestamptz not null default timezone('utc', now()),
  responded_at timestamptz,
  expires_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_access_requests_status_check
    check (status in ('pending', 'accepted', 'declined', 'expired', 'revoked'))
);

create index if not exists organization_access_requests_org_id_idx
  on organization_access_requests (org_id, created_at desc);
create index if not exists organization_access_requests_invitee_user_id_idx
  on organization_access_requests (invitee_user_id, created_at desc);
create index if not exists organization_access_requests_status_idx
  on organization_access_requests (status, expires_at);
create unique index if not exists organization_access_requests_pending_unique_idx
  on organization_access_requests (org_id, invitee_user_id)
  where status = 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_access_requests'
  ) then
    create trigger set_updated_at_organization_access_requests
      before update on organization_access_requests
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_access_requests enable row level security;
alter table organization_access_requests force row level security;

drop policy if exists "organization_access_requests_select" on public.organization_access_requests;
drop policy if exists "organization_access_requests_insert" on public.organization_access_requests;
drop policy if exists "organization_access_requests_update" on public.organization_access_requests;
drop policy if exists "organization_access_requests_delete" on public.organization_access_requests;

create policy "organization_access_requests_select" on public.organization_access_requests
  for select
  to authenticated
  using (
    public.is_admin()
    or invitee_user_id = (select auth.uid())
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings oas
        on oas.org_id = om.org_id
      where om.org_id = organization_access_requests.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and coalesce(oas.admins_can_invite, false)
    )
  );

create policy "organization_access_requests_insert" on public.organization_access_requests
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings oas
        on oas.org_id = om.org_id
      where om.org_id = organization_access_requests.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and coalesce(oas.admins_can_invite, false)
    )
  );

create policy "organization_access_requests_update" on public.organization_access_requests
  for update
  to authenticated
  using (
    public.is_admin()
    or invitee_user_id = (select auth.uid())
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings oas
        on oas.org_id = om.org_id
      where om.org_id = organization_access_requests.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and coalesce(oas.admins_can_invite, false)
    )
  )
  with check (
    public.is_admin()
    or invitee_user_id = (select auth.uid())
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings oas
        on oas.org_id = om.org_id
      where om.org_id = organization_access_requests.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and coalesce(oas.admins_can_invite, false)
    )
  );

create policy "organization_access_requests_delete" on public.organization_access_requests
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
  );
