set check_function_bodies = off;
set search_path = public;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fiscal-signing',
  'fiscal-signing',
  false,
  52428800,
  array['application/pdf', 'image/png']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.fiscal_sponsorship_documents
  add column if not exists storage_bucket text not null default 'project-assets',
  add column if not exists file_sha256 text,
  add column if not exists template_key text,
  add column if not exists template_version integer,
  add column if not exists template_sha256 text,
  add column if not exists field_values jsonb not null default '{}'::jsonb,
  add column if not exists field_values_sha256 text,
  add column if not exists confirmed_by uuid references public.profiles(id) on delete set null,
  add column if not exists confirmed_at timestamptz,
  add column if not exists locked_at timestamptz,
  add column if not exists revision bigint not null default 0;

alter table public.fiscal_sponsorship_signature_packets
  add column if not exists applicant_signer_id uuid references public.profiles(id) on delete set null,
  add column if not exists coach_signer_id uuid references public.profiles(id) on delete set null,
  add column if not exists applicant_signed_at timestamptz,
  add column if not exists coach_signed_at timestamptz,
  add column if not exists template_version text,
  add column if not exists source_document_sha256 text,
  add column if not exists current_document_sha256 text;

alter table public.fiscal_sponsorship_signature_packets
  add column if not exists revision bigint not null default 0,
  add column if not exists consent_version text,
  add column if not exists consent_sha256 text;

create index if not exists fiscal_sponsorship_signature_packets_applicant_signer_idx
  on public.fiscal_sponsorship_signature_packets (applicant_signer_id, status, created_at desc);

create index if not exists fiscal_sponsorship_signature_packets_coach_signer_idx
  on public.fiscal_sponsorship_signature_packets (coach_signer_id, status, created_at desc);

