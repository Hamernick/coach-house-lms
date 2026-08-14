create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create table public.profiles (
  id uuid primary key
);

create function public.is_admin()
returns boolean
language sql
stable
as $$
  select false;
$$;

insert into public.profiles (id)
values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
