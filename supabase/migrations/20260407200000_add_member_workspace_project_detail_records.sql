set check_function_bodies = off;
set search_path = public;

create table if not exists organization_project_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  project_id uuid not null references organization_projects(id) on delete cascade,
  title text not null,
  content text,
  note_type text not null default 'general',
  status text not null default 'completed',
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_project_notes_note_type_check
    check (note_type in ('general', 'meeting', 'audio')),
  constraint organization_project_notes_status_check
    check (status in ('completed', 'processing'))
);

create index if not exists organization_project_notes_org_id_project_id_idx
  on organization_project_notes (org_id, project_id);
create index if not exists organization_project_notes_org_id_created_at_idx
  on organization_project_notes (org_id, created_at desc);

create table if not exists organization_project_quick_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  project_id uuid not null references organization_projects(id) on delete cascade,
  name text not null,
  url text not null,
  link_type text not null default 'file',
  size_mb numeric(10, 1) not null default 0,
  created_by uuid not null references profiles(id) on delete restrict,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_project_quick_links_link_type_check
    check (link_type in ('pdf', 'zip', 'fig', 'doc', 'file')),
  constraint organization_project_quick_links_size_mb_check
    check (size_mb >= 0)
);

create index if not exists organization_project_quick_links_org_id_project_id_idx
  on organization_project_quick_links (org_id, project_id);
create index if not exists organization_project_quick_links_org_id_created_at_idx
  on organization_project_quick_links (org_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_project_notes'
  ) then
    create trigger set_updated_at_organization_project_notes
      before update on organization_project_notes
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_project_quick_links'
  ) then
    create trigger set_updated_at_organization_project_quick_links
      before update on organization_project_quick_links
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table organization_project_notes enable row level security;
alter table organization_project_notes force row level security;
alter table organization_project_quick_links enable row level security;
alter table organization_project_quick_links force row level security;

drop policy if exists "organization_project_notes_select" on public.organization_project_notes;
drop policy if exists "organization_project_notes_insert" on public.organization_project_notes;
drop policy if exists "organization_project_notes_update" on public.organization_project_notes;
drop policy if exists "organization_project_notes_delete" on public.organization_project_notes;

create policy "organization_project_notes_select" on public.organization_project_notes
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_notes.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_project_notes_insert" on public.organization_project_notes
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_notes.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_project_notes_update" on public.organization_project_notes
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_notes.org_id
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
      where om.org_id = organization_project_notes.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_project_notes_delete" on public.organization_project_notes
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_notes.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

drop policy if exists "organization_project_quick_links_select" on public.organization_project_quick_links;
drop policy if exists "organization_project_quick_links_insert" on public.organization_project_quick_links;
drop policy if exists "organization_project_quick_links_update" on public.organization_project_quick_links;
drop policy if exists "organization_project_quick_links_delete" on public.organization_project_quick_links;

create policy "organization_project_quick_links_select" on public.organization_project_quick_links
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_quick_links.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "organization_project_quick_links_insert" on public.organization_project_quick_links
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_quick_links.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_project_quick_links_update" on public.organization_project_quick_links
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_quick_links.org_id
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
      where om.org_id = organization_project_quick_links.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );

create policy "organization_project_quick_links_delete" on public.organization_project_quick_links
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = organization_project_quick_links.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  );
