set check_function_bodies = off;
set search_path = public;

-- Programs created by organization owners (one org per user_id)
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  slug text,
  title text not null,
  subtitle text,
  location text,
  image_url text,
  duration_label text,
  start_date timestamptz,
  end_date timestamptz,
  features text[],
  status_label text,
  goal_cents integer default 0,
  raised_cents integer default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, slug)
);

create trigger set_updated_at_programs
before update on programs
for each row execute procedure public.handle_updated_at();

-- Slug lowercase-dash format when present
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'programs_slug_format_check'
  ) then
    alter table programs add constraint programs_slug_format_check
      check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end $$;

-- Public read for published programs
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_public_read'
  ) then
    execute 'create policy "programs_public_read" on programs for select to anon, authenticated using (is_public)';
  end if;
end $$;

-- Owner manage
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_self_read'
  ) then
    execute 'create policy "programs_self_read" on programs for select using (user_id = auth.uid())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_self_insert'
  ) then
    execute 'create policy "programs_self_insert" on programs for insert with check (user_id = auth.uid())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_self_update'
  ) then
    execute 'create policy "programs_self_update" on programs for update using (user_id = auth.uid()) with check (user_id = auth.uid())';
  end if;
end $$;

-- Admin manage
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_admin_manage'
  ) then
    execute 'create policy "programs_admin_manage" on programs using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

alter table programs enable row level security;
alter table programs force row level security;
