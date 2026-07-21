set check_function_bodies = off;
set search_path = public;

create table if not exists public.platform_staff_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_level text not null check (access_level in ('developer', 'coach')),
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_updated_at_platform_staff_members
  on public.platform_staff_members;
create trigger set_updated_at_platform_staff_members
before update on public.platform_staff_members
for each row execute procedure public.handle_updated_at();

alter table public.platform_staff_members enable row level security;
alter table public.platform_staff_members force row level security;

revoke all on table public.platform_staff_members from anon;
grant select, insert, update, delete
  on table public.platform_staff_members
  to authenticated;

insert into public.platform_staff_members (user_id, access_level)
select id, 'developer'
from public.profiles
where role = 'admin'
on conflict (user_id) do nothing;

insert into public.platform_staff_members (user_id, access_level)
select id, 'coach'
from public.profiles
where lower(email) in (
  'paula@coachhousesolutions.org',
  'fs@coachhousesolutions.org',
  'joel@amorejustchicago.org'
)
on conflict (user_id) do update
set access_level = excluded.access_level,
    updated_at = timezone('utc', now());

update public.profiles
set role = 'member'
where lower(email) in (
  'paula@coachhousesolutions.org',
  'fs@coachhousesolutions.org',
  'joel@amorejustchicago.org'
);

create or replace function public.current_platform_access_level()
returns text
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select access_level
  from public.platform_staff_members
  where user_id = (select auth.uid());
$$;

create or replace function public.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(
    exists (
      select 1
      from public.platform_staff_members
      where user_id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(
    (
      select access_level = 'developer'
      from public.platform_staff_members
      where user_id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.current_platform_access_level() from public;
revoke all on function public.is_platform_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_platform_access_level() to authenticated;
grant execute on function public.is_platform_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "platform_staff_members_select" on public.platform_staff_members;
drop policy if exists "platform_staff_members_insert" on public.platform_staff_members;
drop policy if exists "platform_staff_members_update" on public.platform_staff_members;
drop policy if exists "platform_staff_members_delete" on public.platform_staff_members;

create policy "platform_staff_members_select"
on public.platform_staff_members
for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "platform_staff_members_insert"
on public.platform_staff_members
for insert
to authenticated
with check ((select public.is_admin()));

create policy "platform_staff_members_update"
on public.platform_staff_members
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "platform_staff_members_delete"
on public.platform_staff_members
for delete
to authenticated
using ((select public.is_admin()));
