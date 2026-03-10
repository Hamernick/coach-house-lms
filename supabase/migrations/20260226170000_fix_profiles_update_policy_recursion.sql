set check_function_bodies = off;
set search_path = public;

-- Helpers for profiles self-update policy checks.
-- These run with RLS disabled to avoid recursive policy evaluation on public.profiles.
create or replace function public.current_profile_role()
returns public.user_role
language sql
security definer
set search_path = public
set row_security = off
as $$
  select (
    select role
    from public.profiles
    where id = (select auth.uid())
  );
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

create or replace function public.current_profile_is_tester()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (
      select is_tester
      from public.profiles
      where id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.current_profile_is_tester() from public;
grant execute on function public.current_profile_is_tester() to authenticated;

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update
  to authenticated
  using (public.is_admin() or id = (select auth.uid()))
  with check (
    public.is_admin()
    or (
      id = (select auth.uid())
      and role = public.current_profile_role()
      and is_tester = public.current_profile_is_tester()
    )
  );
