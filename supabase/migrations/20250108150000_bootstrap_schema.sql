-- Bootstrap domain schema, constraints, and RLS policies for Coach House LMS.
set check_function_bodies = off;
set search_path = public;

create extension if not exists "pgcrypto";

create type user_role as enum ('student', 'admin');
create type module_progress_status as enum ('not_started', 'in_progress', 'completed');
create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired'
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  timezone text,
  role user_role not null default 'student',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  stripe_product_id text,
  stripe_price_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes on delete cascade,
  idx integer not null,
  slug text not null,
  title text not null,
  description text,
  video_url text,
  content_md text,
  duration_minutes integer,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (class_id, idx),
  unique (class_id, slug)
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  class_id uuid not null references classes on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, class_id)
);

create table module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  module_id uuid not null references modules on delete cascade,
  status module_progress_status not null default 'not_started',
  completed_at timestamptz,
  notes jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, module_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text not null,
  status subscription_status not null default 'trialing',
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb,
  unique (user_id, stripe_subscription_id)
);

create index enrollments_user_id_idx on enrollments (user_id);
create index enrollments_class_id_idx on enrollments (class_id);
create index module_progress_user_id_idx on module_progress (user_id);
create index module_progress_module_id_idx on module_progress (module_id);
create index modules_class_id_idx on modules (class_id);
create index subscriptions_user_id_idx on subscriptions (user_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_updated_at_profiles
before update on profiles
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_classes
before update on classes
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_modules
before update on modules
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_module_progress
before update on module_progress
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_subscriptions
before update on subscriptions
for each row execute procedure public.handle_updated_at();

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role user_role;
begin
  select role into current_role from profiles where id = auth.uid();
  return current_role = 'admin';
exception when others then
  return false;
end;
$$;


revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE classes FORCE ROW LEVEL SECURITY;
ALTER TABLE modules FORCE ROW LEVEL SECURITY;
ALTER TABLE enrollments FORCE ROW LEVEL SECURITY;
ALTER TABLE module_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_manage" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_insert" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_manage" ON profiles
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "classes_view_published" ON classes
  FOR SELECT
  USING (is_published);

CREATE POLICY "classes_view_enrolled" ON classes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.class_id = classes.id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "classes_admin_manage" ON classes
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "modules_view_published" ON modules
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = modules.class_id
        AND c.is_published
        AND modules.is_published
    )
    OR EXISTS (
      SELECT 1
      FROM enrollments e
      WHERE e.class_id = modules.class_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "modules_admin_manage" ON modules
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "enrollments_self_read" ON enrollments
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "enrollments_self_insert" ON enrollments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments_admin_manage" ON enrollments
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "progress_self_access" ON module_progress
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "progress_self_upsert" ON module_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_self_update" ON module_progress
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_admin_manage" ON module_progress
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "subscriptions_self_read" ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "subscriptions_self_update" ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_manage" ON subscriptions
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
