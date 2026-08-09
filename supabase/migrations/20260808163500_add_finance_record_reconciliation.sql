set check_function_bodies = off;
set search_path = public;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'finance-evidence',
  'finance-evidence',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create unique index if not exists organization_finance_records_id_org_idx
  on public.organization_finance_records (id, org_id);

create table if not exists public.organization_finance_record_evidence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete restrict,
  record_id uuid not null,
  external_reference text not null,
  storage_bucket text not null default 'finance-evidence',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  file_sha256 text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_record_evidence_record_key unique (record_id),
  constraint organization_finance_record_evidence_record_org_fkey
    foreign key (record_id, org_id)
    references public.organization_finance_records(id, org_id)
    on delete restrict,
  constraint organization_finance_record_evidence_reference_check
    check (char_length(btrim(external_reference)) between 1 and 160),
  constraint organization_finance_record_evidence_bucket_check
    check (storage_bucket = 'finance-evidence'),
  constraint organization_finance_record_evidence_path_check
    check (char_length(btrim(storage_path)) between 1 and 512),
  constraint organization_finance_record_evidence_file_name_check
    check (char_length(btrim(file_name)) between 1 and 180),
  constraint organization_finance_record_evidence_mime_check
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  constraint organization_finance_record_evidence_size_check
    check (size_bytes between 1 and 10485760),
  constraint organization_finance_record_evidence_hash_check
    check (file_sha256 ~ '^[a-f0-9]{64}$')
);

create index if not exists organization_finance_record_evidence_org_created_idx
  on public.organization_finance_record_evidence (org_id, created_at desc);

create table if not exists public.organization_finance_record_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete restrict,
  record_id uuid not null,
  event_type text not null,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_record_events_record_org_fkey
    foreign key (record_id, org_id)
    references public.organization_finance_records(id, org_id)
    on delete restrict,
  constraint organization_finance_record_events_type_check
    check (event_type in ('reconciled')),
  constraint organization_finance_record_events_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists organization_finance_record_events_record_occurred_idx
  on public.organization_finance_record_events (record_id, occurred_at desc);

create or replace function public.reject_finance_record_evidence_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Finance record evidence is immutable';
end;
$$;

create or replace function public.protect_reconciled_finance_record_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'reconciled' and (
    new.org_id is distinct from old.org_id
    or new.effective_at is distinct from old.effective_at
    or new.record_type is distinct from old.record_type
    or new.direction is distinct from old.direction
    or new.source_kind is distinct from old.source_kind
    or new.source_label is distinct from old.source_label
    or new.amount_cents is distinct from old.amount_cents
    or new.currency_code is distinct from old.currency_code
    or new.status is distinct from old.status
    or new.external_provider is distinct from old.external_provider
    or new.external_record_id is distinct from old.external_record_id
    or new.created_source is distinct from old.created_source
    or new.created_by is distinct from old.created_by
    or new.reconciled_at is distinct from old.reconciled_at
  ) then
    raise exception 'Reconciled Finance record fields are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_reconciled_finance_record_fields
  on public.organization_finance_records;
create trigger protect_reconciled_finance_record_fields
before update on public.organization_finance_records
for each row execute function public.protect_reconciled_finance_record_fields();

drop trigger if exists reject_organization_finance_record_evidence_mutation
  on public.organization_finance_record_evidence;
create trigger reject_organization_finance_record_evidence_mutation
before update or delete on public.organization_finance_record_evidence
for each row execute function public.reject_finance_record_evidence_mutation();

drop trigger if exists reject_organization_finance_record_events_mutation
  on public.organization_finance_record_events;
create trigger reject_organization_finance_record_events_mutation
before update or delete on public.organization_finance_record_events
for each row execute function public.reject_finance_record_evidence_mutation();

alter table public.organization_finance_record_evidence enable row level security;
alter table public.organization_finance_record_evidence force row level security;
alter table public.organization_finance_record_events enable row level security;
alter table public.organization_finance_record_events force row level security;

drop policy if exists "organization_finance_record_evidence_select"
  on public.organization_finance_record_evidence;
create policy "organization_finance_record_evidence_select"
  on public.organization_finance_record_evidence
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

drop policy if exists "organization_finance_record_events_select"
  on public.organization_finance_record_events;
create policy "organization_finance_record_events_select"
  on public.organization_finance_record_events
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

revoke all on table public.organization_finance_record_evidence from anon, authenticated;
revoke all on table public.organization_finance_record_events from anon, authenticated;
grant select on table public.organization_finance_record_evidence to authenticated;
grant select on table public.organization_finance_record_events to authenticated;

create or replace function public.reconcile_organization_finance_record(
  p_actor_id uuid,
  p_org_id uuid,
  p_record_id uuid,
  p_external_reference text,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint,
  p_file_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_evidence_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_record public.organization_finance_records%rowtype;
begin
  select *
  into v_record
  from public.organization_finance_records
  where id = p_record_id
    and org_id = p_org_id
  for update;

  if not found then
    raise exception 'Finance record not found';
  end if;
  if v_record.status <> 'recorded' then
    raise exception 'Finance record is not available for reconciliation';
  end if;

  insert into public.organization_finance_record_evidence (
    org_id,
    record_id,
    external_reference,
    storage_path,
    file_name,
    mime_type,
    size_bytes,
    file_sha256,
    created_by,
    created_at
  ) values (
    p_org_id,
    p_record_id,
    btrim(p_external_reference),
    p_storage_path,
    p_file_name,
    p_mime_type,
    p_size_bytes,
    p_file_sha256,
    p_actor_id,
    v_now
  )
  returning id into v_evidence_id;

  update public.organization_finance_records
  set
    status = 'reconciled',
    reconciled_at = v_now
  where id = p_record_id
    and org_id = p_org_id;

  insert into public.organization_finance_record_events (
    org_id,
    record_id,
    event_type,
    actor_id,
    metadata,
    occurred_at
  ) values (
    p_org_id,
    p_record_id,
    'reconciled',
    p_actor_id,
    jsonb_build_object('evidenceId', v_evidence_id),
    v_now
  );

  return jsonb_build_object(
    'evidenceId', v_evidence_id,
    'reconciledAt', v_now
  );
end;
$$;

revoke all on function public.reconcile_organization_finance_record(
  uuid, uuid, uuid, text, text, text, text, bigint, text
) from public, anon, authenticated;
grant execute on function public.reconcile_organization_finance_record(
  uuid, uuid, uuid, text, text, text, text, bigint, text
) to service_role;

comment on table public.organization_finance_record_evidence is
  'Private immutable evidence for an externally executed Finance record reconciliation.';
comment on table public.organization_finance_record_events is
  'Immutable audit events for Finance record state transitions.';
