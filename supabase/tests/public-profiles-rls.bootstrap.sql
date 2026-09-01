create role anon nologin;
create role authenticated nologin;

create type public.organization_member_role
as enum ('owner', 'admin', 'staff', 'board', 'member');

create schema auth;

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table auth.users (
  id uuid primary key
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text
);

create table public.organizations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  public_slug text,
  is_public boolean not null default false
);

create table public.organization_memberships (
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_member_role not null default 'member',
  primary key (org_id, member_id)
);

create table public.resource_map_public_items (
  item_id uuid primary key
);

create function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select false;
$$;

grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant select on table public.organizations to anon, authenticated;

insert into auth.users (id)
values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');

insert into public.profiles (id, full_name)
values
  ('00000000-0000-0000-0000-000000000001', 'Caleb Example'),
  ('00000000-0000-0000-0000-000000000002', 'Second Person'),
  ('00000000-0000-0000-0000-000000000003', 'Public Organization'),
  ('00000000-0000-0000-0000-000000000004', 'Private Organization');

insert into public.organizations (user_id, profile, public_slug, is_public)
values
  (
    '00000000-0000-0000-0000-000000000003',
    '{"name":"Open House"}',
    'open-house',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '{"name":"Quiet House"}',
    'quiet-house',
    false
  );

insert into public.organization_memberships (org_id, member_id, role)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'staff'
);

insert into public.resource_map_public_items (item_id)
values ('20000000-0000-0000-0000-000000000001');
