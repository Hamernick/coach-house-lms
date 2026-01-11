set search_path = public;

do $$
declare
  origin_module_id uuid;
begin
  select m.id
  into origin_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'start-with-your-why'
  limit 1;

  if origin_module_id is null then
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    origin_module_id,
    jsonb_build_object(
      'title', 'Origin Story Worksheet',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'origin_intro',
          'label', 'Origin Story',
          'type', 'subtitle',
          'description', 'Answer the questions below to capture the raw material for your origin story.'
        ),
        jsonb_build_object(
          'name', 'origin_home',
          'label', 'Where are you from?',
          'type', 'short_text',
          'description', 'This can be a place, a community, a family context, or a formative environment.',
          'placeholder', 'City, region, or community you call home.',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_background',
          'label', 'What experiences in your life led to your concern about and commitment to addressing the problem you are working on?',
          'type', 'long_text',
          'description', 'Moments, patterns, or lived experiences that shaped how you see this issue.',
          'placeholder', 'List the moments or patterns that shaped your commitment.',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_why_now',
          'label', 'Why do you believe this work matters now?',
          'type', 'long_text',
          'placeholder', 'Share why this work is urgent right now.',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_why_called',
          'label', 'Why do you feel called to be part of it?',
          'type', 'long_text',
          'placeholder', 'Describe why you feel called to this work.',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_story_draft',
          'label', 'Origin story draft (optional)',
          'type', 'long_text',
          'org_key', 'boilerplate',
          'description', 'Optional: pull your responses together into a narrative you can refine later.',
          'placeholder', 'Write or paste a draft if you have one.',
          'required', false
        )
      )
    )::jsonb,
    true
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;

  update assignment_submissions
  set answers =
    (answers - 'origin_personal_why')
    || jsonb_build_object(
      'origin_why_now', answers->'origin_personal_why',
      'origin_why_called', answers->'origin_personal_why'
    )
  where module_id = origin_module_id
    and answers ? 'origin_personal_why';
end $$;
