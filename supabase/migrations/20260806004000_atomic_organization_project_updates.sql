set check_function_bodies = off;
set search_path = public;

create or replace function public.update_organization_project_transition(
  p_project_id uuid,
  p_actor_id uuid,
  p_expected_org_id uuid,
  p_expected_updated_at timestamptz,
  p_project jsonb,
  p_has_overview_document boolean,
  p_overview_document_html text,
  p_overview_document_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_existing public.organization_projects%rowtype;
  v_project public.organization_projects%rowtype;
  v_updated_at timestamptz := now();
begin
  if p_actor_id is null or p_expected_org_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  select *
  into v_existing
  from public.organization_projects
  where id = p_project_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_existing.org_id <> p_expected_org_id then
    return jsonb_build_object('ok', false, 'code', 'scope_changed');
  end if;

  if p_expected_updated_at is null
    or v_existing.updated_at is distinct from p_expected_updated_at then
    return jsonb_build_object('ok', false, 'code', 'stale');
  end if;

  v_project := jsonb_populate_record(
    null::public.organization_projects,
    p_project
  );

  if nullif(btrim(coalesce(v_project.name, '')), '') is null
    or v_project.status not in (
      'backlog', 'planned', 'active', 'cancelled', 'completed'
    )
    or v_project.priority not in ('urgent', 'high', 'medium', 'low')
    or v_project.start_date is null
    or v_project.end_date is null
    or v_project.end_date < v_project.start_date then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  if coalesce(p_has_overview_document, false)
    and (
      p_overview_document_html is null
      or p_overview_document_text is null
    ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_overview');
  end if;

  update public.organization_projects
  set
    client_name = v_project.client_name,
    description = v_project.description,
    duration_label = v_project.duration_label,
    end_date = v_project.end_date,
    member_labels = coalesce(v_project.member_labels, '{}'::text[]),
    name = btrim(v_project.name),
    priority = v_project.priority,
    start_date = v_project.start_date,
    status = v_project.status,
    tags = coalesce(v_project.tags, '{}'::text[]),
    type_label = v_project.type_label,
    updated_at = v_updated_at,
    updated_by = p_actor_id
  where id = v_existing.id;

  if coalesce(p_has_overview_document, false) then
    insert into public.organization_project_overview_documents (
      created_by,
      document_html,
      document_text,
      org_id,
      project_id,
      updated_by
    ) values (
      p_actor_id,
      p_overview_document_html,
      p_overview_document_text,
      v_existing.org_id,
      v_existing.id,
      p_actor_id
    )
    on conflict (org_id, project_id) do update
    set
      document_html = excluded.document_html,
      document_text = excluded.document_text,
      updated_by = excluded.updated_by;
  end if;

  return jsonb_build_object(
    'ok', true,
    'projectId', v_existing.id,
    'updatedAt', v_updated_at
  );
end;
$$;

revoke all on function public.update_organization_project_transition(uuid, uuid, uuid, timestamptz, jsonb, boolean, text, text)
  from public, anon, authenticated;

grant execute on function public.update_organization_project_transition(uuid, uuid, uuid, timestamptz, jsonb, boolean, text, text)
  to service_role;
