set search_path = public;

-- Roadmap homework modules should turn green when the learner submits the
-- assignment. Existing submitted rows are also picked up by progress summary
-- code once these assignment flags are true.
update module_assignments ma
set complete_on_submit = true
from modules m
join classes c on c.id = m.class_id
where ma.module_id = m.id
  and (
    (
      c.slug = 'strategic-foundations'
      and m.slug in ('what-is-the-need', 'ai-the-need')
    )
    or (
      c.slug = 'mission-vision-values'
      and m.slug in ('mission', 'vision', 'values')
    )
  );

-- Reassert the Mission / Vision / Values assignment schemas in production so
-- stale rows do not show only a single prompt in the accelerator module frame.
with mvv_modules as (
  select m.id, m.slug
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug in ('mission', 'vision', 'values')
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  mv.id,
  case
    when mv.slug = 'mission' then
      jsonb_build_object(
        'title', 'Mission statement',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'mission_intro',
            'label', 'Draft Mission Statement',
            'type', 'subtitle',
            'description', 'Collect examples you admire, then draft a starting point you can refine later.'
          ),
          jsonb_build_object(
            'name', 'mission_examples',
            'label', 'Six favorite mission statements',
            'type', 'long_text',
            'placeholder', 'List six mission statements you admire.'
          ),
          jsonb_build_object(
            'name', 'mission',
            'label', 'Mission statement',
            'type', 'long_text',
            'org_key', 'mission',
            'placeholder', 'Write a clear, specific statement of why your organization exists.'
          )
        )
      )
    when mv.slug = 'vision' then
      jsonb_build_object(
        'title', 'Vision statement',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'vision_intro',
            'label', 'Draft Vision Statement',
            'type', 'subtitle',
            'description', 'Are you choosing a practical near-future vision or a bold, aspirational one? Draft a couple of options you can revisit as you progress.'
          ),
          jsonb_build_object(
            'name', 'vision_personal',
            'label', 'In a few sentences, how would you describe your personal vision statement?',
            'type', 'long_text',
            'placeholder', 'Describe your personal vision in a few sentences.'
          ),
          jsonb_build_object(
            'name', 'vision_examples',
            'label', 'Six favorite vision statements',
            'type', 'long_text',
            'placeholder', 'List six vision statements you admire.'
          ),
          jsonb_build_object(
            'name', 'vision',
            'label', 'Vision statement',
            'type', 'long_text',
            'org_key', 'vision',
            'placeholder', 'Describe the future you are working toward if your mission succeeds.'
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Values',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'values_intro',
            'label', 'Draft Core Values',
            'type', 'subtitle',
            'description', 'Draft your core values, focusing on the principles you want to consistently model as you grow.'
          ),
          jsonb_build_object(
            'name', 'values_personal',
            'label', 'In a few words, how would you describe your personal core values?',
            'type', 'short_text',
            'placeholder', 'List a few words or phrases that describe your personal values.'
          ),
          jsonb_build_object(
            'name', 'values_examples',
            'label', 'Six favorite values statements',
            'type', 'long_text',
            'placeholder', 'List six values statements you admire.'
          ),
          jsonb_build_object(
            'name', 'values',
            'label', 'Define your core organizational values',
            'type', 'long_text',
            'org_key', 'values',
            'placeholder', 'List the principles you are unwilling to compromise and the culture you want to build.'
          )
        )
      )
  end::jsonb,
  true
from mvv_modules mv
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;
