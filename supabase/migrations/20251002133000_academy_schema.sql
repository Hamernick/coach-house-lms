set check_function_bodies = off;
set search_path = public;

-- Add columns to classes
alter table if exists public.classes
  add column if not exists session_number int not null default 1,
  add column if not exists position int not null default 1,
  add column if not exists is_published boolean not null default false;

-- Try to mirror existing published flag if present
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'classes' and column_name = 'published'
  ) then
    update public.classes set is_published = coalesce(published, false) where true;
  end if;
end $$;

-- Add columns to modules
alter table if exists public.modules
  add column if not exists index_in_class int,
  add column if not exists position int,
  add column if not exists is_published boolean not null default false;

-- Fill index_in_class/position from legacy columns if present
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'modules' and column_name = 'idx'
  ) then
    update public.modules set index_in_class = coalesce(index_in_class, idx), position = coalesce(position, idx) where true;
  else
    -- fallback populate if empty
    update public.modules set index_in_class = coalesce(index_in_class, 1), position = coalesce(position, 1) where true;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'modules' and column_name = 'published'
  ) then
    update public.modules set is_published = coalesce(published, false) where true;
  end if;
end $$;

-- Constraints
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='modules' and constraint_name='modules_class_index_unique'
  ) then
    alter table public.modules add constraint modules_class_index_unique unique (class_id, index_in_class);
  end if;
end $$;

-- Module content
create table if not exists public.module_content (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  video_url text,
  transcript text,
  talking_points jsonb default '[]'::jsonb,
  interactions jsonb default '[]'::jsonb,
  resources jsonb default '[]'::jsonb,
  homework jsonb default '[]'::jsonb,
  admin_notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  unique(module_id)
);

create trigger set_updated_at_module_content
before update on public.module_content
for each row execute procedure public.handle_updated_at();

-- RLS enable
alter table public.module_content enable row level security;

-- READ policies: leverage existing public.is_admin() if present
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='classes' and policyname='read published classes'
  ) then
    create policy "read published classes" on public.classes for select using (is_published or public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='modules' and policyname='read published modules'
  ) then
    create policy "read published modules" on public.modules for select using (
      exists (select 1 from public.classes c where c.id = class_id and (c.is_published or public.is_admin()))
      and (is_published or public.is_admin())
    );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='module_content' and policyname='read module content'
  ) then
    create policy "read module content" on public.module_content for select using (
      exists (
        select 1 from public.modules m
        join public.classes c on c.id = m.class_id
        where m.id = module_id and ((m.is_published and c.is_published) or public.is_admin())
      )
    );
  end if;
end $$;

-- WRITE policies (admins manage)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='classes' and policyname='admins manage classes'
  ) then
    create policy "admins manage classes" on public.classes for all using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='modules' and policyname='admins manage modules'
  ) then
    create policy "admins manage modules" on public.modules for all using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='module_content' and policyname='admins manage content'
  ) then
    create policy "admins manage content" on public.module_content for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

