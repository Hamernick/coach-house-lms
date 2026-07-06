set check_function_bodies = off;
set search_path = public;

alter table public.resource_map_sources
  drop constraint if exists resource_map_sources_source_type_check;
alter table public.resource_map_sources
  add constraint resource_map_sources_source_type_check
  check (source_type in ('manual', 'csv', 'api', 'directory', 'scrape', 'partner', 'seed'));

create table if not exists public.resource_map_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  source_id uuid references public.resource_map_sources(id) on delete set null,
  run_kind text not null default 'source_ingestion',
  connector_type text,
  status text not null default 'pending',
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  parsed_count integer not null default 0,
  normalized_count integer not null default 0,
  classified_count integer not null default 0,
  deduped_count integer not null default 0,
  flagged_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_ingestion_runs_run_id_key unique (run_id),
  constraint resource_map_ingestion_runs_status_check
    check (status in ('pending', 'running', 'completed', 'completed_with_errors', 'failed', 'skipped')),
  constraint resource_map_ingestion_runs_counts_check
    check (
      fetched_count >= 0
      and parsed_count >= 0
      and normalized_count >= 0
      and classified_count >= 0
      and deduped_count >= 0
      and flagged_count >= 0
    ),
  constraint resource_map_ingestion_runs_errors_check
    check (jsonb_typeof(errors) = 'array'),
  constraint resource_map_ingestion_runs_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists resource_map_ingestion_runs_source_started_idx
  on public.resource_map_ingestion_runs (source_id, started_at desc);
create index if not exists resource_map_ingestion_runs_status_started_idx
  on public.resource_map_ingestion_runs (status, started_at desc);
create index if not exists resource_map_ingestion_runs_connector_idx
  on public.resource_map_ingestion_runs (connector_type, started_at desc)
  where connector_type is not null;

create table if not exists public.resource_map_raw_ingestion_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.resource_map_sources(id) on delete cascade,
  run_id uuid references public.resource_map_ingestion_runs(id) on delete set null,
  import_batch_id uuid references public.resource_map_import_batches(id) on delete set null,
  raw_url text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  raw_text text,
  content_type text,
  checksum text not null,
  fetched_at timestamptz not null default timezone('utc', now()),
  parser_version text not null,
  connector_version text not null,
  fetch_status text not null default 'fetched',
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_raw_ingestion_records_url_check
    check (length(btrim(raw_url)) > 0),
  constraint resource_map_raw_ingestion_records_checksum_check
    check (checksum ~ '^[a-f0-9]{64}$'),
  constraint resource_map_raw_ingestion_records_payload_check
    check (jsonb_typeof(raw_payload) = 'object'),
  constraint resource_map_raw_ingestion_records_status_check
    check (fetch_status in ('pending', 'fetched', 'duplicate', 'not_modified', 'failed', 'skipped'))
);

create unique index if not exists resource_map_raw_ingestion_records_source_checksum_idx
  on public.resource_map_raw_ingestion_records (source_id, checksum);
create index if not exists resource_map_raw_ingestion_records_run_fetched_idx
  on public.resource_map_raw_ingestion_records (run_id, fetched_at desc)
  where run_id is not null;
create index if not exists resource_map_raw_ingestion_records_source_fetched_idx
  on public.resource_map_raw_ingestion_records (source_id, fetched_at desc);
create index if not exists resource_map_raw_ingestion_records_status_fetched_idx
  on public.resource_map_raw_ingestion_records (fetch_status, fetched_at desc);

alter table public.resource_map_import_records
  add column if not exists raw_ingestion_record_id uuid
  references public.resource_map_raw_ingestion_records(id)
  on delete set null;

alter table public.resource_map_import_records
  add column if not exists trust_score numeric(5,2),
  add column if not exists freshness_score numeric(5,2),
  add column if not exists quality_flags jsonb not null default '[]'::jsonb,
  add column if not exists reason_codes text[] not null default '{}'::text[],
  add column if not exists needs_review boolean not null default false;

create index if not exists resource_map_import_records_raw_ingestion_record_idx
  on public.resource_map_import_records (raw_ingestion_record_id)
  where raw_ingestion_record_id is not null;
create index if not exists resource_map_import_records_needs_review_idx
  on public.resource_map_import_records (needs_review, updated_at desc)
  where needs_review;
create index if not exists resource_map_import_records_quality_flags_gin_idx
  on public.resource_map_import_records using gin (quality_flags);

alter table public.resource_map_field_evidence
  add column if not exists evidence_type text not null default 'source',
  add column if not exists derived_from text[] not null default '{}'::text[],
  add column if not exists transformation text,
  add column if not exists evidence_metadata jsonb not null default '{}'::jsonb;

create index if not exists resource_map_field_evidence_type_idx
  on public.resource_map_field_evidence (evidence_type, observed_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_import_records_trust_score_check'
  ) then
    alter table public.resource_map_import_records
      add constraint resource_map_import_records_trust_score_check
      check (trust_score is null or trust_score between 0 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_import_records_freshness_score_check'
  ) then
    alter table public.resource_map_import_records
      add constraint resource_map_import_records_freshness_score_check
      check (freshness_score is null or freshness_score between 0 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_import_records_quality_flags_check'
  ) then
    alter table public.resource_map_import_records
      add constraint resource_map_import_records_quality_flags_check
      check (jsonb_typeof(quality_flags) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_field_evidence_type_check'
  ) then
    alter table public.resource_map_field_evidence
      add constraint resource_map_field_evidence_type_check
      check (length(btrim(evidence_type)) > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_field_evidence_metadata_check'
  ) then
    alter table public.resource_map_field_evidence
      add constraint resource_map_field_evidence_metadata_check
      check (jsonb_typeof(evidence_metadata) = 'object');
  end if;
end $$;

alter table public.resource_map_ingestion_runs enable row level security;
alter table public.resource_map_ingestion_runs force row level security;
alter table public.resource_map_raw_ingestion_records enable row level security;
alter table public.resource_map_raw_ingestion_records force row level security;

drop policy if exists "resource_map_ingestion_runs_admin_manage"
  on public.resource_map_ingestion_runs;
create policy "resource_map_ingestion_runs_admin_manage"
  on public.resource_map_ingestion_runs
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_raw_ingestion_records_admin_manage"
  on public.resource_map_raw_ingestion_records;
create policy "resource_map_raw_ingestion_records_admin_manage"
  on public.resource_map_raw_ingestion_records
  for all
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
