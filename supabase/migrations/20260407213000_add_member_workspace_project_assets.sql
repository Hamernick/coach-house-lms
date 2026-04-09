set check_function_bodies = off;
set search_path = public;

insert into storage.buckets (id, name, public, file_size_limit)
select 'project-assets', 'project-assets', false, 52428800
where not exists (select 1 from storage.buckets where id = 'project-assets');

create table if not exists organization_project_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  project_id uuid not null references organization_projects(id) on delete cascade,
  name text not null,
  description text,
  asset_type text not null default 'file',
  storage_path text,
  external_url text,
  mime text,
  size_bytes bigint,
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_project_assets_asset_type_check
    check (asset_type in ('pdf', 'zip', 'fig', 'doc', 'file')),
  constraint organization_project_assets_size_bytes_check
    check (size_bytes is null or size_bytes >= 0),
  constraint organization_project_assets_location_check
    check (
      (storage_path is not null and external_url is null)
      or (storage_path is null and external_url is not null)
    )
);

create index if not exists organization_project_assets_org_id_project_id_idx
  on organization_project_assets (org_id, project_id);
create index if not exists organization_project_assets_org_id_created_at_idx
  on organization_project_assets (org_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_project_assets'
  ) then
    create trigger set_updated_at_organization_project_assets
      before update on organization_project_assets
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_project_assets enable row level security;
alter table organization_project_assets force row level security;

drop policy if exists "organization_project_assets_select" on public.organization_project_assets;
drop policy if exists "organization_project_assets_insert" on public.organization_project_assets;
drop policy if exists "organization_project_assets_update" on public.organization_project_assets;
drop policy if exists "organization_project_assets_delete" on public.organization_project_assets;

create policy "organization_project_assets_select" on public.organization_project_assets
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_assets.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_project_assets_insert" on public.organization_project_assets
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_assets.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_project_assets_update" on public.organization_project_assets
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_assets.org_id
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
      where om.org_id = organization_project_assets.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_project_assets_delete" on public.organization_project_assets
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_assets.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "project_assets_read" on storage.objects;
drop policy if exists "project_assets_insert" on storage.objects;
drop policy if exists "project_assets_update" on storage.objects;
drop policy if exists "project_assets_delete" on storage.objects;

create policy "project_assets_read" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-assets'
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

create policy "project_assets_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-assets'
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

create policy "project_assets_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'project-assets'
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
    bucket_id = 'project-assets'
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

create policy "project_assets_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-assets'
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
