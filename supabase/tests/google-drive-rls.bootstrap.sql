create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key
);

create table public.organizations (
  user_id uuid primary key references public.profiles(id) on delete cascade
);

create table public.organization_memberships (
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  primary key (org_id, member_id)
);

grant select on public.organization_memberships to authenticated;

alter table public.organization_memberships enable row level security;
alter table public.organization_memberships force row level security;

create policy organization_memberships_select
on public.organization_memberships
for select
to authenticated
using (
  member_id = (select auth.uid())
  or org_id = (select auth.uid())
);

create function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

insert into public.profiles(id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');

insert into public.organizations(user_id) values
  ('00000000-0000-0000-0000-000000000001');

insert into public.organization_memberships(org_id, member_id, role) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'staff'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'board');
