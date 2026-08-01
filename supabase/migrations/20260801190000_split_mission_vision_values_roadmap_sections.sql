set search_path = public;

-- Keep the historical Mission roadmap id for link and completion compatibility,
-- while giving Vision and Values their own canonical roadmap sections.
update module_assignments as assignment
set schema = jsonb_set(
  coalesce(assignment.schema, '{}'::jsonb),
  '{roadmap_section}',
  to_jsonb(
    case module.slug
      when 'mission' then 'mission_vision_values'
      when 'vision' then 'vision'
      when 'values' then 'values'
    end
  ),
  true
)
from modules as module
join classes as class on class.id = module.class_id
where assignment.module_id = module.id
  and class.slug = 'mission-vision-values'
  and module.slug in ('mission', 'vision', 'values');
