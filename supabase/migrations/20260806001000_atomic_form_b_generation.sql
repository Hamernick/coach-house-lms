set check_function_bodies = off;
set search_path = public;

create or replace function public.generate_fiscal_sponsorship_form_b_transition(
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
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_document is null or jsonb_typeof(p_document) <> 'object' then
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

  if p_expected_updated_at is null
    or v_application.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  if v_application.status not in ('approved', 'agreement_ready') then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'status', v_application.status
    );
  end if;

  if not exists (
    select 1
    from public.fiscal_sponsorship_documents document
    where document.application_id = v_application.id
      and document.org_id = v_application.org_id
      and document.project_id = v_application.project_id
      and document.document_key = 'tax_id_confirmation'
      and document.review_status = 'accepted'
      and document.kind = 'tax_form'
      and document.status = 'executed'
  ) then
    return jsonb_build_object('ok', false, 'code', 'missing_w9');
  end if;

  v_document := jsonb_populate_record(
    null::public.fiscal_sponsorship_documents,
    p_document
  );

  if v_document.kind is distinct from 'agreement'
    or v_document.status is distinct from 'generated'
    or v_document.storage_bucket is distinct from 'fiscal-signing'
    or v_document.mime is distinct from 'application/pdf'
    or nullif(btrim(coalesce(v_document.storage_path, '')), '') is null
    or position(
      v_application.org_id::text || '/' ||
      v_application.project_id::text || '/' ||
      v_application.id::text || '/generated/'
      in v_document.storage_path
    ) <> 1
    or nullif(btrim(coalesce(v_document.file_sha256, '')), '') is null
    or v_document.file_sha256 !~ '^[a-f0-9]{64}$'
    or nullif(btrim(coalesce(v_document.template_key, '')), '') is null
    or coalesce(v_document.template_version, 0) <= 0
    or nullif(btrim(coalesce(v_document.template_sha256, '')), '') is null
    or v_document.template_sha256 !~ '^[a-f0-9]{64}$'
    or nullif(btrim(coalesce(v_document.field_values_sha256, '')), '') is null
    or v_document.field_values_sha256 !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(coalesce(v_document.field_values, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_document.source_snapshot, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(v_document.metadata, '{}'::jsonb)) <> 'object'
    or nullif(btrim(coalesce(v_document.title, '')), '') is null
    or coalesce(v_document.size_bytes, 0) <= 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_document');
  end if;

  select coalesce(max(version), 0) + 1
  into v_version
  from public.fiscal_sponsorship_documents
  where application_id = v_application.id
    and kind = 'agreement';

  insert into public.fiscal_sponsorship_documents (
    application_id,
    asset_id,
    field_values,
    field_values_sha256,
    file_sha256,
    generated_at,
    generated_by,
    kind,
    metadata,
    mime,
    org_id,
    project_id,
    size_bytes,
    source_snapshot,
    status,
    storage_bucket,
    storage_path,
    template_key,
    template_sha256,
    template_version,
    title,
    version
  ) values (
    v_application.id,
    null,
    coalesce(v_document.field_values, '{}'::jsonb),
    v_document.field_values_sha256,
    v_document.file_sha256,
    coalesce(v_document.generated_at, v_transitioned_at),
    p_actor_id,
    'agreement',
    coalesce(v_document.metadata, '{}'::jsonb),
    'application/pdf',
    v_application.org_id,
    v_application.project_id,
    v_document.size_bytes,
    coalesce(v_document.source_snapshot, '{}'::jsonb),
    'generated',
    'fiscal-signing',
    v_document.storage_path,
    v_document.template_key,
    v_document.template_sha256,
    v_document.template_version,
    btrim(v_document.title),
    v_version
  )
  returning id into v_document_id;

  update public.fiscal_sponsorship_applications
  set
    status = 'agreement_ready',
    updated_at = v_transitioned_at,
    updated_by = p_actor_id
  where id = v_application.id;

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
    'agreement_generated',
    jsonb_build_object(
      'documentId', v_document_id,
      'fileSha256', v_document.file_sha256,
      'version', v_version
    ),
    v_application.org_id,
    v_application.project_id,
    'Fiscal sponsorship agreement generated.'
  );

  return jsonb_build_object(
    'ok', true,
    'applicationId', v_application.id,
    'documentId', v_document_id,
    'version', v_version
  );
end;
$$;

revoke all on function public.generate_fiscal_sponsorship_form_b_transition(uuid, uuid, timestamptz, jsonb)
  from public, anon, authenticated;

grant execute on function public.generate_fiscal_sponsorship_form_b_transition(uuid, uuid, timestamptz, jsonb)
  to service_role;
