set check_function_bodies = off;
set search_path = public;

create table if not exists public.finance_opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_type text not null,
  name text not null,
  base_url text,
  allowed_domains text[] not null default '{}',
  auth_type text not null default 'none',
  trust_level text not null,
  refresh_cadence_minutes integer not null default 1440,
  enabled boolean not null default false,
  owner_user_id uuid references public.profiles(id) on delete set null,
  terms_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint finance_opportunity_sources_key_check
    check (source_key ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint finance_opportunity_sources_type_check
    check (
      source_type in (
        'api',
        'rss',
        'registered_url',
        'internal_table',
        'document_bucket',
        'manual_upload'
      )
    ),
  constraint finance_opportunity_sources_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint finance_opportunity_sources_url_check
    check (base_url is null or base_url ~ '^https://'),
  constraint finance_opportunity_sources_network_check
    check (
      source_type not in ('api', 'rss', 'registered_url')
      or (base_url is not null and cardinality(allowed_domains) between 1 and 10)
    ),
  constraint finance_opportunity_sources_auth_check
    check (auth_type in ('none', 'api_key', 'oauth', 'server_credentials')),
  constraint finance_opportunity_sources_trust_check
    check (
      trust_level in (
        'internal_verified',
        'partner_api',
        'public_api',
        'public_web',
        'user_uploaded'
      )
    ),
  constraint finance_opportunity_sources_cadence_check
    check (refresh_cadence_minutes between 15 and 525600),
  constraint finance_opportunity_sources_terms_check
    check (terms_notes is null or char_length(terms_notes) <= 2000)
);

create index if not exists finance_opportunity_sources_enabled_idx
  on public.finance_opportunity_sources (refresh_cadence_minutes, id)
  where enabled;

create index if not exists finance_opportunity_sources_owner_idx
  on public.finance_opportunity_sources (owner_user_id)
  where owner_user_id is not null;

insert into public.finance_opportunity_sources (
  source_key,
  source_type,
  name,
  base_url,
  allowed_domains,
  auth_type,
  trust_level,
  refresh_cadence_minutes,
  enabled,
  terms_notes
) values (
  'grants_gov',
  'api',
  'Grants.gov',
  'https://api.grants.gov',
  array['api.grants.gov'],
  'none',
  'public_api',
  1440,
  false,
  'Enable only after accepting https://www.grants.gov/api/terms-conditions and retaining the required non-endorsement notice in the product.'
)
on conflict (source_key) do nothing;

create table if not exists public.finance_opportunity_scan_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null
    references public.finance_opportunity_sources(id) on delete restrict,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  items_seen integer not null default 0,
  items_created integer not null default 0,
  items_updated integer not null default 0,
  items_matched integer not null default 0,
  error_code text,
  error_message text,
  retry_count integer not null default 0,
  trace_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint finance_opportunity_scan_runs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  constraint finance_opportunity_scan_runs_counts_check
    check (
      items_seen >= 0
      and items_created >= 0
      and items_updated >= 0
      and items_matched >= 0
      and retry_count >= 0
    ),
  constraint finance_opportunity_scan_runs_time_check
    check (finished_at is null or started_at is null or finished_at >= started_at),
  constraint finance_opportunity_scan_runs_error_check
    check (
      (status = 'failed' and error_code is not null)
      or (status <> 'failed' and error_code is null and error_message is null)
    ),
  constraint finance_opportunity_scan_runs_error_length_check
    check (
      (error_code is null or char_length(error_code) <= 80)
      and (error_message is null or char_length(error_message) <= 500)
    )
);

create index if not exists finance_opportunity_scan_runs_org_started_idx
  on public.finance_opportunity_scan_runs (org_id, started_at desc, id desc);

create index if not exists finance_opportunity_scan_runs_source_started_idx
  on public.finance_opportunity_scan_runs (source_id, started_at desc, id desc);

create index if not exists finance_opportunity_scan_runs_active_idx
  on public.finance_opportunity_scan_runs (source_id, org_id, created_at, id)
  where status in ('queued', 'running');

alter table public.organization_finance_opportunities
  add column if not exists source_id uuid
  references public.finance_opportunity_sources(id) on delete restrict;

create index if not exists organization_finance_opportunities_source_idx
  on public.organization_finance_opportunities (source_id, org_id, due_at)
  where source_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_finance_opportunity_sources'
  ) then
    create trigger set_updated_at_finance_opportunity_sources
      before update on public.finance_opportunity_sources
      for each row execute procedure public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_finance_opportunity_scan_runs'
  ) then
    create trigger set_updated_at_finance_opportunity_scan_runs
      before update on public.finance_opportunity_scan_runs
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table public.finance_opportunity_sources enable row level security;
alter table public.finance_opportunity_sources force row level security;
alter table public.finance_opportunity_scan_runs enable row level security;
alter table public.finance_opportunity_scan_runs force row level security;

revoke all on table public.finance_opportunity_sources from anon, authenticated;
revoke all on table public.finance_opportunity_scan_runs from anon, authenticated;
