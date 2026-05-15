set search_path = public;

do $$
declare
  mission_module_id uuid;
begin
  select m.id
  into mission_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug = 'mission'
  limit 1;

  if mission_module_id is null then
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    mission_module_id,
    jsonb_build_object(
      'title', 'Mission Statement',
      'roadmap_section', 'mission_vision_values',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'mission_intro',
          'label', 'Defining your mission',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your mission is a clear, concise statement of what you do and the difference your work makes.\n\nIf your origin story explains where this work comes from and your need statement explains the problem, your mission answers: what do you do, who do you do it for, and what difference does your work make?\n\nStrong nonprofit missions do not just describe activity. They describe impact: not just what you do, but how the world is different as a result.\n\nA strong mission is clear, specific, grounded in real work, and focused on the difference being made in people''s lives or communities.'
        ),
        jsonb_build_object(
          'name', 'mission_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Some answers may be a few sentences; others may be longer reflections. Your responses will later help generate draft mission statements that reflect your real experience, perspective, and intentions.'
        ),
        jsonb_build_object(
          'name', 'mission_what_you_do_intro',
          'label', 'Section 1 — What you do',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Describe your work in simple, direct terms and name the main activities or approaches you plan to use.'
        ),
        jsonb_build_object(
          'name', 'mission_work_in_world',
          'label', 'What are you trying to do in the world?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Describe your work in simple, direct terms.',
          'placeholder', 'Describe what you are trying to do in plain language...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_main_activities',
          'label', 'What are the main activities or approaches you plan to use?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Examples include mentorship, education or training, workforce development, counseling or healing support, community-building, and advocacy.',
          'placeholder', 'List the activities, supports, or approaches you expect to use...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_who_for_intro',
          'label', 'Section 2 — Who you do it for',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Connect your mission to the people you serve. Stay consistent with your Who We Serve section.'
        ),
        jsonb_build_object(
          'name', 'mission_who_for',
          'label', 'Who are you doing this work for?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Be consistent with your Who We Serve section.',
          'placeholder', 'Describe the people or community your work is focused on...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_group_importance',
          'label', 'What makes this group important to focus on?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Explain why this group, community, or population matters for your work...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_difference_intro',
          'label', 'Section 3 — The difference you make',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Move beyond activity and describe the change your work creates in people''s lives, families, or communities.'
        ),
        jsonb_build_object(
          'name', 'mission_difference',
          'label', 'What difference does your work make in people''s lives?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about what is different because your work exists, what changes for individuals or families, and what improves in the community.',
          'placeholder', 'Describe the changes your work is meant to create...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_missing_without_work',
          'label', 'If your work did not exist, what would be missing?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the gap your work fills and what would be absent without it...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_success_3_years',
          'label', 'If your work is successful, what will be different 3-5 years from now?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what changes over time if the work succeeds...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_approach_distinctiveness_intro',
          'label', 'Section 4 — Your approach and distinctiveness',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Name what is distinctive about how you approach the work and why that approach can be effective.'
        ),
        jsonb_build_object(
          'name', 'mission_unique_approach',
          'label', 'What is unique about how you approach this work?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Examples include lived experience, a community-based approach, culturally responsive work, long-term relationships instead of short-term programs, or combining multiple supports.',
          'placeholder', 'Describe what makes your approach different or especially suited to this work...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_effective_approach',
          'label', 'Why do you believe your approach will be effective?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Explain why this approach can work for the people and problem you are focused on...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_pulling_together_intro',
          'label', 'Section 5 — Pulling it together',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Bring together what you do, who you do it for, and the difference it makes. This can be a natural 1-2 paragraph draft.'
        ),
        jsonb_build_object(
          'name', 'mission_pulling_together',
          'label', 'In your own words, describe what you do, for whom, and the difference it makes.',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Speak this naturally in 1-2 paragraphs.',
          'placeholder', 'Describe your work, who it serves, and the impact it is meant to create...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_ai_prompt_intro',
          'label', 'What happens next',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your responses can later be used to generate four mission statement options, each clearly describing what the organization does, who it serves, and the difference or impact the work makes. After choosing a preferred version, refine it into a concise public mission statement.'
        ),
        jsonb_build_object(
          'name', 'mission_final_statement',
          'label', 'Write or paste your preferred mission statement draft.',
          'type', 'long_text',
          'org_key', 'mission',
          'screen', 'question',
          'description', 'Aim for one clear sentence. This can evolve later.',
          'placeholder', 'Write a clear, specific mission statement...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'mission_examples_intro',
          'label', 'Examples to notice',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Strong mission statements clearly describe what the organization does, identify who is served, communicate the difference being made, stay concise and easy to understand, and avoid vague or overly broad language.'
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
      when answers ? 'mission' and not answers ? 'mission_final_statement'
        then jsonb_build_object('mission_final_statement', answers->'mission')
      else '{}'::jsonb
    end
  where module_id = mission_module_id;
end $$;
