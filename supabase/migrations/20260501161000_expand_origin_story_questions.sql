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
      'title', 'Origin Story',
      'roadmap_section', 'origin_story',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'origin_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Some answers may be a few sentences; others may be longer reflections. The goal is to give the future AI drafting step rich, authentic input that reflects your real experiences, perspective, and voice.'
        ),
        jsonb_build_object(
          'name', 'origin_start_with_why_intro',
          'label', 'Start with your why',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Every strong organization begins with a personal or community story. Before defining programs or strategies, reflect on the experiences that shaped your desire to do this work.\n\nThis exercise will help clarify your connection to the problem, the experiences that shaped your perspective, the deeper motivation behind your work, and the narrative of where this organization came from.'
        ),
        jsonb_build_object(
          'name', 'origin_roots_intro',
          'label', 'Section 1 — Roots & background',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'These questions ground your story in place, culture, and upbringing.'
        ),
        jsonb_build_object(
          'name', 'origin_roots_place',
          'label', 'Where did you grow up?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'What communities, neighborhoods, or environments shaped you?',
          'placeholder', 'Describe the places, communities, neighborhoods, or environments that shaped you…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_roots_influences',
          'label', 'What were the major influences in your early life?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'This could include family, culture, faith, school, mentors, community organizations, or other early influences.',
          'placeholder', 'List the people, institutions, traditions, or experiences that influenced you early on…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_roots_worldview',
          'label', 'Were there experiences from your childhood or early life that shaped how you see the world today?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Share the early experiences that still shape your perspective…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_problem_connection_intro',
          'label', 'Section 2 — Personal connection to the problem',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Many nonprofit founders begin their work because they have seen or experienced the problem firsthand.'
        ),
        jsonb_build_object(
          'name', 'origin_problem_issue',
          'label', 'What issue or challenge do you feel called to address?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Name the issue or challenge in plain language…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_problem_experiences',
          'label', 'What personal experiences have connected you to this issue?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the lived experiences, moments, or patterns that connected you to this issue…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_problem_witnessed',
          'label', 'Have you seen this problem affect people you care about or communities you belong to?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'If so, describe what you witnessed or experienced.',
          'placeholder', 'Share what you saw, who was affected, and how it stayed with you…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_turning_points_intro',
          'label', 'Section 3 — Turning points',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Often there are moments that transform concern into commitment.'
        ),
        jsonb_build_object(
          'name', 'origin_turning_point',
          'label', 'Was there a specific moment when you realized you wanted to do something about this issue?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the moment, what changed for you, and what you decided to do next…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_turning_people',
          'label', 'Were there key people who encouraged or inspired you to pursue this work?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Name the people, mentors, leaders, or community members who influenced your commitment…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_turning_obstacles',
          'label', 'Have you experienced hardships, obstacles, or injustices that shaped your motivation?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Share the obstacles or injustices that shaped why this work matters to you…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_calling_intro',
          'label', 'Section 4 — Your sense of calling',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Now reflect on the deeper motivation behind your work.'
        ),
        jsonb_build_object(
          'name', 'origin_calling_matter',
          'label', 'Why does this issue matter to you personally?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Explain why this issue matters to you beyond strategy or opportunity…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_calling_commitment',
          'label', 'What keeps you committed to this work even when it is difficult?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Share the beliefs, people, values, or hopes that keep you moving…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_calling_success',
          'label', 'If your work succeeds, how will people''s lives be different?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what changes for people, families, or communities when this work succeeds…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_story_to_work_intro',
          'label', 'Section 5 — Connecting your story to your work',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Finally, connect your personal story to the organization or program you want to build.'
        ),
        jsonb_build_object(
          'name', 'origin_story_leadership',
          'label', 'How does your story uniquely position you to lead this work?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Connect your background, relationships, and perspective to your ability to lead…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_story_insights',
          'label', 'What insights do you bring because of your lived experience?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the insight, sensitivity, credibility, or practical understanding you bring…',
          'required', false
        ),
        jsonb_build_object(
          'name', 'origin_story_call',
          'label', 'Describe why you feel called to do this work.',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Bring together your story, the problem, and the reason you feel called to act…',
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
  set answers = answers
    || case
      when answers ? 'origin_home' and not answers ? 'origin_roots_place'
        then jsonb_build_object('origin_roots_place', answers->'origin_home')
      else '{}'::jsonb
    end
    || case
      when answers ? 'origin_background' and not answers ? 'origin_problem_experiences'
        then jsonb_build_object('origin_problem_experiences', answers->'origin_background')
      else '{}'::jsonb
    end
    || case
      when answers ? 'origin_why_now' and not answers ? 'origin_calling_matter'
        then jsonb_build_object('origin_calling_matter', answers->'origin_why_now')
      else '{}'::jsonb
    end
    || case
      when answers ? 'origin_why_called' and not answers ? 'origin_story_call'
        then jsonb_build_object('origin_story_call', answers->'origin_why_called')
      else '{}'::jsonb
    end
  where module_id = origin_module_id;
end $$;
