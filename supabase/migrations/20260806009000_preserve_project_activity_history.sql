set check_function_bodies = off;
set search_path = public;

alter table public.organization_project_activity_events
  drop constraint if exists organization_project_activity_events_project_id_fkey;

alter table public.organization_project_activity_events
  add constraint organization_project_activity_events_project_id_fkey
  foreign key (project_id)
  references public.organization_projects(id)
  on delete set null;

alter table public.organization_project_activity_events
  drop constraint if exists organization_project_activity_events_event_type_check;

alter table public.organization_project_activity_events
  add constraint organization_project_activity_events_event_type_check
  check (
    event_type in (
      'created',
      'status_changed',
      'scheduled',
      'published',
      'completed',
      'updated',
      'deleted'
    )
  );

create or replace function public.record_organization_project_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_event_kind text;
  v_from_status text;
  v_org_id uuid;
  v_project_id uuid;
  v_project_kind text;
  v_project_name text;
  v_priority text;
  v_start_date date;
  v_end_date date;
  v_to_status text;
begin
  if tg_op = 'INSERT' then
    v_event_kind := 'created';
    v_org_id := new.org_id;
    v_project_id := new.id;
    v_project_name := new.name;
    v_project_kind := new.project_kind;
    v_priority := new.priority;
    v_start_date := new.start_date;
    v_end_date := new.end_date;
    v_to_status := new.status;
    v_actor_id := coalesce(new.updated_by, new.created_by);
  elsif tg_op = 'DELETE' then
    v_event_kind := 'deleted';
    v_org_id := old.org_id;
    v_project_id := null;
    v_project_name := old.name;
    v_project_kind := old.project_kind;
    v_priority := old.priority;
    v_start_date := old.start_date;
    v_end_date := old.end_date;
    v_from_status := old.status;
    v_actor_id := coalesce(old.updated_by, old.created_by);
  else
    if old.status is distinct from new.status then
      v_event_kind := case
        when new.status = 'completed' then 'completed'
        else 'status_changed'
      end;
      v_from_status := old.status;
      v_to_status := new.status;
    elsif old.start_date is distinct from new.start_date
      or old.end_date is distinct from new.end_date then
      v_event_kind := 'scheduled';
    else
      v_event_kind := 'updated';
    end if;

    v_org_id := new.org_id;
    v_project_id := new.id;
    v_project_name := new.name;
    v_project_kind := new.project_kind;
    v_priority := new.priority;
    v_start_date := new.start_date;
    v_end_date := new.end_date;
    v_actor_id := coalesce(new.updated_by, new.created_by);
  end if;

  insert into public.organization_project_activity_events (
    org_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    title,
    from_status,
    to_status,
    actor_id,
    metadata,
    occurred_at
  ) values (
    v_org_id,
    v_project_id,
    'project',
    case when tg_op = 'DELETE' then old.id else new.id end,
    v_event_kind,
    v_project_name,
    v_from_status,
    v_to_status,
    v_actor_id,
    jsonb_build_object(
      'start_date', v_start_date,
      'end_date', v_end_date,
      'project_kind', v_project_kind,
      'priority', v_priority
    ),
    case
      when tg_op = 'DELETE' then timezone('utc', now())
      else coalesce(new.updated_at, timezone('utc', now()))
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.record_organization_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_end_date date;
  v_event_kind text;
  v_from_status text;
  v_org_id uuid;
  v_priority text;
  v_project_id uuid;
  v_start_date date;
  v_task_id uuid;
  v_task_title text;
  v_to_status text;
  v_workstream_name text;
begin
  if tg_op = 'INSERT' then
    v_event_kind := 'created';
    v_org_id := new.org_id;
    v_project_id := new.project_id;
    v_task_id := new.id;
    v_task_title := new.title;
    v_start_date := new.start_date;
    v_end_date := new.end_date;
    v_priority := new.priority;
    v_workstream_name := new.workstream_name;
    v_to_status := new.status;
    v_actor_id := coalesce(new.updated_by, new.created_by);
  elsif tg_op = 'DELETE' then
    v_event_kind := 'deleted';
    v_org_id := old.org_id;
    select project.id
    into v_project_id
    from public.organization_projects as project
    where project.id = old.project_id;
    v_task_id := old.id;
    v_task_title := old.title;
    v_start_date := old.start_date;
    v_end_date := old.end_date;
    v_priority := old.priority;
    v_workstream_name := old.workstream_name;
    v_from_status := old.status;
    v_actor_id := coalesce(old.updated_by, old.created_by);
  else
    if old.status is distinct from new.status then
      v_event_kind := case
        when new.status = 'done' then 'completed'
        else 'status_changed'
      end;
      v_from_status := old.status;
      v_to_status := new.status;
    elsif old.start_date is distinct from new.start_date
      or old.end_date is distinct from new.end_date then
      v_event_kind := 'scheduled';
    else
      v_event_kind := 'updated';
    end if;

    v_org_id := new.org_id;
    v_project_id := new.project_id;
    v_task_id := new.id;
    v_task_title := new.title;
    v_start_date := new.start_date;
    v_end_date := new.end_date;
    v_priority := new.priority;
    v_workstream_name := new.workstream_name;
    v_actor_id := coalesce(new.updated_by, new.created_by);
  end if;

  insert into public.organization_project_activity_events (
    org_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    title,
    from_status,
    to_status,
    actor_id,
    metadata,
    occurred_at
  ) values (
    v_org_id,
    v_project_id,
    'task',
    v_task_id,
    v_event_kind,
    v_task_title,
    v_from_status,
    v_to_status,
    v_actor_id,
    jsonb_build_object(
      'start_date', v_start_date,
      'end_date', v_end_date,
      'workstream_name', v_workstream_name,
      'priority', v_priority
    ),
    case
      when tg_op = 'DELETE' then timezone('utc', now())
      else coalesce(new.updated_at, timezone('utc', now()))
    end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists record_organization_project_activity
  on public.organization_projects;

create trigger record_organization_project_activity
  after insert or delete or update of
    client_name,
    description,
    end_date,
    member_labels,
    name,
    priority,
    progress,
    start_date,
    status,
    tags,
    type_label
  on public.organization_projects
  for each row execute procedure public.record_organization_project_activity();

drop trigger if exists record_organization_task_activity
  on public.organization_tasks;

create trigger record_organization_task_activity
  after insert or delete or update of
    description,
    end_date,
    priority,
    project_id,
    start_date,
    status,
    tag_label,
    task_type,
    title,
    workstream_name
  on public.organization_tasks
  for each row execute procedure public.record_organization_task_activity();
