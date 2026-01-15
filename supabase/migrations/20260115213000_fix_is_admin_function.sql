set check_function_bodies = off;
set search_path = public;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

