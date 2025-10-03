set search_path = public;

-- Prevent non-admin users from changing their own role.
-- Tighten self-insert and self-update policies on profiles.

do $$ begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_update'
  ) then
    execute 'alter policy "profiles_self_update" on profiles '
         || 'using (auth.uid() = id) '
         || 'with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_insert'
  ) then
    execute 'alter policy "profiles_self_insert" on profiles '
         || 'with check (auth.uid() = id and role = ''student'')';
  end if;
end $$;

