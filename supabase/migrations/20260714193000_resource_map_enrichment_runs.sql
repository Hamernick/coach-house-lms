create table if not exists public.resource_map_enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  import_record_id uuid not null references public.resource_map_import_records(id) on delete cascade,
  pass_type text not null,
  pass_number integer not null default 1,
  status text not null default 'queued',
  provider text,
  model text,
  prompt_version text not null,
  input_sha256 text not null,
  output_sha256 text,
  source_urls text[] not null default '{}'::text[],
  structured_result jsonb not null default '{}'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  error_message text,
  attempt_count integer not null default 0,
  actor_id uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_enrichment_runs_pass_type_check
    check (pass_type in ('source_collection', 'draft', 'verification', 'human_review')),
  constraint resource_map_enrichment_runs_pass_number_check
    check (pass_number > 0),
  constraint resource_map_enrichment_runs_status_check
    check (status in ('queued', 'running', 'completed', 'failed', 'needs_review', 'rejected')),
  constraint resource_map_enrichment_runs_input_sha256_check
    check (input_sha256 ~ '^[a-f0-9]{64}$'),
  constraint resource_map_enrichment_runs_output_sha256_check
    check (output_sha256 is null or output_sha256 ~ '^[a-f0-9]{64}$'),
  constraint resource_map_enrichment_runs_source_urls_check
    check (array_position(source_urls, null) is null),
  constraint resource_map_enrichment_runs_structured_result_check
    check (jsonb_typeof(structured_result) = 'object'),
  constraint resource_map_enrichment_runs_issues_check
    check (jsonb_typeof(issues) = 'array'),
  constraint resource_map_enrichment_runs_attempt_count_check
    check (attempt_count >= 0),
  constraint resource_map_enrichment_runs_completion_check
    check (
      (status in ('completed', 'failed', 'needs_review', 'rejected') and completed_at is not null)
      or (status in ('queued', 'running') and completed_at is null)
    ),
  constraint resource_map_enrichment_runs_idempotency_key
    unique (import_record_id, pass_type, pass_number, input_sha256, prompt_version)
);

create index if not exists resource_map_enrichment_runs_import_idx
  on public.resource_map_enrichment_runs (import_record_id, pass_number, created_at desc);
create index if not exists resource_map_enrichment_runs_queue_idx
  on public.resource_map_enrichment_runs (status, created_at, id)
  where status in ('queued', 'running', 'needs_review');
create index if not exists resource_map_enrichment_runs_source_urls_idx
  on public.resource_map_enrichment_runs using gin (source_urls);

drop trigger if exists set_updated_at_resource_map_enrichment_runs
  on public.resource_map_enrichment_runs;
create trigger set_updated_at_resource_map_enrichment_runs
  before update on public.resource_map_enrichment_runs
  for each row execute procedure public.handle_updated_at();

alter table public.resource_map_enrichment_runs enable row level security;
alter table public.resource_map_enrichment_runs force row level security;

drop policy if exists "resource_map_enrichment_runs_admin_manage"
  on public.resource_map_enrichment_runs;
create policy "resource_map_enrichment_runs_admin_manage"
  on public.resource_map_enrichment_runs
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.resource_map_enrichment_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.resource_map_enrichment_runs to authenticated;

comment on table public.resource_map_enrichment_runs is
  'Private, admin-only ledger for source collection, AI drafting, independent verification, and human review passes.';
