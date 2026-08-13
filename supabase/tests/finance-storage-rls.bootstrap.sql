create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create extension if not exists pgcrypto;
create schema auth;
create schema storage;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

create table public.organizations (
  user_id uuid primary key references public.profiles(id) on delete cascade
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null
);

create table public.platform_staff_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_level text not null
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_staff_members staff
    where staff.user_id = (select auth.uid())
      and staff.access_level = 'developer'
  );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');

insert into public.profiles (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');

insert into public.organizations (user_id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');

create type public.organization_member_role
  as enum ('owner', 'admin', 'staff', 'board', 'member');

create table public.organization_memberships (
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_member_role not null default 'member',
  member_email text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (org_id, member_id)
);

create index organization_memberships_member_id_idx
  on public.organization_memberships (member_id, org_id);

insert into public.organization_memberships (
  org_id,
  member_id,
  role,
  member_email
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'board',
  'board@example.org'
);

insert into public.platform_staff_members (user_id, access_level) values
  ('00000000-0000-0000-0000-000000000004', 'developer');
