set check_function_bodies = off;
set search_path = public;

alter table public.fiscal_sponsorship_documents
  drop constraint if exists fiscal_sponsorship_documents_kind_check;

alter table public.fiscal_sponsorship_documents
  add constraint fiscal_sponsorship_documents_kind_check
  check (
    kind in (
      'application',
      'agreement',
      'executed_agreement',
      'audit_certificate',
      'tax_form',
      'regrant'
    )
  );

drop policy if exists "fiscal_sponsorship_documents_select"
  on public.fiscal_sponsorship_documents;

create policy "fiscal_sponsorship_documents_select"
on public.fiscal_sponsorship_documents
for select
to authenticated
using (
  public.is_platform_staff()
  or org_id = (select auth.uid())
  or generated_by = (select auth.uid())
  or (
    coalesce(document_key, '') <> 'tax_id_confirmation'
    and exists (
      select 1
      from public.organization_memberships om
      where om.org_id = fiscal_sponsorship_documents.org_id
        and om.member_id = (select auth.uid())
    )
  )
  or (
    document_key = 'tax_id_confirmation'
    and exists (
      select 1
      from public.organization_memberships om
      where om.org_id = fiscal_sponsorship_documents.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('owner', 'admin', 'staff')
    )
  )
);

create or replace function public.reject_executed_fiscal_tax_form_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.kind <> 'tax_form' or old.status <> 'executed' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Executed fiscal tax forms are immutable';
  end if;

  if (
    to_jsonb(new)
      - 'review_status'
      - 'review_notes'
      - 'reviewed_at'
      - 'reviewed_by'
      - 'updated_at'
  ) is distinct from (
    to_jsonb(old)
      - 'review_status'
      - 'review_notes'
      - 'reviewed_at'
      - 'reviewed_by'
      - 'updated_at'
  ) then
    raise exception 'Executed fiscal tax form evidence is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists reject_executed_fiscal_tax_form_mutation
  on public.fiscal_sponsorship_documents;

create trigger reject_executed_fiscal_tax_form_mutation
before update or delete on public.fiscal_sponsorship_documents
for each row execute function public.reject_executed_fiscal_tax_form_mutation();

revoke all on function public.reject_executed_fiscal_tax_form_mutation()
  from public;

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
    from public.platform_staff_members staff
    where staff.user_id = (p_payload ->> 'signerId')::uuid
      and staff.access_level in ('developer', 'coach')
  ) and not exists (
    select 1
    from public.profiles profile
    where profile.id = (p_payload ->> 'signerId')::uuid
      and profile.role = 'admin'
  ) then
    raise exception 'Coach House signer must be authorized platform staff';
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

revoke all on function public.finalize_fiscal_sponsorship_coach_signature(
  uuid,
  jsonb
) from public, anon, authenticated;
grant execute on function public.finalize_fiscal_sponsorship_coach_signature(
  uuid,
  jsonb
) to service_role;
