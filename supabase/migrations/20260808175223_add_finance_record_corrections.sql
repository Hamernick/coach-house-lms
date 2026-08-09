set check_function_bodies = off;
set search_path = public;

create unique index if not exists organization_finance_record_evidence_id_org_idx
  on public.organization_finance_record_evidence (id, org_id);

create table if not exists public.organization_finance_record_corrections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete restrict,
  original_record_id uuid not null,
  replacement_record_id uuid not null,
  evidence_id uuid not null,
  reason text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_record_corrections_original_key
    unique (original_record_id),
  constraint organization_finance_record_corrections_replacement_key
    unique (replacement_record_id),
  constraint organization_finance_record_corrections_evidence_key
    unique (evidence_id),
  constraint organization_finance_record_corrections_distinct_records_check
    check (original_record_id <> replacement_record_id),
  constraint organization_finance_record_corrections_reason_check
    check (char_length(btrim(reason)) between 1 and 300),
  constraint organization_finance_record_corrections_original_org_fkey
    foreign key (original_record_id, org_id)
    references public.organization_finance_records(id, org_id)
    on delete restrict,
  constraint organization_finance_record_corrections_replacement_org_fkey
    foreign key (replacement_record_id, org_id)
    references public.organization_finance_records(id, org_id)
    on delete restrict,
  constraint organization_finance_record_corrections_evidence_org_fkey
    foreign key (evidence_id, org_id)
    references public.organization_finance_record_evidence(id, org_id)
    on delete restrict
);

create index if not exists organization_finance_record_corrections_org_created_idx
  on public.organization_finance_record_corrections (org_id, created_at desc);

alter table public.organization_finance_record_events
  drop constraint if exists organization_finance_record_events_type_check;
alter table public.organization_finance_record_events
  add constraint organization_finance_record_events_type_check
  check (event_type in ('reconciled', 'corrected'));

create or replace function public.protect_reconciled_finance_record_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'reconciled' and (
    new.org_id is distinct from old.org_id
    or new.program_id is distinct from old.program_id
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

create or replace function public.reject_finance_record_correction_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Finance record corrections are immutable';
end;
$$;

drop trigger if exists reject_organization_finance_record_corrections_mutation
  on public.organization_finance_record_corrections;
create trigger reject_organization_finance_record_corrections_mutation
before update or delete on public.organization_finance_record_corrections
for each row execute function public.reject_finance_record_correction_mutation();

revoke all on function public.reject_finance_record_correction_mutation()
  from public;

alter table public.organization_finance_record_corrections enable row level security;
alter table public.organization_finance_record_corrections force row level security;

drop policy if exists "organization_finance_record_corrections_select"
  on public.organization_finance_record_corrections;
create policy "organization_finance_record_corrections_select"
  on public.organization_finance_record_corrections
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

revoke all on table public.organization_finance_record_corrections
  from anon, authenticated;
grant select on table public.organization_finance_record_corrections
  to authenticated;

create or replace function public.correct_organization_finance_record(
  p_actor_id uuid,
  p_org_id uuid,
  p_original_record_id uuid,
  p_replacement_record_id uuid,
  p_program_id uuid,
  p_effective_at timestamptz,
  p_record_type text,
  p_direction text,
  p_source_kind text,
  p_source_label text,
  p_amount_cents bigint,
  p_currency_code text,
  p_reason text,
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
  v_correction_id uuid;
  v_evidence_id uuid;
  v_now timestamptz := timezone('utc', now());
  v_original public.organization_finance_records%rowtype;
begin
  if p_original_record_id = p_replacement_record_id then
    raise exception 'Replacement Finance record must be new';
  end if;
  if char_length(btrim(p_reason)) not between 1 and 300 then
    raise exception 'Correction reason is invalid';
  end if;

  select *
  into v_original
  from public.organization_finance_records
  where id = p_original_record_id
    and org_id = p_org_id
  for update;

  if not found then
    raise exception 'Finance record not found';
  end if;
  if v_original.status <> 'reconciled' then
    raise exception 'Finance record is not available for correction';
  end if;
  if exists (
    select 1
    from public.organization_finance_record_corrections correction
    where correction.original_record_id = p_original_record_id
  ) then
    raise exception 'Finance record is no longer available for correction';
  end if;

  insert into public.organization_finance_records (
    id,
    org_id,
    program_id,
    effective_at,
    record_type,
    direction,
    source_kind,
    source_label,
    amount_cents,
    currency_code,
    status,
    created_source,
    created_by,
    reconciled_at,
    created_at,
    updated_at
  ) values (
    p_replacement_record_id,
    p_org_id,
    p_program_id,
    p_effective_at,
    p_record_type,
    p_direction,
    p_source_kind,
    btrim(p_source_label),
    p_amount_cents,
    upper(p_currency_code),
    'reconciled',
    'system',
    p_actor_id,
    v_now,
    v_now,
    v_now
  );

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
    p_replacement_record_id,
    btrim(p_external_reference),
    p_storage_path,
    p_file_name,
    p_mime_type,
    p_size_bytes,
    p_file_sha256,
    p_actor_id,
    v_now
  ) returning id into v_evidence_id;

  insert into public.organization_finance_record_corrections (
    org_id,
    original_record_id,
    replacement_record_id,
    evidence_id,
    reason,
    created_by,
    created_at
  ) values (
    p_org_id,
    p_original_record_id,
    p_replacement_record_id,
    v_evidence_id,
    btrim(p_reason),
    p_actor_id,
    v_now
  ) returning id into v_correction_id;

  insert into public.organization_finance_record_events (
    org_id,
    record_id,
    event_type,
    actor_id,
    metadata,
    occurred_at
  ) values
  (
    p_org_id,
    p_original_record_id,
    'corrected',
    p_actor_id,
    jsonb_build_object(
      'correctionId', v_correction_id,
      'replacementRecordId', p_replacement_record_id
    ),
    v_now
  ),
  (
    p_org_id,
    p_replacement_record_id,
    'reconciled',
    p_actor_id,
    jsonb_build_object(
      'correctionId', v_correction_id,
      'evidenceId', v_evidence_id,
      'originalRecordId', p_original_record_id
    ),
    v_now
  );

  return jsonb_build_object(
    'correctionId', v_correction_id,
    'evidenceId', v_evidence_id,
    'replacementRecordId', p_replacement_record_id,
    'correctedAt', v_now
  );
end;
$$;

revoke all on function public.correct_organization_finance_record(
  uuid, uuid, uuid, uuid, uuid, timestamptz, text, text, text, text, bigint,
  text, text, text, text, text, text, bigint, text
) from public, anon, authenticated;
grant execute on function public.correct_organization_finance_record(
  uuid, uuid, uuid, uuid, uuid, timestamptz, text, text, text, text, bigint,
  text, text, text, text, text, text, bigint, text
) to service_role;

comment on table public.organization_finance_record_corrections is
  'Immutable links from a verified Finance record to its verified replacement.';
comment on function public.correct_organization_finance_record(
  uuid, uuid, uuid, uuid, uuid, timestamptz, text, text, text, text, bigint,
  text, text, text, text, text, text, bigint, text
) is 'Atomically preserves a verified Finance record and creates its verified replacement.';
