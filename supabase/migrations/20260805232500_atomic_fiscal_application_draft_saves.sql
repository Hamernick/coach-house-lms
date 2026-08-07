set check_function_bodies = off;
set search_path = public;

create or replace function public.save_fiscal_sponsorship_application_draft_transition(
  p_project_id uuid,
  p_actor_id uuid,
  p_expected_updated_at timestamptz,
  p_payload jsonb,
  p_source_activity_id text,
  p_has_budget_rows boolean,
  p_budget_rows jsonb,
  p_budget_total_cents bigint,
  p_allow_locked boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_application public.fiscal_sponsorship_applications%rowtype;
  v_draft public.fiscal_sponsorship_applications%rowtype;
  v_goal_cents bigint;
  v_org_id uuid;
  v_program public.programs%rowtype;
  v_saved_at timestamptz := now();
begin
  if p_actor_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_payload');
  end if;

  select project.org_id
  into v_org_id
  from public.organization_projects project
  where project.id = p_project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'project_not_found');
  end if;

  select *
  into v_application
  from public.fiscal_sponsorship_applications application
  where application.org_id = v_org_id
    and application.project_id = p_project_id
  for update;

  if found then
    if p_expected_updated_at is null
      or v_application.updated_at is distinct from p_expected_updated_at then
      return jsonb_build_object('ok', false, 'code', 'stale');
    end if;

    if not coalesce(p_allow_locked, false)
      and v_application.status not in ('draft', 'needs_info') then
      return jsonb_build_object(
        'ok', false,
        'code', 'invalid_status',
        'status', v_application.status
      );
    end if;
  elsif p_expected_updated_at is not null then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  if coalesce(p_has_budget_rows, false) and p_source_activity_id is not null then
    if jsonb_typeof(coalesce(p_budget_rows, '[]'::jsonb)) <> 'array'
      or coalesce(p_budget_total_cents, -1) < 0 then
      return jsonb_build_object('ok', false, 'code', 'invalid_budget');
    end if;

    select *
    into v_program
    from public.programs program
    where program.id::text = p_source_activity_id
      and program.user_id = v_org_id
    for update;

    if not found then
      return jsonb_build_object(
        'ok', false,
        'code', 'source_activity_not_found'
      );
    end if;

    v_goal_cents := greatest(
      0,
      p_budget_total_cents - coalesce(v_program.raised_cents, 0)
    );

    if v_goal_cents > 2147483647 then
      return jsonb_build_object('ok', false, 'code', 'invalid_budget');
    end if;
  end if;

  v_draft := jsonb_populate_record(
    null::public.fiscal_sponsorship_applications,
    p_payload
  );

  if v_application.id is not null then
    update public.fiscal_sponsorship_applications
    set
      applicant_full_name = v_draft.applicant_full_name,
      applicant_first_name = v_draft.applicant_first_name,
      applicant_last_name = v_draft.applicant_last_name,
      mailing_street_address = v_draft.mailing_street_address,
      mailing_street_address_2 = v_draft.mailing_street_address_2,
      mailing_city = v_draft.mailing_city,
      mailing_state = v_draft.mailing_state,
      mailing_postal_code = v_draft.mailing_postal_code,
      phone_number = v_draft.phone_number,
      primary_email = v_draft.primary_email,
      legal_entity_type = v_draft.legal_entity_type,
      legal_entity_has_501c3 = v_draft.legal_entity_has_501c3,
      formation_status = v_draft.formation_status,
      project_name = v_draft.project_name,
      project_duration_type = v_draft.project_duration_type,
      temporary_start_date = v_draft.temporary_start_date,
      temporary_end_date = v_draft.temporary_end_date,
      focus_area = v_draft.focus_area,
      project_description = v_draft.project_description,
      project_location = v_draft.project_location,
      estimated_budget_cents = v_draft.estimated_budget_cents,
      expense_summary = v_draft.expense_summary,
      prospective_funding_sources = v_draft.prospective_funding_sources,
      public_benefit = v_draft.public_benefit,
      leadership_background = v_draft.leadership_background,
      initiative_history = v_draft.initiative_history,
      short_public_description = v_draft.short_public_description,
      operates_outside_united_states = v_draft.operates_outside_united_states,
      receives_investor_return_funds = v_draft.receives_investor_return_funds,
      engages_in_lobbying = v_draft.engages_in_lobbying,
      has_legal_compliance_financial_concerns =
        v_draft.has_legal_compliance_financial_concerns,
      concerns_explanation = v_draft.concerns_explanation,
      source_snapshot = coalesce(v_draft.source_snapshot, '{}'::jsonb),
      document_template_payload = coalesce(
        v_draft.document_template_payload,
        '{}'::jsonb
      ),
      metadata = coalesce(v_draft.metadata, '{}'::jsonb),
      updated_at = v_saved_at,
      updated_by = p_actor_id
    where id = v_application.id;
  else
    insert into public.fiscal_sponsorship_applications (
      org_id,
      project_id,
      status,
      applicant_full_name,
      applicant_first_name,
      applicant_last_name,
      mailing_street_address,
      mailing_street_address_2,
      mailing_city,
      mailing_state,
      mailing_postal_code,
      phone_number,
      primary_email,
      legal_entity_type,
      legal_entity_has_501c3,
      formation_status,
      project_name,
      project_duration_type,
      temporary_start_date,
      temporary_end_date,
      focus_area,
      project_description,
      project_location,
      estimated_budget_cents,
      expense_summary,
      prospective_funding_sources,
      public_benefit,
      leadership_background,
      initiative_history,
      short_public_description,
      operates_outside_united_states,
      receives_investor_return_funds,
      engages_in_lobbying,
      has_legal_compliance_financial_concerns,
      concerns_explanation,
      source_snapshot,
      document_template_payload,
      created_by,
      updated_by,
      metadata,
      created_at,
      updated_at
    ) values (
      v_org_id,
      p_project_id,
      'draft',
      v_draft.applicant_full_name,
      v_draft.applicant_first_name,
      v_draft.applicant_last_name,
      v_draft.mailing_street_address,
      v_draft.mailing_street_address_2,
      v_draft.mailing_city,
      v_draft.mailing_state,
      v_draft.mailing_postal_code,
      v_draft.phone_number,
      v_draft.primary_email,
      v_draft.legal_entity_type,
      v_draft.legal_entity_has_501c3,
      v_draft.formation_status,
      v_draft.project_name,
      v_draft.project_duration_type,
      v_draft.temporary_start_date,
      v_draft.temporary_end_date,
      v_draft.focus_area,
      v_draft.project_description,
      v_draft.project_location,
      v_draft.estimated_budget_cents,
      v_draft.expense_summary,
      v_draft.prospective_funding_sources,
      v_draft.public_benefit,
      v_draft.leadership_background,
      v_draft.initiative_history,
      v_draft.short_public_description,
      v_draft.operates_outside_united_states,
      v_draft.receives_investor_return_funds,
      v_draft.engages_in_lobbying,
      v_draft.has_legal_compliance_financial_concerns,
      v_draft.concerns_explanation,
      coalesce(v_draft.source_snapshot, '{}'::jsonb),
      coalesce(v_draft.document_template_payload, '{}'::jsonb),
      p_actor_id,
      p_actor_id,
      coalesce(v_draft.metadata, '{}'::jsonb),
      v_saved_at,
      v_saved_at
    )
    returning * into v_application;
  end if;

  if coalesce(p_has_budget_rows, false) and p_source_activity_id is not null then
    update public.programs
    set
      goal_cents = v_goal_cents::integer,
      wizard_snapshot =
        case
          when jsonb_typeof(v_program.wizard_snapshot) = 'object'
            then v_program.wizard_snapshot
          else '{}'::jsonb
        end
        || jsonb_build_object(
          'budgetRows', coalesce(p_budget_rows, '[]'::jsonb),
          'budgetUsd', p_budget_total_cents / 100.0,
          'goalUsd', v_goal_cents / 100.0,
          'updatedAt', v_saved_at
        ),
      updated_at = v_saved_at
    where id = v_program.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'applicationId', coalesce(v_application.id, (
      select application.id
      from public.fiscal_sponsorship_applications application
      where application.org_id = v_org_id
        and application.project_id = p_project_id
    )),
    'updatedAt', v_saved_at
  );
end;
$$;

drop policy if exists "fiscal_sponsorship_applications_insert"
  on public.fiscal_sponsorship_applications;
drop policy if exists "fiscal_sponsorship_applications_update"
  on public.fiscal_sponsorship_applications;

revoke all on function public.save_fiscal_sponsorship_application_draft_transition(
  uuid,
  uuid,
  timestamptz,
  jsonb,
  text,
  boolean,
  jsonb,
  bigint,
  boolean
) from public, anon, authenticated;

grant execute on function public.save_fiscal_sponsorship_application_draft_transition(
  uuid,
  uuid,
  timestamptz,
  jsonb,
  text,
  boolean,
  jsonb,
  bigint,
  boolean
) to service_role;
