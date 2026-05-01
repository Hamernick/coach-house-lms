set search_path = public;

do $$
declare
  strategic_foundations_class_id uuid;
  who_we_serve_module_id uuid;
begin
  select id
  into strategic_foundations_class_id
  from classes
  where slug = 'strategic-foundations'
  limit 1;

  if strategic_foundations_class_id is null then
    return;
  end if;

  insert into modules (
    class_id,
    idx,
    slug,
    title,
    description,
    content_md,
    is_published
  )
  values (
    strategic_foundations_class_id,
    5,
    'who-we-serve',
    'Who We Serve',
    'Clarify the specific people your work is focused on serving.',
    null,
    true
  )
  on conflict (class_id, slug) do update set
    idx = excluded.idx,
    title = excluded.title,
    description = excluded.description,
    is_published = excluded.is_published
  returning id into who_we_serve_module_id;

  insert into module_content (module_id, resources, homework)
  values (
    who_we_serve_module_id,
    '[]'::jsonb,
    jsonb_build_array(
      jsonb_build_object(
        'label', 'Use this section to clearly describe the population you are trying to reach, including their context, strengths, barriers, and boundaries.'
      )
    )
  )
  on conflict (module_id) do update set
    homework = excluded.homework;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    who_we_serve_module_id,
    jsonb_build_object(
      'title', 'Who We Serve',
      'roadmap_section', 'who_we_serve',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'who_serve_intro',
          'label', 'Who We Serve',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'This section builds on your Need Statement by helping you clearly define who your work is focused on.\n\nWhile your Need Statement describes who is experiencing the problem, this exercise sharpens that into a more precise understanding of the specific people you are trying to reach and serve.\n\nThere is no formal training video for this section, but it is an important step in strengthening your Strategic Roadmap. Clarity on who you serve helps you design stronger programs, communicate clearly with funders and partners, and focus your efforts where they can have the greatest impact.'
        ),
        jsonb_build_object(
          'name', 'who_serve_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Your responses will later help generate a clear Who We Serve statement for your Strategic Roadmap.'
        ),
        jsonb_build_object(
          'name', 'who_serve_population_intro',
          'label', 'Section 1 — Defining your core population',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Start by naming the primary audience or population you are trying to reach, including key characteristics and location.'
        ),
        jsonb_build_object(
          'name', 'who_serve_primary_population',
          'label', 'Who is your primary audience or population?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Be as specific as possible. Examples: youth ages 14-18 in Roseland, single mothers on the South Side of Chicago, returning citizens within two years of release, or seniors living alone in urban neighborhoods.',
          'placeholder', 'Describe the specific people you are trying to reach...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_characteristics',
          'label', 'What are the key characteristics of this group?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Consider age range, gender if relevant, cultural or community identity, life stage, and shared experiences.',
          'placeholder', 'List the characteristics that help define this group...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_location',
          'label', 'Where are they located?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Examples include a specific neighborhood, city or region, school system, or community network.',
          'placeholder', 'Describe the geography, system, or community network...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_context_intro',
          'label', 'Section 2 — Lived experience and context',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Describe what this group is experiencing in daily life, including both challenges and strengths.'
        ),
        jsonb_build_object(
          'name', 'who_serve_daily_life',
          'label', 'What is this group experiencing in their daily lives?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about challenges they face, environments they navigate, and pressures or realities that shape their decisions.',
          'placeholder', 'Describe the daily context and realities this group is navigating...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_patterns',
          'label', 'What are some common experiences or patterns you see within this group?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe repeated experiences, themes, or patterns you have noticed...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_strengths',
          'label', 'What strengths or assets does this group already have?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Avoid defining people only by challenges. Examples: resilience, strong family ties, cultural identity, informal support networks, creativity, or entrepreneurship.',
          'placeholder', 'Name the strengths, assets, and forms of resilience this group already carries...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_barriers_intro',
          'label', 'Section 3 — Barriers and gaps',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Identify the barriers this group faces and why existing systems or services are not fully reaching them.'
        ),
        jsonb_build_object(
          'name', 'who_serve_barriers',
          'label', 'What barriers does this group face that make it difficult to access opportunities or support?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Examples include transportation, cost, language, trust in institutions, or lack of awareness of available resources.',
          'placeholder', 'List the practical, social, institutional, or financial barriers...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_system_gaps',
          'label', 'Why are existing systems or services not fully reaching or supporting this group?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the gaps between this group and existing supports...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_focus_intro',
          'label', 'Section 4 — Focus and boundaries',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Clarify your focus inside the larger population and name who you are not trying to serve right now so the work does not become too broad.'
        ),
        jsonb_build_object(
          'name', 'who_serve_specific_focus',
          'label', 'Within the larger population, is there a more specific group you feel most called to focus on?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the narrower focus that feels most aligned or urgent...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_out_of_scope',
          'label', 'Are there groups you are not trying to serve right now?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'This helps clarify focus and avoid overextension.',
          'placeholder', 'Name any groups, geographies, or needs outside your current focus...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_clarity_intro',
          'label', 'Section 5 — Clarity statement',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Bring the answers together into a natural first draft. This does not need to be polished.'
        ),
        jsonb_build_object(
          'name', 'who_serve_clarity_statement',
          'label', 'In your own words, describe the people you are trying to serve.',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Aim for 1-2 paragraphs, spoken naturally.',
          'placeholder', 'Describe who you serve in a clear, natural paragraph or two...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'who_serve_ai_prompt_intro',
          'label', 'What happens next',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your responses can later be used to generate three versions of a Who We Serve statement: one paragraph, 3-4 sentences, and 1-2 sentences. Each version should define the population, include relevant characteristics, reflect both challenges and strengths, and avoid describing programs or solutions.'
        ),
        jsonb_build_object(
          'name', 'who_serve_examples_intro',
          'label', 'Examples to notice',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Strong Who We Serve statements are specific, include context beyond demographics, describe both challenges and strengths, and do not describe programs or solutions.'
        )
      )
    )::jsonb,
    true
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;
end $$;
