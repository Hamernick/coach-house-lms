-- Personal Google Calendar credentials and cache are service-only.
-- Rollback: disable the feature and worker, then drop these two tables.
create table public.google_calendar_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  google_subject text not null,
  google_email text not null,
  refresh_secret jsonb,
  granted_scopes text[] not null default '{}',
  status text not null default 'connected' check (status in ('connected','reconnect_required','disconnected')),
  enabled boolean not null default false,
  export_org_id uuid references public.organizations(user_id) on delete set null,
  time_zone text not null default 'UTC',
  state jsonb not null default '{"selected":[],"caches":{},"destinations":{}}',
  revision uuid not null default gen_random_uuid(),
  lease_id uuid,
  lease_expires_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  next_sync_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(state) = 'object'),
  check (not enabled or (status = 'connected' and refresh_secret is not null))
);
create index google_calendar_sync_due_idx on public.google_calendar_connections(next_sync_at)
  where enabled and status = 'connected';
create table public.google_calendar_oauth_intents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state_sha256 text not null unique check (length(state_sha256) = 64),
  verifier jsonb not null,
  expires_at timestamptz not null
);
alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_connections force row level security;
alter table public.google_calendar_oauth_intents enable row level security;
alter table public.google_calendar_oauth_intents force row level security;
revoke all on public.google_calendar_connections from public, anon, authenticated;
revoke all on public.google_calendar_oauth_intents from public, anon, authenticated;
grant all on public.google_calendar_connections to service_role;
grant all on public.google_calendar_oauth_intents to service_role;
