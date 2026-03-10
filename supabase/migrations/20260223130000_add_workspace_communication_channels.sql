set check_function_bodies = off;
set search_path = public;

create table if not exists organization_workspace_communication_channels (
  org_id uuid not null references organizations(user_id) on delete cascade,
  channel text not null,
  is_connected boolean not null default false,
  provider text,
  connected_by uuid references profiles(id) on delete set null,
  connected_at timestamptz,
  disconnected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (org_id, channel),
  constraint organization_workspace_communication_channels_channel_check
    check (channel in ('social', 'email', 'blog'))
);

create index if not exists organization_workspace_communication_channels_org_id_idx
  on organization_workspace_communication_channels (org_id);
create index if not exists organization_workspace_communication_channels_connected_idx
  on organization_workspace_communication_channels (org_id, is_connected);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_communication_channels'
  ) then
    create trigger set_updated_at_organization_workspace_communication_channels
      before update on organization_workspace_communication_channels
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_workspace_communication_channels enable row level security;
alter table organization_workspace_communication_channels force row level security;

drop policy if exists "organization_workspace_communication_channels_select" on public.organization_workspace_communication_channels;
drop policy if exists "organization_workspace_communication_channels_insert" on public.organization_workspace_communication_channels;
drop policy if exists "organization_workspace_communication_channels_update" on public.organization_workspace_communication_channels;
drop policy if exists "organization_workspace_communication_channels_delete" on public.organization_workspace_communication_channels;

create policy "organization_workspace_communication_channels_select" on public.organization_workspace_communication_channels
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_channels.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_communication_channels_insert" on public.organization_workspace_communication_channels
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_channels.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_communication_channels_update" on public.organization_workspace_communication_channels
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_channels.org_id
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
      where om.org_id = organization_workspace_communication_channels.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_communication_channels_delete" on public.organization_workspace_communication_channels
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_channels.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );
