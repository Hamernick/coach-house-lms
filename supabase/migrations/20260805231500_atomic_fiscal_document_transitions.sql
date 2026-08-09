set check_function_bodies = off;
set search_path = public;

create or replace function public.connect_fiscal_sponsorship_document_transition(
  p_application_id uuid,
  p_asset_id uuid,
  p_actor_id uuid,
  p_document_key text,
  p_requirement_label text,
  p_title text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_application public.fiscal_sponsorship_applications%rowtype;
  v_asset public.organization_project_assets%rowtype;
  v_connected_at timestamptz := now();
  v_document_id uuid;
  v_kind text;
  v_label text;
  v_latest_document public.fiscal_sponsorship_documents%rowtype;
  v_version integer;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_document_key is null or p_document_key not in (
    'tax_id_confirmation',
    'governing_documents',
    'formation_or_good_standing',
    'budget_support',
    'fundraising_materials',
    'insurance',
    'grant_request_support',
    'grantee_report',
    'closeout_report',
    'additional_info'
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_document_key');
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_title');
  end if;

  select *
  into v_application
  from public.fiscal_sponsorship_applications
  where id = p_application_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  select *
  into v_asset
  from public.organization_project_assets
  where id = p_asset_id
    and org_id = v_application.org_id
    and project_id = v_application.project_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'invalid_asset');
  end if;

  select *
  into v_latest_document
  from public.fiscal_sponsorship_documents
  where application_id = v_application.id
    and document_key = p_document_key
  order by version desc, created_at desc
  limit 1;

  if found and v_latest_document.asset_id = v_asset.id then
    return jsonb_build_object(
      'ok', true,
      'documentId', v_latest_document.id,
      'documentKey', p_document_key,
      'transitioned', false
    );
  end if;

  v_kind := case
    when p_document_key in (
      'closeout_report',
      'grant_request_support',
      'grantee_report'
    ) then 'regrant'
    else 'application'
  end;
  v_label := coalesce(
    nullif(btrim(coalesce(p_requirement_label, '')), ''),
    initcap(replace(p_document_key, '_', ' '))
  );

  select coalesce(max(version), 0) + 1
  into v_version
  from public.fiscal_sponsorship_documents
  where application_id = v_application.id
    and kind = v_kind;

  insert into public.fiscal_sponsorship_documents (
    application_id,
    asset_id,
    document_key,
    generated_at,
    kind,
    metadata,
    mime,
    org_id,
    project_id,
    review_status,
    size_bytes,
    source_snapshot,
    status,
    storage_path,
    title,
    uploaded_at,
    uploaded_by,
    version
  ) values (
    v_application.id,
    v_asset.id,
    p_document_key,
    v_connected_at,
    v_kind,
    jsonb_build_object(
      'assetType', v_asset.asset_type,
      'externalUrl', v_asset.external_url,
      'requirementLabel', v_label
    ),
    v_asset.mime,
    v_application.org_id,
    v_application.project_id,
    'pending',
    v_asset.size_bytes,
    jsonb_build_object(
      'asset', jsonb_build_object(
        'id', v_asset.id,
        'name', v_asset.name,
        'description', v_asset.description
      ),
      'connectedAt', v_connected_at,
      'documentKey', p_document_key,
      'source', 'project-assets'
    ),
    'draft',
    v_asset.storage_path,
    btrim(p_title),
    v_connected_at,
    p_actor_id,
    v_version
  )
  returning id into v_document_id;

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
    'document_connected',
    jsonb_build_object(
      'assetId', v_asset.id,
      'documentId', v_document_id,
      'documentKey', p_document_key
    ),
    v_application.org_id,
    v_application.project_id,
    v_label || ' connected to fiscal sponsorship.'
  );

  return jsonb_build_object(
    'ok', true,
    'documentId', v_document_id,
    'documentKey', p_document_key,
    'transitioned', true
  );
