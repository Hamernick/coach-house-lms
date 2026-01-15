set search_path = public;

-- Rename legacy "student" role label to "member" (platform users are not "students").
-- This preserves existing enum values while updating display + literals.

do $$ begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role' and e.enumlabel = 'student'
  ) then
    execute 'alter type public.user_role rename value ''student'' to ''member''';
  end if;
end $$;

-- Prevent non-admin users from changing their own role; ensure self-insert stays pinned to the default role.
do $$ begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_insert'
  ) then
    execute 'alter policy "profiles_self_insert" on profiles '
         || 'with check (auth.uid() = id and role = ''member'')';
  end if;
end $$;

