set check_function_bodies = off;
set search_path = public;

create or replace function public.send_fiscal_sponsorship_form_b_transition(
  p_application_id uuid,
  p_document_id uuid,
  p_actor_id uuid,
  p_expected_application_updated_at timestamptz,
  p_expected_document_updated_at timestamptz,
  p_applicant_signer_id uuid,
  p_applicant_signer_name text,
  p_applicant_signer_email text,
  p_fields jsonb,
  p_template_key text,
  p_template_version integer,
  p_template_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_application public.fiscal_sponsorship_applications%rowtype;
  v_document public.fiscal_sponsorship_documents%rowtype;
  v_existing_packet public.fiscal_sponsorship_signature_packets%rowtype;
  v_packet_id uuid;
  v_sent_at timestamptz := now();
begin
  if p_actor_id is null or p_applicant_signer_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if nullif(btrim(coalesce(p_applicant_signer_name, '')), '') is null
    or nullif(btrim(coalesce(p_applicant_signer_email, '')), '') is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_signer');
  end if;

  if p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_document');
  end if;

  select *
  into v_application
  from public.fiscal_sponsorship_applications
  where id = p_application_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if p_expected_application_updated_at is null
    or v_application.updated_at is distinct from
      p_expected_application_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale_application');
  end if;

  if v_application.status <> 'agreement_ready' then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'status', v_application.status
    );
  end if;

  select *
  into v_document
  from public.fiscal_sponsorship_documents
  where id = p_document_id
    and application_id = v_application.id
    and org_id = v_application.org_id
    and project_id = v_application.project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'document_not_found');
  end if;

  select *
  into v_existing_packet
  from public.fiscal_sponsorship_signature_packets
  where application_id = v_application.id
  order by created_at desc
  limit 1
  for update;

  if found then
    if v_existing_packet.document_id = v_document.id
      and v_existing_packet.provider = 'native'
      and v_existing_packet.status = 'sent'
      and v_existing_packet.applicant_signer_id = p_applicant_signer_id
      and v_existing_packet.applicant_signer_email =
        btrim(p_applicant_signer_email)
      and v_document.status = 'sent_for_signature' then
      return jsonb_build_object(
        'ok', true,
        'applicationId', v_application.id,
        'documentId', v_document.id,
        'packetId', v_existing_packet.id,
        'transitioned', false
      );
    end if;

    return jsonb_build_object('ok', false, 'code', 'existing_packet');
  end if;

  if p_expected_document_updated_at is null
    or v_document.updated_at is distinct from p_expected_document_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale_document');
  end if;

  if v_document.kind <> 'agreement'
    or v_document.status <> 'generated'
    or v_document.storage_bucket <> 'fiscal-signing'
    or nullif(btrim(coalesce(v_document.storage_path, '')), '') is null
    or nullif(btrim(coalesce(v_document.file_sha256, '')), '') is null
    or v_document.template_key is distinct from p_template_key
    or v_document.template_version is distinct from p_template_version
    or v_document.template_sha256 is distinct from p_template_sha256
    or coalesce(v_document.field_values, '{}'::jsonb) is distinct from p_fields then
    return jsonb_build_object('ok', false, 'code', 'invalid_document');
  end if;

  insert into public.fiscal_sponsorship_signature_packets (
    applicant_signer_email,
    applicant_signer_id,
    applicant_signer_name,
    application_id,
    coach_signer_email,
    coach_signer_name,
    current_document_sha256,
    document_id,
    org_id,
    project_id,
    provider,
    provider_payload,
    provider_submission_id,
    provider_template_id,
    sent_at,
    sent_by,
    source_document_sha256,
    status,
    template_version
  ) values (
    btrim(p_applicant_signer_email),
    p_applicant_signer_id,
    btrim(p_applicant_signer_name),
    v_application.id,
    null,
    null,
    v_document.file_sha256,
    v_document.id,
    v_application.org_id,
    v_application.project_id,
    'native',
    '{}'::jsonb,
    null,
    p_template_key,
    v_sent_at,
    p_actor_id,
    v_document.file_sha256,
    'sent',
    p_template_version::text
  )
  returning id into v_packet_id;

  insert into public.fiscal_sponsorship_signing_drafts (
    application_id,
    confirmed_fields,
    document_sha256,
    field_values,
    org_id,
    packet_id,
    project_id,
    signature_method,
    signature_value,
    signer_id,
    signer_role
  ) values (
    v_application.id,
    '{}'::text[],
    v_document.file_sha256,
    p_fields,
    v_application.org_id,
    v_packet_id,
    v_application.project_id,
    'typed',
    btrim(p_applicant_signer_name),
    p_applicant_signer_id,
    'applicant'
  );

  update public.fiscal_sponsorship_documents
  set
    status = 'sent_for_signature',
    updated_at = v_sent_at
  where id = v_document.id;

  insert into public.fiscal_sponsorship_events (
    actor_id,
    application_id,
    event_type,
    metadata,
    org_id,
    project_id,
    summary
  ) values (
    p_actor_id,
    v_application.id,
    'agreement_sent_for_signature',
    jsonb_build_object(
      'documentId', v_document.id,
      'packetId', v_packet_id,
      'provider', 'native',
      'providerSubmissionId', null
    ),
    v_application.org_id,
    v_application.project_id,
    'Fiscal sponsorship agreement sent for signature.'
  );

  return jsonb_build_object(
    'ok', true,
    'applicationId', v_application.id,
    'documentId', v_document.id,
    'packetId', v_packet_id,
    'transitioned', true
  );
end;
$$;

drop policy if exists "fiscal_sponsorship_signature_packets_insert"
  on public.fiscal_sponsorship_signature_packets;
drop policy if exists "fiscal_sponsorship_signature_packets_update"
  on public.fiscal_sponsorship_signature_packets;

revoke all on function public.send_fiscal_sponsorship_form_b_transition(uuid, uuid, uuid, timestamptz, timestamptz, uuid, text, text, jsonb, text, integer, text)
  from public, anon, authenticated;

grant execute on function public.send_fiscal_sponsorship_form_b_transition(uuid, uuid, uuid, timestamptz, timestamptz, uuid, text, text, jsonb, text, integer, text)
  to service_role;
