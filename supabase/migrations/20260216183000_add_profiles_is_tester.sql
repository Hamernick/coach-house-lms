set check_function_bodies = off;
set search_path = public;

alter table public.profiles
  add column if not exists is_tester boolean not null default false;

-- Keep tester audience assignment admin-controlled.
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()) and role = 'member' and is_tester = false);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update
  to authenticated
  using (public.is_admin() or id = (select auth.uid()))
  with check (
    public.is_admin()
    or (
      id = (select auth.uid())
      and role = (select role from public.profiles where id = (select auth.uid()))
      and is_tester = (select is_tester from public.profiles where id = (select auth.uid()))
    )
  );
