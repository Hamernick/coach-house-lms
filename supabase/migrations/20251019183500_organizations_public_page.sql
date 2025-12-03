set check_function_bodies = off;
set search_path = public;

-- Add public page fields
alter table organizations add column if not exists public_slug text;
alter table organizations add column if not exists is_public boolean not null default false;

-- Enforce slug format (lowercase letters, numbers, dashes), optional when null
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'organizations_public_slug_format_check'
  ) then
    alter table organizations add constraint organizations_public_slug_format_check
      check (public_slug is null or public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end $$;

-- Unique slug (case-insensitive), only when present
do $$ begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and indexname = 'uniq_organizations_public_slug_lower'
  ) then
    create unique index uniq_organizations_public_slug_lower
      on organizations (lower(public_slug)) where public_slug is not null;
  end if;
end $$;

-- Public read when explicitly published
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_public_read'
  ) then
    execute 'create policy "organizations_public_read" on organizations for select to anon, authenticated using (is_public and public_slug is not null)';
  end if;
end $$;

