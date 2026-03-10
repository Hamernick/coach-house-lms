set check_function_bodies = off;
set search_path = public;

create temporary table _workspace_objective_backfill_groups_raw on commit drop as
select
  board.org_id,
  coalesce(nullif(trim(category_entry ->> 'id'), ''), gen_random_uuid()::text) as legacy_category_id,
  nullif(trim(category_entry ->> 'title'), '') as title,
  case
    when lower(coalesce(category_entry ->> 'archived', '')) in ('true', 'false')
      then (category_entry ->> 'archived')::boolean
    else false
  end as archived,
  coalesce(
    case
      when coalesce(category_entry ->> 'createdAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (category_entry ->> 'createdAt')::timestamptz
      else null
    end,
    board.updated_at,
    timezone('utc', now())
  ) as created_at,
  coalesce(board.updated_by, board.org_id) as created_by
from organization_workspace_boards board
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(board.state -> 'tracker' -> 'categories') = 'array'
      then board.state -> 'tracker' -> 'categories'
    else '[]'::jsonb
  end
) as category_entry
where nullif(trim(category_entry ->> 'title'), '') is not null;

create temporary table _workspace_objective_backfill_groups_unique on commit drop as
select distinct on (org_id, lower(title), archived)
  gen_random_uuid() as group_id,
  org_id,
  title,
  archived,
  created_at,
  created_by
from _workspace_objective_backfill_groups_raw
order by org_id, lower(title), archived, created_at;

insert into organization_workspace_objective_groups (
  id,
  org_id,
  title,
  kind,
  source_type,
  archived_at,
  created_by,
  created_at,
  updated_at
)
select
  grouped.group_id,
  grouped.org_id,
  grouped.title,
  'custom' as kind,
  'none' as source_type,
  case when grouped.archived then grouped.created_at else null end as archived_at,
  grouped.created_by,
  grouped.created_at,
  grouped.created_at
from _workspace_objective_backfill_groups_unique grouped
where not exists (
  select 1
  from organization_workspace_objective_groups existing
  where existing.org_id = grouped.org_id
    and lower(existing.title) = lower(grouped.title)
    and (
      (existing.archived_at is null and grouped.archived = false)
      or (existing.archived_at is not null and grouped.archived = true)
    )
);

create temporary table _workspace_objective_backfill_group_map on commit drop as
select
  raw.org_id,
  raw.legacy_category_id,
  grouped.group_id
from _workspace_objective_backfill_groups_raw raw
join _workspace_objective_backfill_groups_unique grouped
  on grouped.org_id = raw.org_id
 and lower(grouped.title) = lower(raw.title)
 and grouped.archived = raw.archived;

create temporary table _workspace_objective_backfill_tickets_raw on commit drop as
select
  board.org_id,
  coalesce(nullif(trim(ticket_entry ->> 'id'), ''), gen_random_uuid()::text) as legacy_ticket_id,
  coalesce(nullif(trim(ticket_entry ->> 'categoryId'), ''), 'general') as legacy_category_id,
  nullif(trim(ticket_entry ->> 'title'), '') as title,
  case
    when ticket_entry ->> 'status' in ('todo', 'in_progress', 'done')
      then ticket_entry ->> 'status'
    else 'todo'
  end as status,
  case
    when lower(coalesce(ticket_entry ->> 'archived', '')) in ('true', 'false')
      then (ticket_entry ->> 'archived')::boolean
    else false
  end as archived,
  coalesce(
    case
      when coalesce(ticket_entry ->> 'createdAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (ticket_entry ->> 'createdAt')::timestamptz
      else null
    end,
    board.updated_at,
    timezone('utc', now())
  ) as created_at,
  coalesce(
    case
      when coalesce(ticket_entry ->> 'updatedAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (ticket_entry ->> 'updatedAt')::timestamptz
      else null
    end,
    case
      when coalesce(ticket_entry ->> 'createdAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (ticket_entry ->> 'createdAt')::timestamptz
      else null
    end,
    board.updated_at,
    timezone('utc', now())
  ) as updated_at,
  coalesce(board.updated_by, board.org_id) as created_by
from organization_workspace_boards board
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(board.state -> 'tracker' -> 'tickets') = 'array'
      then board.state -> 'tracker' -> 'tickets'
    else '[]'::jsonb
  end
) as ticket_entry
where nullif(trim(ticket_entry ->> 'title'), '') is not null;

create temporary table _workspace_objective_backfill_general_groups on commit drop as
select
  ticket_orgs.org_id,
  gen_random_uuid() as group_id
from (
  select distinct org_id
  from _workspace_objective_backfill_tickets_raw
) as ticket_orgs
where not exists (
  select 1
  from organization_workspace_objective_groups existing
  where existing.org_id = ticket_orgs.org_id
    and lower(existing.title) = 'general'
    and existing.archived_at is null
);

insert into organization_workspace_objective_groups (
  id,
  org_id,
  title,
  kind,
  source_type,
  archived_at,
  created_by,
  created_at,
  updated_at
)
select
  general.group_id,
  general.org_id,
  'General' as title,
  'custom' as kind,
  'none' as source_type,
  null,
  general.org_id as created_by,
  timezone('utc', now()),
  timezone('utc', now())
from _workspace_objective_backfill_general_groups general;

insert into organization_workspace_objectives (
  id,
  org_id,
  group_id,
  title,
  description,
  status,
  priority,
  kind,
  source_type,
  source_key,
  due_at,
  completed_at,
  position_rank,
  created_by,
  updated_by,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  ticket.org_id,
  coalesce(
    category_match.group_id,
    existing_general.id,
    generated_general.group_id
  ) as group_id,
  ticket.title,
  null as description,
  case
    when ticket.archived then 'archived'
    when ticket.status = 'done' then 'done'
    when ticket.status = 'in_progress' then 'in_progress'
    else 'todo'
  end as status,
  'normal' as priority,
  'custom' as kind,
  'custom' as source_type,
  null as source_key,
  null as due_at,
  case when ticket.status = 'done' then ticket.updated_at else null end as completed_at,
  0 as position_rank,
  ticket.created_by,
  ticket.created_by as updated_by,
  ticket.created_at,
  ticket.updated_at
from _workspace_objective_backfill_tickets_raw ticket
left join _workspace_objective_backfill_group_map category_match
  on category_match.org_id = ticket.org_id
 and category_match.legacy_category_id = ticket.legacy_category_id
left join organization_workspace_objective_groups existing_general
  on existing_general.org_id = ticket.org_id
 and lower(existing_general.title) = 'general'
 and existing_general.archived_at is null
left join _workspace_objective_backfill_general_groups generated_general
  on generated_general.org_id = ticket.org_id
where coalesce(ticket.title, '') <> ''
  and not exists (
    select 1
    from organization_workspace_objectives existing
    where existing.org_id = ticket.org_id
      and existing.kind = 'custom'
      and existing.source_type = 'custom'
      and existing.title = ticket.title
      and existing.created_at = ticket.created_at
  );
