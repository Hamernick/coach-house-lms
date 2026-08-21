create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id uuid primary key
);

create table public.profiles (
  id uuid primary key references auth.users(id)
);

create table public.organizations (
  user_id uuid primary key references auth.users(id)
);

create table public.platform_staff_members (
  user_id uuid primary key references public.profiles(id),
  access_level text not null
);

create table public.organization_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id),
  project_kind text not null default 'standard',
  name text not null,
  description text,
  status text not null,
  priority text not null,
  progress integer not null,
  start_date date not null,
  end_date date not null,
  type_label text,
  tags text[] not null default '{}',
  member_labels text[] not null default '{}',
  task_count integer not null default 0,
  created_source text not null,
  starter_seed_key text,
  starter_seed_version integer,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index organization_projects_org_id_starter_seed_key_idx
  on public.organization_projects (org_id, starter_seed_key);

create table public.organization_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.organization_projects(id),
  title text not null,
  description text
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  description text not null,
  href text,
  tone text,
  type text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.create_organization_task_transition(
  p_actor_id uuid,
  p_project_id uuid,
  p_title text,
  p_description text,
  p_task_type text,
  p_status text,
  p_start_date date,
  p_end_date date,
  p_priority text,
  p_tag_label text,
  p_workstream_name text,
  p_assignee_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task_id uuid;
begin
  insert into public.organization_tasks (project_id, title, description)
  values (p_project_id, p_title, p_description)
  returning id into v_task_id;

  return jsonb_build_object('ok', true, 'taskId', v_task_id);
end;
$$;
