set check_function_bodies = off;
set search_path = public;

alter table public.platform_admin_workstream_categories
  drop constraint if exists platform_admin_workstream_categories_default_key_check;

alter table public.platform_admin_workstream_categories
  add constraint platform_admin_workstream_categories_default_key_check
  check (
    default_key is null
    or default_key in (
      'backlog',
      'planned',
      'waiting_on_organization',
      'review_approval',
      'active',
      'completed',
      'cancelled'
    )
  );

update public.platform_admin_workstream_categories
set
  name = case default_key
    when 'backlog' then 'New Intake'
    when 'planned' then 'Coach Action'
    when 'active' then 'Ongoing Support'
    when 'completed' then 'Complete'
    else name
  end,
  color = case default_key
    when 'backlog' then 'slate'
    when 'planned' then 'amber'
    when 'active' then 'violet'
    when 'completed' then 'emerald'
    else color
  end,
  position = case default_key
    when 'backlog' then 0
    when 'planned' then 1
    when 'active' then 4
    when 'completed' then 5
    else position
  end
where
  (default_key = 'backlog' and name = 'Backlog')
  or (default_key = 'planned' and name = 'Planned')
  or (default_key = 'active' and name = 'Active')
  or (default_key = 'completed' and name = 'Completed');

insert into public.platform_admin_workstream_categories (
  owner_id,
  name,
  color,
  position,
  default_key
)
select
  owners.owner_id,
  defaults.name,
  defaults.color,
  defaults.position,
  defaults.default_key
from (
  select distinct owner_id
  from public.platform_admin_workstream_categories
) as owners
cross join (
  values
    ('Waiting on Organization', 'rose', 2, 'waiting_on_organization'),
    ('Review & Approval', 'blue', 3, 'review_approval')
) as defaults(name, color, position, default_key)
on conflict do nothing;
