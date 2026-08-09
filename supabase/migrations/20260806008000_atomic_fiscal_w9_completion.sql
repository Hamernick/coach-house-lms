set check_function_bodies = off;
set search_path = public;

create or replace function public.complete_fiscal_sponsorship_w9_transition(
  p_application_id uuid,
  p_actor_id uuid,
  p_expected_updated_at timestamptz,
  p_document jsonb
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
  v_document_id uuid;
  v_transitioned_at timestamptz := now();
  v_version integer;
begin
  if p_actor_id is null
    or p_document is null
    or jsonb_typeof(p_document) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_document');
  end if;

  select * into v_application
  from public.fiscal_sponsorship_applications
  where id = p_application_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if p_expected_updated_at is null
    or v_application.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  v_document := jsonb_populate_record(
    null::public.fiscal_sponsorship_documents,
    p_document
  );

  if v_document.document_key is distinct from 'tax_id_confirmation'
    or v_document.kind is distinct from 'tax_form'
    or v_document.status is distinct from 'executed'
    or v_document.review_status is distinct from 'pending'
    or v_document.storage_bucket is distinct from 'fiscal-signing'
    or v_document.mime is distinct from 'application/pdf'
    or position(
      v_application.org_id::text || '/' ||
      v_application.project_id::text || '/' ||
      v_application.id::text || '/w9/'
      in coalesce(v_document.storage_path, '')
    ) <> 1
    or v_document.file_sha256 !~ '^[a-f0-9]{64}$'
    or v_document.field_values_sha256 !~ '^[a-f0-9]{64}$'
    or v_document.template_sha256 !~ '^[a-f0-9]{64}$'
    or nullif(btrim(coalesce(v_document.template_key, '')), '') is null
    or coalesce(v_document.template_version, 0) <= 0
    or v_document.confirmed_at is null
    or v_document.generated_at is null
    or v_document.locked_at is null
    or v_document.uploaded_at is null
    or jsonb_typeof(coalesce(v_document.field_values, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_document.metadata, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_document.source_snapshot, '{}'::jsonb)) <> 'object'
    or coalesce(v_document.size_bytes, 0) <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_document');
  end if;

  select coalesce(max(version), 0) + 1 into v_version
  from public.fiscal_sponsorship_documents
  where application_id = v_application.id
    and kind = 'tax_form';

  insert into public.fiscal_sponsorship_documents (
    application_id, asset_id, confirmed_at, confirmed_by, document_key,
    field_values, field_values_sha256, file_sha256, generated_at, generated_by,
    kind, locked_at, metadata, mime, org_id, project_id, review_status,
    size_bytes, source_snapshot, status, storage_bucket, storage_path,
    template_key, template_sha256, template_version, title, uploaded_at,
    uploaded_by, version
  ) values (
    v_application.id, null, v_document.confirmed_at, p_actor_id,
    'tax_id_confirmation', coalesce(v_document.field_values, '{}'::jsonb),
    v_document.field_values_sha256, v_document.file_sha256,
    v_document.generated_at, p_actor_id, 'tax_form', v_document.locked_at,
    coalesce(v_document.metadata, '{}'::jsonb), 'application/pdf',
    v_application.org_id, v_application.project_id, 'pending',
    v_document.size_bytes, coalesce(v_document.source_snapshot, '{}'::jsonb),
    'executed', 'fiscal-signing', v_document.storage_path,
    v_document.template_key, v_document.template_sha256,
    v_document.template_version, 'Signed IRS Form W-9',
    v_document.uploaded_at, p_actor_id, v_version
  ) returning id into v_document_id;

  update public.fiscal_sponsorship_applications
  set updated_at = v_transitioned_at, updated_by = p_actor_id
  where id = v_application.id;

  insert into public.fiscal_sponsorship_events (
    actor_id, application_id, event_type, metadata, org_id, project_id, summary
  ) values (
    p_actor_id, v_application.id, 'w9_completed',
    jsonb_build_object(
      'documentId', v_document_id,
      'fileSha256', v_document.file_sha256,
      'signatureSha256', v_document.metadata ->> 'signatureSha256',
      'templateSha256', v_document.template_sha256,
      'version', v_version
    ),
    v_application.org_id, v_application.project_id,
    'Applicant completed and signed IRS Form W-9.'
  );

  return jsonb_build_object(
    'ok', true,
    'applicationId', v_application.id,
    'documentId', v_document_id,
    'version', v_version
  );
end;
$$;

revoke all on function public.complete_fiscal_sponsorship_w9_transition(uuid, uuid, timestamptz, jsonb)
  from public, anon, authenticated;

grant execute on function public.complete_fiscal_sponsorship_w9_transition(uuid, uuid, timestamptz, jsonb)
  to service_role;
