set search_path = public;

do $$
declare
  values_module_id uuid;
begin
  select m.id
  into values_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug = 'values'
  limit 1;

  if values_module_id is null then
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    values_module_id,
    jsonb_build_object(
      'title', 'Core Values',
      'roadmap_section', 'mission_vision_values',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'values_intro',
          'label', 'Defining your core values',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your core values define how your organization operates and makes decisions.\n\nIf your origin story explains where this work comes from, your need statement defines the problem, your mission describes what you do and the difference you make, and your vision defines the future you are working toward, your values answer: how do you show up in this work, what principles guide your decisions, and what does it look like to do this work well?\n\nCore values are deeply held beliefs: the principles you are unwilling to compromise, even under pressure.'
        ),
        jsonb_build_object(
          'name', 'values_quality_intro',
          'label', 'What makes a value real',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Core values are not aspirational slogans or marketing language. They should be enduring, authentic, behavioral, and distinctive.\n\nA useful value reflects what you truly believe, shows up in how you act and make decisions, and differentiates how your organization operates from others.'
        ),
        jsonb_build_object(
          'name', 'values_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Your responses will later help generate a set of core values that reflect your beliefs, standards, and approach to this work.'
        ),
        jsonb_build_object(
          'name', 'values_deep_beliefs_intro',
          'label', 'Section 1 — Your deepest beliefs',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Start by naming what you believe deeply about the work and the people you serve.'
        ),
        jsonb_build_object(
          'name', 'values_deep_beliefs',
          'label', 'What do you believe deeply about this work and the people you serve?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about what you know to be true from experience, what others often get wrong, and what you feel strongly about even when it is not easy.',
          'placeholder', 'Describe the beliefs that sit underneath your work...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_hard_principles',
          'label', 'What principles would you hold onto, even if they made your work harder?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'This is a key Good to Great test of real values.',
          'placeholder', 'Name the principles you would keep even under pressure...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_stand_for_intro',
          'label', 'Section 2 — What you stand for and against',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Real values often become clear when you name what you are committed to doing differently.'
        ),
        jsonb_build_object(
          'name', 'values_stand_for',
          'label', 'What do you stand for in how this work should be done?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what you stand for in how the work is carried out...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_do_differently',
          'label', 'What have you seen done poorly that you are committed to doing differently?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Real values often emerge from frustration with what does not work.',
          'placeholder', 'Describe what you have seen done poorly and how you want to operate differently...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_refuse_accept',
          'label', 'What would you push back on or refuse to accept in your field?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Name the patterns, shortcuts, or compromises you would refuse...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_behavior_intro',
          'label', 'Section 3 — Behavior and standards',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Values must show up in action. Describe the behaviors, treatment, and standards that make the values real.'
        ),
        jsonb_build_object(
          'name', 'values_best_operating',
          'label', 'What does it look like when your organization is operating at its best?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what people would see, feel, and experience when the organization is at its best...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_treatment',
          'label', 'How should people be treated in your work?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Consider participants, staff, partners, and community members.',
          'placeholder', 'Describe the standard of treatment you want to uphold...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_non_negotiable_behaviors',
          'label', 'What behaviors are non-negotiable?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'List the behaviors and standards that must be consistently protected...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_pressure_intro',
          'label', 'Section 4 — Decision-making under pressure',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Values matter most when decisions are hard. Name the principles that guide tradeoffs and boundaries.'
        ),
        jsonb_build_object(
          'name', 'values_decision_principles',
          'label', 'When faced with a difficult decision, what principles will guide your choices?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the principles you would use when the decision is hard...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_never_do',
          'label', 'What would you never do, even if it would lead to more funding, growth, or visibility?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'This question often reveals the most important values.',
          'placeholder', 'Name the compromises you would not make...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_pulling_together_intro',
          'label', 'Section 5 — Pulling it together',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Bring the answers together into a natural description of the principles that should guide the organization.'
        ),
        jsonb_build_object(
          'name', 'values_pulling_together',
          'label', 'In your own words, describe the principles that should guide your organization.',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Speak this naturally in 1-2 paragraphs.',
          'placeholder', 'Describe the principles that should guide the organization...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_ai_prompt_intro',
          'label', 'What happens next',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your responses can later be used to generate 5-7 core values. Each value should include a concise title and a brief description explaining what the value means in practice.'
        ),
        jsonb_build_object(
          'name', 'values_final_set',
          'label', 'Write or paste your preferred core values set.',
          'type', 'long_text',
          'org_key', 'values',
          'screen', 'question',
          'description', 'Include 5-7 values with a short title and practical description for each.',
          'placeholder', 'List each core value with a brief practical description...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'values_examples_intro',
          'label', 'Examples to notice',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Strong core values reflect deep beliefs, describe how the organization behaves, guide real decisions under pressure, and stay specific and meaningful rather than generic.'
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
      when answers ? 'values' and not answers ? 'values_final_set'
        then jsonb_build_object('values_final_set', answers->'values')
      else '{}'::jsonb
    end
    || case
      when answers ? 'values_personal' and not answers ? 'values_deep_beliefs'
        then jsonb_build_object('values_deep_beliefs', answers->'values_personal')
      else '{}'::jsonb
    end
  where module_id = values_module_id;
end $$;