create table if not exists public.fiscal_sponsorship_signing_drafts (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.fiscal_sponsorship_signature_packets(id) on delete cascade,
  application_id uuid not null references public.fiscal_sponsorship_applications(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  signer_id uuid not null references public.profiles(id) on delete cascade,
  signer_role text not null check (signer_role in ('applicant', 'coach_house')),
  field_values jsonb not null default '{}'::jsonb,
  confirmed_fields text[] not null default '{}'::text[],
  signature_method text check (signature_method in ('typed', 'drawn')),
  signature_value text,
  signer_title text check (signer_title is null or length(btrim(signer_title)) <= 120),
  document_sha256 text,
  revision bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fiscal_sponsorship_signing_drafts_packet_role_key
    unique (packet_id, signer_role)
);

create index if not exists fiscal_sponsorship_signing_drafts_signer_idx
  on public.fiscal_sponsorship_signing_drafts (signer_id, updated_at desc);

create index if not exists fiscal_sponsorship_signing_drafts_application_idx
  on public.fiscal_sponsorship_signing_drafts (application_id, updated_at desc);

drop trigger if exists set_updated_at_fiscal_sponsorship_signing_drafts
  on public.fiscal_sponsorship_signing_drafts;

create trigger set_updated_at_fiscal_sponsorship_signing_drafts
before update on public.fiscal_sponsorship_signing_drafts
for each row execute procedure public.handle_updated_at();

create or replace function public.reject_fiscal_signing_evidence_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Fiscal signing evidence is immutable';
end;
$$;

create table if not exists public.fiscal_sponsorship_signatures (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.fiscal_sponsorship_signature_packets(id) on delete cascade,
  application_id uuid not null references public.fiscal_sponsorship_applications(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  signer_id uuid not null references public.profiles(id) on delete restrict,
  signer_role text not null check (signer_role in ('applicant', 'coach_house')),
  signer_name text not null,
  signer_email text,
  signer_title text not null check (length(btrim(signer_title)) between 2 and 120),
  signature_method text not null check (signature_method in ('typed', 'drawn')),
  signature_value text not null,
  consent_version text not null,
  consent_text text not null,
  consent_sha256 text not null,
  signed_document_sha256 text not null,
  signature_sha256 text not null,
  signed_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fiscal_sponsorship_signatures_packet_role_key
    unique (packet_id, signer_role)
);

create index if not exists fiscal_sponsorship_signatures_signer_idx
  on public.fiscal_sponsorship_signatures (signer_id, signed_at desc);

create index if not exists fiscal_sponsorship_signatures_application_idx
  on public.fiscal_sponsorship_signatures (application_id, signed_at desc);

alter table public.fiscal_sponsorship_documents
  add constraint fiscal_sponsorship_documents_native_storage_bucket_check
    check (storage_bucket in ('project-assets', 'fiscal-signing')),
  add constraint fiscal_sponsorship_documents_native_template_version_check
    check (template_version is null or template_version > 0),
  add constraint fiscal_sponsorship_documents_native_revision_check
    check (revision >= 0),
  add constraint fiscal_sponsorship_documents_native_hashes_check
    check (
      (file_sha256 is null or file_sha256 ~ '^[a-f0-9]{64}$')
      and (template_sha256 is null or template_sha256 ~ '^[a-f0-9]{64}$')
      and (field_values_sha256 is null or field_values_sha256 ~ '^[a-f0-9]{64}$')
    );

alter table public.fiscal_sponsorship_signature_packets
  add constraint fiscal_sponsorship_signature_packets_native_revision_check
    check (revision >= 0),
  add constraint fiscal_sponsorship_signature_packets_native_hashes_check
    check (
      (source_document_sha256 is null or source_document_sha256 ~ '^[a-f0-9]{64}$')
      and (current_document_sha256 is null or current_document_sha256 ~ '^[a-f0-9]{64}$')
      and (consent_sha256 is null or consent_sha256 ~ '^[a-f0-9]{64}$')
    );

alter table public.fiscal_sponsorship_signing_drafts
  add constraint fiscal_sponsorship_signing_drafts_revision_check
    check (revision >= 0),
  add constraint fiscal_sponsorship_signing_drafts_document_hash_check
    check (document_sha256 is null or document_sha256 ~ '^[a-f0-9]{64}$');

alter table public.fiscal_sponsorship_signatures
  add constraint fiscal_sponsorship_signatures_hashes_check
    check (
      consent_sha256 ~ '^[a-f0-9]{64}$'
      and signed_document_sha256 ~ '^[a-f0-9]{64}$'
      and signature_sha256 ~ '^[a-f0-9]{64}$'
    );

drop trigger if exists reject_fiscal_sponsorship_signatures_mutation
  on public.fiscal_sponsorship_signatures;

create trigger reject_fiscal_sponsorship_signatures_mutation
before update or delete on public.fiscal_sponsorship_signatures
for each row execute function public.reject_fiscal_signing_evidence_mutation();

drop trigger if exists reject_fiscal_sponsorship_events_mutation
  on public.fiscal_sponsorship_events;

create trigger reject_fiscal_sponsorship_events_mutation
before update or delete on public.fiscal_sponsorship_events
for each row execute function public.reject_fiscal_signing_evidence_mutation();

alter table public.fiscal_sponsorship_signing_drafts enable row level security;
alter table public.fiscal_sponsorship_signing_drafts force row level security;
alter table public.fiscal_sponsorship_signatures enable row level security;
alter table public.fiscal_sponsorship_signatures force row level security;

drop policy if exists "fiscal_sponsorship_signing_drafts_select" on public.fiscal_sponsorship_signing_drafts;
drop policy if exists "fiscal_sponsorship_signing_drafts_insert" on public.fiscal_sponsorship_signing_drafts;
drop policy if exists "fiscal_sponsorship_signing_drafts_update" on public.fiscal_sponsorship_signing_drafts;
drop policy if exists "fiscal_sponsorship_signing_drafts_delete" on public.fiscal_sponsorship_signing_drafts;
drop policy if exists "fiscal_sponsorship_signatures_select" on public.fiscal_sponsorship_signatures;

create policy "fiscal_sponsorship_signing_drafts_select"
on public.fiscal_sponsorship_signing_drafts
for select
to authenticated
using (signer_id = (select auth.uid()) or public.is_admin());

create policy "fiscal_sponsorship_signing_drafts_insert"
on public.fiscal_sponsorship_signing_drafts
for insert
to authenticated
with check (
  public.is_admin()
  or (
    signer_id = (select auth.uid())
    and signer_role = 'applicant'
    and exists (
      select 1
      from public.fiscal_sponsorship_signature_packets packet
      where packet.id = fiscal_sponsorship_signing_drafts.packet_id
        and packet.applicant_signer_id = (select auth.uid())
        and packet.status = 'sent'
        and packet.application_id = fiscal_sponsorship_signing_drafts.application_id
        and packet.org_id = fiscal_sponsorship_signing_drafts.org_id
        and packet.project_id = fiscal_sponsorship_signing_drafts.project_id
    )
  )
);

create policy "fiscal_sponsorship_signing_drafts_update"
on public.fiscal_sponsorship_signing_drafts
for update
to authenticated
using (signer_id = (select auth.uid()) or public.is_admin())
with check (
  public.is_admin()
  or (
    signer_id = (select auth.uid())
    and signer_role = 'applicant'
    and exists (
      select 1
      from public.fiscal_sponsorship_signature_packets packet
      where packet.id = fiscal_sponsorship_signing_drafts.packet_id
        and packet.applicant_signer_id = (select auth.uid())
        and packet.status = 'sent'
    )
  )
);

create policy "fiscal_sponsorship_signing_drafts_delete"
on public.fiscal_sponsorship_signing_drafts
for delete
to authenticated
using (signer_id = (select auth.uid()) or public.is_admin());

create policy "fiscal_sponsorship_signatures_select"
on public.fiscal_sponsorship_signatures
for select
to authenticated
using (
  public.is_admin()
  or signer_id = (select auth.uid())
);

comment on table public.fiscal_sponsorship_signing_drafts is
  'Editable, non-authoritative Form B autosave state for the assigned signer.';

comment on table public.fiscal_sponsorship_signatures is
  'Immutable native Form B signature evidence; authoritative writes occur only in server actions.';

create or replace function public.finalize_fiscal_sponsorship_applicant_signature(
  p_packet_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_packet public.fiscal_sponsorship_signature_packets%rowtype;
  v_partial_document_id uuid;
  v_signature_id uuid;
  v_version integer;
begin
  select *
  into v_packet
  from public.fiscal_sponsorship_signature_packets
  where id = p_packet_id
  for update;

  if not found or v_packet.provider <> 'native' then
    raise exception 'Native fiscal sponsorship signature packet not found';
  end if;
  if v_packet.status <> 'sent' then
    raise exception 'Applicant signature step is no longer available';
  end if;
  if v_packet.applicant_signer_id is distinct from (p_payload ->> 'signerId')::uuid then
    raise exception 'Applicant signer assignment does not match';
  end if;
  if coalesce((
    select revision
    from public.fiscal_sponsorship_signing_drafts
    where packet_id = p_packet_id and signer_role = 'applicant'
  ), 0) <> (p_payload ->> 'expectedRevision')::bigint then
    raise exception 'Applicant signing draft changed in another session';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_packet.application_id::text, 0)
  );

  select coalesce(max(version), 0) + 1
  into v_version
  from public.fiscal_sponsorship_documents
  where application_id = v_packet.application_id
    and kind = 'agreement';

  insert into public.fiscal_sponsorship_documents (
    application_id, field_values, field_values_sha256, file_sha256,
    generated_at, generated_by, kind, locked_at, metadata, mime,
    org_id, project_id, size_bytes, source_snapshot, status, storage_bucket,
    storage_path, template_key, template_sha256, template_version, title, version
  ) values (
    v_packet.application_id, p_payload -> 'fields', p_payload ->> 'fieldValuesSha256',
    p_payload ->> 'partialDocumentSha256', (p_payload ->> 'signedAt')::timestamptz,
    (p_payload ->> 'signerId')::uuid, 'agreement',
    (p_payload ->> 'signedAt')::timestamptz,
    jsonb_build_object('packetId', p_packet_id, 'storageBucket', 'fiscal-signing'),
    'application/pdf', v_packet.org_id, v_packet.project_id,
    (p_payload ->> 'partialSizeBytes')::bigint, jsonb_build_object('packetId', p_packet_id),
    'partially_signed', 'fiscal-signing', p_payload ->> 'partialStoragePath',
    p_payload ->> 'templateKey', p_payload ->> 'templateSha256',
    (p_payload ->> 'templateVersion')::integer,
    'Form B Fiscal Sponsorship Agreement - Applicant Signed', v_version
  ) returning id into v_partial_document_id;

  insert into public.fiscal_sponsorship_signatures (
    application_id, consent_sha256, consent_text, consent_version, metadata,
    org_id, packet_id, project_id, signature_method, signature_sha256,
    signature_value, signed_at, signed_document_sha256, signer_email,
    signer_id, signer_name, signer_role, signer_title
  ) values (
    v_packet.application_id, p_payload ->> 'consentSha256',
    p_payload ->> 'consentText', p_payload ->> 'consentVersion',
    jsonb_build_object('userAgent', p_payload ->> 'userAgent'), v_packet.org_id,
    p_packet_id, v_packet.project_id, p_payload ->> 'signatureMethod',
    p_payload ->> 'signatureSha256', p_payload ->> 'signatureValue',
    (p_payload ->> 'signedAt')::timestamptz, p_payload ->> 'signedDocumentSha256',
    nullif(p_payload ->> 'signerEmail', ''), (p_payload ->> 'signerId')::uuid,
    p_payload ->> 'signerName', 'applicant', p_payload ->> 'signerTitle'
  ) returning id into v_signature_id;

  update public.fiscal_sponsorship_signature_packets
  set
    applicant_signed_at = (p_payload ->> 'signedAt')::timestamptz,
    consent_sha256 = p_payload ->> 'consentSha256',
    consent_version = p_payload ->> 'consentVersion',
    current_document_sha256 = p_payload ->> 'partialDocumentSha256',
    revision = revision + 1,
    status = 'applicant_signed'
  where id = p_packet_id;

  update public.fiscal_sponsorship_documents
  set
    confirmed_at = (p_payload ->> 'signedAt')::timestamptz,
    confirmed_by = (p_payload ->> 'signerId')::uuid,
    field_values = p_payload -> 'fields',
    field_values_sha256 = p_payload ->> 'fieldValuesSha256',
    locked_at = (p_payload ->> 'signedAt')::timestamptz,
    status = 'partially_signed'
  where id = v_packet.document_id;

  update public.fiscal_sponsorship_applications
  set
    applicant_full_name = p_payload -> 'fields' ->> 'applicantFullName',
    mailing_city = p_payload -> 'fields' ->> 'mailingCity',
    mailing_postal_code = p_payload -> 'fields' ->> 'mailingPostalCode',
    mailing_state = p_payload -> 'fields' ->> 'mailingState',
    mailing_street_address = p_payload -> 'fields' ->> 'mailingStreetAddress',
    mailing_street_address_2 = nullif(p_payload -> 'fields' ->> 'mailingStreetAddress2', ''),
    phone_number = p_payload -> 'fields' ->> 'phoneNumber',
    primary_email = p_payload -> 'fields' ->> 'primaryEmail',
    project_name = p_payload -> 'fields' ->> 'projectName',
    status = 'signed',
    updated_by = (p_payload ->> 'signerId')::uuid
  where id = v_packet.application_id;

  insert into public.fiscal_sponsorship_events (
    actor_id, application_id, event_type, metadata, org_id, project_id, summary
  ) values (
    (p_payload ->> 'signerId')::uuid, v_packet.application_id,
    'applicant_signed',
    jsonb_build_object(
      'documentSha256', p_payload ->> 'signedDocumentSha256',
      'partialDocumentId', v_partial_document_id,
      'partialDocumentSha256', p_payload ->> 'partialDocumentSha256',
      'signatureSha256', p_payload ->> 'signatureSha256'
    ),
    v_packet.org_id, v_packet.project_id,
    'Applicant signed the Form B fiscal sponsorship agreement.'
  );

  return jsonb_build_object(
    'partialDocumentId', v_partial_document_id,
    'signatureId', v_signature_id,
    'status', 'applicant_signed'
  );
end;
$$;

create or replace function public.finalize_fiscal_sponsorship_coach_signature(
  p_packet_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_packet public.fiscal_sponsorship_signature_packets%rowtype;
  v_executed_document_id uuid;
  v_audit_document_id uuid;
  v_signature_id uuid;
  v_version integer;
begin
  select *
  into v_packet
  from public.fiscal_sponsorship_signature_packets
  where id = p_packet_id
  for update;

  if not found or v_packet.provider <> 'native' then
    raise exception 'Native fiscal sponsorship signature packet not found';
  end if;
  if v_packet.status <> 'applicant_signed' then
    raise exception 'Coach House signature step is no longer available';
  end if;
  if not exists (
    select 1
    from public.profiles
    where id = (p_payload ->> 'signerId')::uuid
      and role = 'admin'
  ) then
    raise exception 'Coach House signer must be a platform administrator';
  end if;
  if not exists (
    select 1
    from public.fiscal_sponsorship_signatures
    where packet_id = p_packet_id
      and signer_role = 'applicant'
  ) then
    raise exception 'Applicant signature evidence is missing';
  end if;
  if coalesce((
    select revision
    from public.fiscal_sponsorship_signing_drafts
    where packet_id = p_packet_id and signer_role = 'coach_house'
  ), 0) <> (p_payload ->> 'expectedRevision')::bigint then
    raise exception 'Coach House signing draft changed in another session';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_packet.application_id::text, 0)
  );

  select coalesce(max(version), 0) + 1
  into v_version
  from public.fiscal_sponsorship_documents
  where application_id = v_packet.application_id
    and kind = 'executed_agreement';

  insert into public.fiscal_sponsorship_documents (
    application_id, field_values, field_values_sha256, file_sha256,
    generated_at, generated_by, kind, locked_at, metadata, mime,
    org_id, project_id, size_bytes, source_snapshot, status, storage_bucket,
    storage_path, template_key, template_sha256, template_version, title, version
  ) values (
    v_packet.application_id, p_payload -> 'fields', p_payload ->> 'fieldValuesSha256',
    p_payload ->> 'executedDocumentSha256', (p_payload ->> 'signedAt')::timestamptz,
    (p_payload ->> 'signerId')::uuid, 'executed_agreement',
    (p_payload ->> 'signedAt')::timestamptz,
    jsonb_build_object('packetId', p_packet_id, 'storageBucket', 'fiscal-signing'),
    'application/pdf', v_packet.org_id, v_packet.project_id,
    (p_payload ->> 'executedSizeBytes')::bigint, jsonb_build_object('packetId', p_packet_id),
    'executed', 'fiscal-signing', p_payload ->> 'executedStoragePath',
    p_payload ->> 'templateKey', p_payload ->> 'templateSha256',
    (p_payload ->> 'templateVersion')::integer,
    'Executed Form B Fiscal Sponsorship Agreement', v_version
  ) returning id into v_executed_document_id;

  select coalesce(max(version), 0) + 1
  into v_version
  from public.fiscal_sponsorship_documents
  where application_id = v_packet.application_id
    and kind = 'audit_certificate';

  insert into public.fiscal_sponsorship_documents (
    application_id, field_values, field_values_sha256, file_sha256,
    generated_at, generated_by, kind, locked_at, metadata, mime,
    org_id, project_id, size_bytes, source_snapshot, status, storage_bucket,
    storage_path, template_key, template_sha256, template_version, title, version
  ) values (
    v_packet.application_id, p_payload -> 'fields', p_payload ->> 'fieldValuesSha256',
    p_payload ->> 'auditDocumentSha256', (p_payload ->> 'signedAt')::timestamptz,
    (p_payload ->> 'signerId')::uuid, 'audit_certificate',
    (p_payload ->> 'signedAt')::timestamptz,
    jsonb_build_object('packetId', p_packet_id, 'storageBucket', 'fiscal-signing'),
    'application/pdf', v_packet.org_id, v_packet.project_id,
    (p_payload ->> 'auditSizeBytes')::bigint, jsonb_build_object('packetId', p_packet_id),
    'executed', 'fiscal-signing', p_payload ->> 'auditStoragePath',
    p_payload ->> 'templateKey', p_payload ->> 'templateSha256',
    (p_payload ->> 'templateVersion')::integer,
    'Form B Execution Certificate', v_version
  ) returning id into v_audit_document_id;

  insert into public.fiscal_sponsorship_signatures (
    application_id, consent_sha256, consent_text, consent_version, metadata,
    org_id, packet_id, project_id, signature_method, signature_sha256,
    signature_value, signed_at, signed_document_sha256, signer_email,
    signer_id, signer_name, signer_role, signer_title
  ) values (
    v_packet.application_id, p_payload ->> 'consentSha256',
    p_payload ->> 'consentText', p_payload ->> 'consentVersion',
    jsonb_build_object('userAgent', p_payload ->> 'userAgent'), v_packet.org_id,
    p_packet_id, v_packet.project_id, p_payload ->> 'signatureMethod',
    p_payload ->> 'signatureSha256', p_payload ->> 'signatureValue',
    (p_payload ->> 'signedAt')::timestamptz, p_payload ->> 'signedDocumentSha256',
    nullif(p_payload ->> 'signerEmail', ''), (p_payload ->> 'signerId')::uuid,
    p_payload ->> 'signerName', 'coach_house', p_payload ->> 'signerTitle'
  ) returning id into v_signature_id;

  update public.fiscal_sponsorship_signature_packets
  set
    audit_document_id = v_audit_document_id,
    coach_signed_at = (p_payload ->> 'signedAt')::timestamptz,
    coach_signer_email = nullif(p_payload ->> 'signerEmail', ''),
    coach_signer_id = (p_payload ->> 'signerId')::uuid,
    coach_signer_name = p_payload ->> 'signerName',
    completed_at = (p_payload ->> 'signedAt')::timestamptz,
    current_document_sha256 = p_payload ->> 'executedDocumentSha256',
    executed_document_id = v_executed_document_id,
    revision = revision + 1,
    status = 'completed'
  where id = p_packet_id;

  update public.fiscal_sponsorship_applications
  set status = 'countersigned', updated_by = (p_payload ->> 'signerId')::uuid
  where id = v_packet.application_id;

  insert into public.fiscal_sponsorship_events (
    actor_id, application_id, event_type, metadata, org_id, project_id, summary
  ) values (
    (p_payload ->> 'signerId')::uuid, v_packet.application_id,
    'agreement_completed',
    jsonb_build_object(
      'auditDocumentId', v_audit_document_id,
      'auditSha256', p_payload ->> 'auditDocumentSha256',
      'executedDocumentId', v_executed_document_id,
      'executedDocumentSha256', p_payload ->> 'executedDocumentSha256',
      'signatureSha256', p_payload ->> 'signatureSha256'
    ),
    v_packet.org_id, v_packet.project_id,
    'Coach House countersigned and completed the Form B agreement.'
  );

  return jsonb_build_object(
    'auditDocumentId', v_audit_document_id,
    'executedDocumentId', v_executed_document_id,
    'signatureId', v_signature_id,
    'status', 'completed'
  );
end;
$$;

revoke all on function public.reject_fiscal_signing_evidence_mutation() from public;
revoke all on function public.finalize_fiscal_sponsorship_applicant_signature(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.finalize_fiscal_sponsorship_coach_signature(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_fiscal_sponsorship_applicant_signature(uuid, jsonb) to service_role;
grant execute on function public.finalize_fiscal_sponsorship_coach_signature(uuid, jsonb) to service_role;
