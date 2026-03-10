set check_function_bodies = off;
set search_path = public;

create table if not exists organization_workspace_communications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  channel text not null,
  media_mode text not null,
  content text not null,
  status text not null default 'scheduled',
  scheduled_for timestamptz not null,
  posted_at timestamptz,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_communications_channel_check check (channel in ('social', 'email', 'blog')),
  constraint organization_workspace_communications_media_mode_check check (media_mode in ('text', 'image', 'video')),
  constraint organization_workspace_communications_status_check check (status in ('scheduled', 'posted')),
  constraint organization_workspace_communications_status_posted_at_check check (
    (status = 'scheduled')
    or (status = 'posted' and posted_at is not null)
  )
);

create index if not exists organization_workspace_communications_org_id_idx
  on organization_workspace_communications (org_id);
create index if not exists organization_workspace_communications_org_id_scheduled_for_idx
  on organization_workspace_communications (org_id, scheduled_for desc);
create index if not exists organization_workspace_communications_org_id_status_idx
  on organization_workspace_communications (org_id, status);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_communications'
  ) then
    create trigger set_updated_at_organization_workspace_communications
      before update on organization_workspace_communications
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_workspace_communications enable row level security;
alter table organization_workspace_communications force row level security;

drop policy if exists "organization_workspace_communications_select" on public.organization_workspace_communications;
drop policy if exists "organization_workspace_communications_insert" on public.organization_workspace_communications;
drop policy if exists "organization_workspace_communications_update" on public.organization_workspace_communications;
drop policy if exists "organization_workspace_communications_delete" on public.organization_workspace_communications;

create policy "organization_workspace_communications_select" on public.organization_workspace_communications
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communications.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_communications_insert" on public.organization_workspace_communications
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communications.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_communications_update" on public.organization_workspace_communications
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communications.org_id
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
      where om.org_id = organization_workspace_communications.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_communications_delete" on public.organization_workspace_communications
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communications.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );
