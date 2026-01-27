set check_function_bodies = off;
set search_path = public;

-- Multi-account org access:
-- - members can read org-owned data
-- - staff/admin can edit org-owned data
-- - board is read-only
-- - org-role admin can invite only when enabled per org

-- Org access settings (per org)
create table if not exists organization_access_settings (
  org_id uuid primary key references organizations(user_id) on delete cascade,
  admins_can_invite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_organization_access_settings'
  ) then
    create trigger set_updated_at_organization_access_settings
    before update on organization_access_settings
    for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_access_settings enable row level security;
alter table organization_access_settings force row level security;

drop policy if exists "organization_access_settings_select" on public.organization_access_settings;
drop policy if exists "organization_access_settings_insert" on public.organization_access_settings;
drop policy if exists "organization_access_settings_update" on public.organization_access_settings;
drop policy if exists "organization_access_settings_delete" on public.organization_access_settings;

create policy "organization_access_settings_select" on public.organization_access_settings
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_access_settings.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_access_settings_insert" on public.organization_access_settings
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
  );

create policy "organization_access_settings_update" on public.organization_access_settings
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

create policy "organization_access_settings_delete" on public.organization_access_settings
  for delete
  to authenticated
  using (public.is_admin() or org_id = (select auth.uid()));

-- Organizations: include org membership in access checks.
drop policy if exists "organizations_select" on public.organizations;
drop policy if exists "organizations_insert" on public.organizations;
drop policy if exists "organizations_update" on public.organizations;
drop policy if exists "organizations_delete" on public.organizations;

create policy "organizations_select" on public.organizations
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organizations.user_id
        and om.member_id = (select auth.uid())
    )
    or (is_public and public_slug is not null)
    or (is_public_roadmap and public_slug is not null)
  );

create policy "organizations_insert" on public.organizations
  for insert
  to authenticated
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organizations.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organizations_update" on public.organizations
  for update
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organizations.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  )
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organizations.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organizations_delete" on public.organizations
  for delete
  to authenticated
  using (public.is_admin());

-- Subscriptions: allow org staff/admin to read the org subscription status.
drop policy if exists "subscriptions_select" on public.subscriptions;

create policy "subscriptions_select" on public.subscriptions
  for select
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = subscriptions.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

-- Programs: include org membership in access checks.
drop policy if exists "programs_select" on public.programs;
drop policy if exists "programs_insert" on public.programs;
drop policy if exists "programs_update" on public.programs;
drop policy if exists "programs_delete" on public.programs;

create policy "programs_select" on public.programs
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = programs.user_id
        and om.member_id = (select auth.uid())
    )
    or is_public
  );

create policy "programs_insert" on public.programs
  for insert
  to authenticated
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = programs.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "programs_update" on public.programs
  for update
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = programs.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  )
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = programs.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "programs_delete" on public.programs
  for delete
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = programs.user_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

-- Roadmap events: members can read; staff/admin can write.
drop policy if exists "roadmap_events_select" on public.roadmap_events;
drop policy if exists "roadmap_events_insert" on public.roadmap_events;
drop policy if exists "roadmap_events_delete" on public.roadmap_events;

create policy "roadmap_events_select" on public.roadmap_events
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = roadmap_events.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "roadmap_events_insert" on public.roadmap_events
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = roadmap_events.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "roadmap_events_delete" on public.roadmap_events
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = roadmap_events.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

-- Organization invites: owner-managed by default; org-role admins can invite when enabled.
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
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = organization_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and s.admins_can_invite = true
    )
  );

create policy "organization_invites_insert" on public.organization_invites
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = organization_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and s.admins_can_invite = true
    )
  );

create policy "organization_invites_update" on public.organization_invites
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = organization_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and s.admins_can_invite = true
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = organization_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and s.admins_can_invite = true
    )
  );

create policy "organization_invites_delete" on public.organization_invites
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings s on s.org_id = om.org_id
      where om.org_id = organization_invites.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and s.admins_can_invite = true
    )
  );

-- Storage policies (storage.objects)

-- org-documents: members can read; staff/admin can write.
drop policy if exists "org_documents_read_own" on storage.objects;
drop policy if exists "org_documents_insert_own" on storage.objects;
drop policy if exists "org_documents_update_own" on storage.objects;
drop policy if exists "org_documents_delete_own" on storage.objects;

create policy "org_documents_read_own" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'org-documents'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
      )
    )
  );

create policy "org_documents_insert_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'org-documents'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

create policy "org_documents_update_own" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'org-documents'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  )
  with check (
    bucket_id = 'org-documents'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

create policy "org_documents_delete_own" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'org-documents'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

-- org-media: public read stays; allow staff/admin to write to org folder.
drop policy if exists "org_media_insert_own" on storage.objects;
drop policy if exists "org_media_update_own" on storage.objects;
drop policy if exists "org_media_delete_own" on storage.objects;

create policy "org_media_insert_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'org-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

create policy "org_media_update_own" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'org-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  )
  with check (
    bucket_id = 'org-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

create policy "org_media_delete_own" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'org-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

-- program-media: public read stays; allow staff/admin to write to org folder.
drop policy if exists "program_media_insert_own" on storage.objects;
drop policy if exists "program_media_update_own" on storage.objects;
drop policy if exists "program_media_delete_own" on storage.objects;

create policy "program_media_insert_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'program-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

create policy "program_media_update_own" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'program-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  )
  with check (
    bucket_id = 'program-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );

create policy "program_media_delete_own" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'program-media'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.organization_memberships om
        where om.org_id::text = split_part(name, '/', 1)
          and om.member_id = auth.uid()
          and om.role in ('admin', 'staff')
      )
    )
  );
