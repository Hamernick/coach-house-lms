set search_path = public;

do $$
declare
  need_module_id uuid;
begin
  select m.id
  into need_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'what-is-the-need'
  limit 1;

  if need_module_id is null then
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    need_module_id,
    jsonb_build_object(
      'title', 'Need Statement',
      'roadmap_section', 'need',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'need_statement_intro',
          'label', 'Need Statement',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Now that you have reflected on your story and your why, define the problem your work is responding to.\n\nStrong nonprofit leaders describe a problem with clarity before proposing a solution. That clarity helps funders, partners, and community members understand what is at stake.\n\nA strong Need Statement answers three questions: who has the need, what problem they face, and how serious or widespread the problem is.\n\nFor this exercise, focus only on the problem. Do not describe your organization, your program, or your solution yet.'
        ),
        jsonb_build_object(
          'name', 'need_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Some answers may be a few sentences; others may be longer reflections. The goal is to give the future AI drafting step rich, authentic input that reflects your real experience, perspective, and voice.'
        ),
        jsonb_build_object(
          'name', 'need_population_intro',
          'label', 'Section 1 — Who is experiencing the problem',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Start by identifying the specific people, community, or population experiencing the problem and the rough scale of the need.'
        ),
        jsonb_build_object(
          'name', 'need_who',
          'label', 'Who specifically is experiencing this problem?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Be as specific as possible. Consider age group, community, identity, situation, or shared experience. Examples: young people in Roseland exposed to gun violence; immigrant mothers navigating school systems and social services; children living in older housing with lead exposure; seniors experiencing isolation and limited digital literacy; young adults returning from incarceration and struggling to find stable work.',
          'placeholder', 'Describe the specific people or communities impacted...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_location',
          'label', 'Where does this problem occur?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Name the neighborhood, city, school system, region, or specific community where this problem shows up.',
          'placeholder', 'Describe the place or community context where the problem occurs...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_scale',
          'label', 'How many people do you believe are affected by this problem?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'You do not need exact numbers yet. Focus on the scale: dozens, hundreds, thousands, a percentage of a group, or a large portion of a neighborhood.',
          'placeholder', 'Estimate the scale of the problem in plain language...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_problem_intro',
          'label', 'Section 2 — What the problem is',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Describe the condition people are facing and the root causes or factors that contribute to it.'
        ),
        jsonb_build_object(
          'name', 'need_problem',
          'label', 'What exactly is the problem this group is experiencing?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Describe the condition people are facing in plain terms.',
          'placeholder', 'Explain the challenge in clear, concrete language...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_contributing_factors',
          'label', 'What factors contribute to this problem?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about root causes such as lack of access to services, economic barriers, trauma exposure, unstable housing, language barriers, or other structural conditions.',
          'placeholder', 'List the root causes or contributing factors...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_daily_life',
          'label', 'How does this problem show up in people''s day-to-day lives?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Describe what people are actually experiencing because of the problem.',
          'placeholder', 'Share the daily realities, pressures, or consequences people experience...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_impact_intro',
          'label', 'Section 3 — Long-term impact',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Name what happens if the problem continues without change. Consider the impact on individuals, families, neighborhoods, broader communities, or the city.'
        ),
        jsonb_build_object(
          'name', 'need_consequence',
          'label', 'What happens if this problem continues without change?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about long-term effects such as educational setbacks, health consequences, cycles of poverty, increased violence, social isolation, or limited economic mobility.',
          'placeholder', 'Describe what gets worse and what is at stake if nothing changes...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_data_intro',
          'label', 'Section 4 — Understanding the scale using data',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Now begin identifying data that can demonstrate how serious or widespread the issue is.\n\nYou do not need to find the data yourself yet. Use AI to help identify the types of data or statistics that would support the need, examples of specific metrics, possible sources, and qualitative or quantitative evidence to look for. Do not make up statistics.'
        ),
        jsonb_build_object(
          'name', 'need_data_points',
          'label', 'What data, metrics, or sources could help demonstrate the scale of this issue?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Capture the types of data or statistics that would help, examples of metrics that would strengthen the need statement, where the data might be found, and any qualitative or quantitative evidence that speaks to the problem.',
          'placeholder', 'Paste AI guidance or your notes about metrics, sources, and evidence to look for...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'need_next_steps_intro',
          'label', 'What happens next',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'After these questions, your responses can be combined into multiple 2-3 paragraph need statement drafts. You will select the version that best captures the problem, then refine it into shorter versions for proposals, decks, and conversations.'
        )
      )
    )::jsonb,
    true
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;
end $$;
