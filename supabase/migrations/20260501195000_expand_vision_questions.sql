set search_path = public;

do $$
declare
  vision_module_id uuid;
begin
  select m.id
  into vision_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug = 'vision'
  limit 1;

  if vision_module_id is null then
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    vision_module_id,
    jsonb_build_object(
      'title', 'Vision Statement',
      'roadmap_section', 'mission_vision_values',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'vision_intro',
          'label', 'Defining your vision',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your vision describes the future you are working toward.\n\nIf your origin story explains where this work comes from, your need statement defines the problem, and your mission describes what you do and the difference you make, your vision answers: what does the world look like if your work succeeds, what is different for the people and communities you serve, and what long-term change are you working toward?\n\nA strong vision does not describe programs or activities. It describes the end result: a desired future that is meaningfully different from what exists today.'
        ),
        jsonb_build_object(
          'name', 'vision_realistic_aspirational_intro',
          'label', 'Realistic or aspirational vision',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'There are two valid approaches to vision statements.\n\nA realistic vision describes a concrete, measurable future outcome, such as 200 quality jobs created along 61st Street.\n\nAn aspirational vision describes a broader, values-driven future, such as no family will be left to suffer alone.\n\nBoth approaches are valid, but choose intentionally. A realistic vision provides clarity and measurable direction. An aspirational vision provides inspiration and long-term purpose.'
        ),
        jsonb_build_object(
          'name', 'vision_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Your responses will later help generate draft vision statements that reflect your perspective and aspirations for the future.'
        ),
        jsonb_build_object(
          'name', 'vision_people_intro',
          'label', 'Section 1 — The future for the people you serve',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Start with the future you want for the people you serve: the opportunities they will have, the challenges they will no longer face, and how daily life will improve.'
        ),
        jsonb_build_object(
          'name', 'vision_people_difference',
          'label', 'If your work is successful, what will be different in the lives of the people you serve?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about opportunities they will have, challenges they will no longer face, and how their daily lives will improve.',
          'placeholder', 'Describe what changes for the people you serve...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_individual_success',
          'label', 'What does success look like for individuals?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what success looks like at the individual level...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_community_intro',
          'label', 'Section 2 — The future for the community',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Now widen the lens to the broader community or environment, including neighborhoods, systems, culture, or norms.'
        ),
        jsonb_build_object(
          'name', 'vision_community_difference',
          'label', 'What will be different in the broader community or environment?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about neighborhoods, systems such as education, workforce, or health, and culture or norms.',
          'placeholder', 'Describe what changes in the broader community...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_visible_changes',
          'label', 'What positive changes would others be able to see or feel?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the visible or felt changes others would notice...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_long_term_intro',
          'label', 'Section 3 — Long-term change',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Look beyond the near term and name the lasting change you hope your work can help create.'
        ),
        jsonb_build_object(
          'name', 'vision_lasting_change',
          'label', 'Looking 5-10 years ahead, what lasting change do you hope to see?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the long-term change you hope to see...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_scaled_impact',
          'label', 'If your work scaled or grew, what larger impact could it have?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the larger impact your work could have over time...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_problem_removed_intro',
          'label', 'Section 4 — Removing the problem',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Connect the vision back to the need statement by naming what would be different if the problem were meaningfully addressed.'
        ),
        jsonb_build_object(
          'name', 'vision_need_addressed',
          'label', 'If the problem you described in your need statement were addressed, what would be different?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what changes if the need is meaningfully addressed...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_problem_lower_level',
          'label', 'What would no longer exist, or would exist at a much lower level?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what decreases, disappears, or becomes far less common...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_type_intro',
          'label', 'Section 5 — Choosing your vision type',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Choose intentionally between a concrete measurable vision and a broader values-driven vision.'
        ),
        jsonb_build_object(
          'name', 'vision_type',
          'label', 'Do you want your vision to be more concrete and measurable, or broad and values-driven?',
          'type', 'select',
          'screen', 'question',
          'options', jsonb_build_array(
            'Concrete and measurable',
            'Broad and values-driven',
            'A blend of both'
          ),
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_type_reason',
          'label', 'Why does this approach fit your work?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Explain why this kind of vision fits your work and audience...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_pulling_together_intro',
          'label', 'Section 6 — Pulling it together',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Bring the answers together into a natural description of the future you are working toward.'
        ),
        jsonb_build_object(
          'name', 'vision_pulling_together',
          'label', 'In your own words, describe the future you are working toward.',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Speak this naturally in 1-2 paragraphs.',
          'placeholder', 'Describe the future you are working toward...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_ai_prompt_intro',
          'label', 'What happens next',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your responses can later be used to generate four vision statement options that describe a desired future meaningfully different from today, focus on what is different for people and communities, reflect long-term change, and align with your selected vision type.'
        ),
        jsonb_build_object(
          'name', 'vision_final_statement',
          'label', 'Write or paste your preferred vision statement draft.',
          'type', 'long_text',
          'org_key', 'vision',
          'screen', 'question',
          'description', 'Aim for one clear sentence focused on the desired future.',
          'placeholder', 'Write a clear, compelling vision statement...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'vision_examples_intro',
          'label', 'Examples to notice',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Strong vision statements describe a future state, not current work. They reflect a desired future different from today, focus on people and outcomes, choose realistic or aspirational intentionally, and stay clear and concise.'
        )
      )
    )::jsonb,
    true
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;

  update assignment_submissions
  set answers = answers
    || case
      when answers ? 'vision' and not answers ? 'vision_final_statement'
        then jsonb_build_object('vision_final_statement', answers->'vision')
      else '{}'::jsonb
    end
    || case
      when answers ? 'vision_personal' and not answers ? 'vision_pulling_together'
        then jsonb_build_object('vision_pulling_together', answers->'vision_personal')
      else '{}'::jsonb
    end
  where module_id = vision_module_id;
end $$;