end;
$$;

create or replace function public.review_fiscal_sponsorship_document_transition(
  p_application_id uuid,
  p_document_id uuid,
  p_actor_id uuid,
  p_decision text,
  p_notes text,
  p_expected_updated_at timestamptz
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
  v_label text;
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_reviewed_at timestamptz := now();
  v_tax_form_version integer;
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_decision is null
    or p_decision not in ('accepted', 'needs_info', 'rejected', 'not_required') then
    return jsonb_build_object('ok', false, 'code', 'invalid_decision');
  end if;

  if p_decision in ('needs_info', 'rejected') and v_notes is null then
    return jsonb_build_object('ok', false, 'code', 'note_required');
  end if;

  select *
  into v_application
  from public.fiscal_sponsorship_applications
  where id = p_application_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
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

  if p_expected_updated_at is null
    or v_document.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  if v_document.review_status = p_decision
    and v_document.review_notes is not distinct from v_notes then
    return jsonb_build_object(
      'ok', true,
      'documentId', v_document.id,
      'documentKey', v_document.document_key,
      'transitioned', false
    );
  end if;

  if p_decision = 'accepted'
    and v_document.document_key = 'tax_id_confirmation'
    and not (
      (v_document.kind = 'tax_form' and v_document.status = 'executed')
      or (v_document.asset_id is not null and v_document.mime = 'application/pdf')
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_w9');
  end if;

  if p_decision = 'accepted'
    and v_document.document_key = 'tax_id_confirmation'
    and v_document.kind <> 'tax_form' then
    select coalesce(max(version), 0) + 1
    into v_tax_form_version
    from public.fiscal_sponsorship_documents
    where application_id = v_application.id
      and kind = 'tax_form';
  end if;

  update public.fiscal_sponsorship_documents
  set
    kind = case
      when p_decision = 'accepted'
        and v_document.document_key = 'tax_id_confirmation'
        and v_document.asset_id is not null
        and v_document.mime = 'application/pdf'
      then 'tax_form'
      else v_document.kind
    end,
    review_notes = v_notes,
    review_status = p_decision,
    reviewed_at = v_reviewed_at,
    reviewed_by = p_actor_id,
    status = case
      when p_decision = 'accepted'
        and v_document.document_key = 'tax_id_confirmation'
        and v_document.asset_id is not null
        and v_document.mime = 'application/pdf'
      then 'executed'
      else v_document.status
    end,
    updated_at = v_reviewed_at,
    version = coalesce(v_tax_form_version, v_document.version)
  where id = v_document.id;

  v_label := coalesce(
    initcap(replace(v_document.document_key, '_', ' ')),
    nullif(btrim(v_document.title), ''),
    'Fiscal sponsorship document'
  );

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
    'document_reviewed',
    jsonb_build_object(
      'decision', p_decision,
      'documentId', v_document.id,
      'documentKey', v_document.document_key,
      'previousReviewStatus', v_document.review_status
    ),
    v_application.org_id,
    v_application.project_id,
    v_label || ' marked ' || replace(p_decision, '_', ' ') || '.'
  );

  return jsonb_build_object(
    'ok', true,
    'documentId', v_document.id,
    'documentKey', v_document.document_key,
    'transitioned', true
  );
end;
$$;

drop policy if exists "fiscal_sponsorship_documents_insert"
  on public.fiscal_sponsorship_documents;
drop policy if exists "fiscal_sponsorship_documents_update"
  on public.fiscal_sponsorship_documents;

revoke all on function public.connect_fiscal_sponsorship_document_transition(uuid, uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.review_fiscal_sponsorship_document_transition(uuid, uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.connect_fiscal_sponsorship_document_transition(uuid, uuid, uuid, text, text, text)
  to service_role;
grant execute on function public.review_fiscal_sponsorship_document_transition(uuid, uuid, uuid, text, text, timestamptz)
  to service_role;
