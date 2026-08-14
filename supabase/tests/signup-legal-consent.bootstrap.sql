create role anon nologin;
create role authenticated nologin;

create schema auth;

create function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid;
$$;

create table auth.users (
  id uuid primary key,
  raw_user_meta_data jsonb,
  raw_app_meta_data jsonb,
  created_at timestamptz not null default now()
);
