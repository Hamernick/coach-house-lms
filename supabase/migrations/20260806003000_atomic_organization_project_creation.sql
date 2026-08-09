set check_function_bodies = off;
set search_path = public;

create or replace function public.create_organization_project_transition(
  p_actor_id uuid,
  p_org_id uuid,
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
  v_project public.organization_projects%rowtype;
  v_project_id uuid;
begin
  if p_actor_id is null or p_org_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_actor');
  end if;

  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'invalid_project');
  end if;

  perform 1
  from public.organizations
  where user_id = p_org_id
  for key share;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'organization_not_found');
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

  insert into public.organization_projects (
    client_name,
    created_by,
    created_source,
    description,
    duration_label,
    end_date,
    member_labels,
    name,
    org_id,
    priority,
    progress,
    project_kind,
    start_date,
    status,
    tags,
    task_count,
    type_label,
    updated_by
  ) values (
    v_project.client_name,
    p_actor_id,
    'user',
    v_project.description,
    v_project.duration_label,
    v_project.end_date,
    coalesce(v_project.member_labels, '{}'::text[]),
    btrim(v_project.name),
    p_org_id,
    v_project.priority,
    0,
    'standard',
    v_project.start_date,
    v_project.status,
    coalesce(v_project.tags, '{}'::text[]),
    0,
    v_project.type_label,
    p_actor_id
  )
  returning id into v_project_id;

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
      p_org_id,
      v_project_id,
      p_actor_id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'projectId', v_project_id
  );
end;
$$;

revoke all on function public.create_organization_project_transition(uuid, uuid, jsonb, boolean, text, text)
  from public, anon, authenticated;

grant execute on function public.create_organization_project_transition(uuid, uuid, jsonb, boolean, text, text)
  to service_role;
