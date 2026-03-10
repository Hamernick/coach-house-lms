set check_function_bodies = off;
set search_path = public;

create table if not exists organization_workspace_communication_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  communication_id uuid not null references organization_workspace_communications(id) on delete cascade,
  channel text not null,
  status text not null default 'queued',
  provider text not null default 'mock',
  attempt_count integer not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  queued_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_workspace_communication_deliveries_channel_check check (channel in ('social', 'email', 'blog')),
  constraint organization_workspace_communication_deliveries_status_check check (status in ('queued', 'sent', 'failed')),
  constraint organization_workspace_communication_deliveries_status_sent_at_check check (
    (status = 'queued' and sent_at is null)
    or (status in ('sent', 'failed'))
  ),
  constraint organization_workspace_communication_deliveries_unique unique (communication_id, channel)
);

create index if not exists organization_workspace_communication_deliveries_org_id_idx
  on organization_workspace_communication_deliveries (org_id);
create index if not exists organization_workspace_communication_deliveries_org_id_status_idx
  on organization_workspace_communication_deliveries (org_id, status);
create index if not exists organization_workspace_communication_deliveries_queue_idx
  on organization_workspace_communication_deliveries (org_id, status, queued_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_workspace_communication_deliveries'
  ) then
    create trigger set_updated_at_organization_workspace_communication_deliveries
      before update on organization_workspace_communication_deliveries
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_workspace_communication_deliveries enable row level security;
alter table organization_workspace_communication_deliveries force row level security;

drop policy if exists "organization_workspace_communication_deliveries_select" on public.organization_workspace_communication_deliveries;
drop policy if exists "organization_workspace_communication_deliveries_insert" on public.organization_workspace_communication_deliveries;
drop policy if exists "organization_workspace_communication_deliveries_update" on public.organization_workspace_communication_deliveries;
drop policy if exists "organization_workspace_communication_deliveries_delete" on public.organization_workspace_communication_deliveries;

create policy "organization_workspace_communication_deliveries_select" on public.organization_workspace_communication_deliveries
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_deliveries.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_workspace_communication_deliveries_insert" on public.organization_workspace_communication_deliveries
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_deliveries.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_communication_deliveries_update" on public.organization_workspace_communication_deliveries
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_deliveries.org_id
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
      where om.org_id = organization_workspace_communication_deliveries.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_workspace_communication_deliveries_delete" on public.organization_workspace_communication_deliveries
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_workspace_communication_deliveries.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );
