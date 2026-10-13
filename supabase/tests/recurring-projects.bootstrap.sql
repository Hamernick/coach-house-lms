create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create table profiles(id uuid primary key, role text);
create function public.is_admin() returns boolean language sql stable as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create table organizations(user_id uuid primary key references profiles(id));
create table organization_memberships(org_id uuid, member_id uuid, role text);
create function public.handle_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
grant usage on schema auth, public to anon, authenticated, service_role;
grant select on profiles, organization_memberships to authenticated;
