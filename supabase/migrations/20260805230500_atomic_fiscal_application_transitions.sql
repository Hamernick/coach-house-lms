set check_function_bodies = off;
set search_path = public;

create or replace function public.submit_fiscal_sponsorship_application_transition(
  p_application_id uuid,
  p_actor_id uuid,
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
  v_transitioned_at timestamptz := now();
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  select *
  into v_application
  from public.fiscal_sponsorship_applications
  where id = p_application_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_application.status = 'submitted' then
    return jsonb_build_object(
      'ok', true,
      'applicationId', v_application.id,
      'status', v_application.status,
      'transitioned', false
    );
  end if;

  if p_expected_updated_at is null
    or v_application.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  if v_application.status not in ('draft', 'needs_info') then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'status', v_application.status
    );
  end if;

  update public.fiscal_sponsorship_applications
  set
    review_notes = null,
    reviewed_at = null,
    reviewed_by = null,
    status = 'submitted',
    submitted_at = v_transitioned_at,
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
    'application_submitted',
    jsonb_build_object('previousStatus', v_application.status),
    v_application.org_id,
    v_application.project_id,
    'Fiscal sponsorship application submitted.'
  );

  return jsonb_build_object(
    'ok', true,
    'applicationId', v_application.id,
    'status', 'submitted',
    'transitioned', true
  );
end;
$$;

create or replace function public.review_fiscal_sponsorship_application_transition(
  p_application_id uuid,
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
  v_reviewed_at timestamptz := now();
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_decision is null
    or p_decision not in ('approved', 'needs_info', 'declined') then
    return jsonb_build_object('ok', false, 'code', 'invalid_decision');
  end if;

  if p_decision in ('needs_info', 'declined')
    and nullif(btrim(coalesce(p_notes, '')), '') is null then
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

  if p_expected_updated_at is null
    or v_application.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  if v_application.status not in ('submitted', 'in_review') then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_status',
      'status', v_application.status
    );
  end if;

  insert into public.fiscal_sponsorship_reviews (
    application_id,
    decision,
    metadata,
    notes,
    org_id,
    project_id,
    reviewed_at,
    reviewed_by
  ) values (
    v_application.id,
    p_decision,
    jsonb_build_object('previousStatus', v_application.status),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_application.org_id,
    v_application.project_id,
    v_reviewed_at,
    p_actor_id
  );

  update public.fiscal_sponsorship_applications
  set
    review_notes = nullif(btrim(coalesce(p_notes, '')), ''),
    reviewed_at = v_reviewed_at,
    reviewed_by = p_actor_id,
    status = p_decision,
    updated_at = v_reviewed_at,
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
    'application_' || p_decision,
    jsonb_build_object(
      'decision', p_decision,
      'previousStatus', v_application.status
    ),
    v_application.org_id,
    v_application.project_id,
    'Fiscal sponsorship application marked ' || replace(p_decision, '_', ' ') || '.'
  );

  return jsonb_build_object(
    'ok', true,
    'applicationId', v_application.id,
    'status', p_decision,
    'transitioned', true
  );
end;
$$;

revoke all on function public.submit_fiscal_sponsorship_application_transition(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.review_fiscal_sponsorship_application_transition(uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.submit_fiscal_sponsorship_application_transition(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.review_fiscal_sponsorship_application_transition(uuid, uuid, text, text, timestamptz)
  to service_role;
