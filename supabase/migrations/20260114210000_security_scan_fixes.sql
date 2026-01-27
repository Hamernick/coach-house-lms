set search_path = public;

-- Supabase Security Scan:
-- - Ensure the search index view respects the querying user's RLS (avoid SECURITY DEFINER behavior).
-- - Ensure trigger functions have an immutable search_path.

do $$ begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'search_index' and c.relkind = 'v'
  ) then
    execute 'alter view public.search_index set (security_invoker = true)';
    execute 'revoke all on public.search_index from public';
    execute 'revoke all on public.search_index from anon';
    execute 'revoke all on public.search_index from authenticated';
  end if;
end $$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

