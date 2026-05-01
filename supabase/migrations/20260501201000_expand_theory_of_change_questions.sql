set search_path = public;

do $$
declare
  toc_module_id uuid;
begin
  select m.id
  into toc_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change'
    and m.slug = 'theory-of-change'
  limit 1;

  if toc_module_id is null then
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    toc_module_id,
    jsonb_build_object(
      'title', 'Theory of Change',
      'roadmap_section', 'theory_of_change',
      'completion_mode', 'all_answered',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'toc_intro',
          'label', 'Developing your Theory of Change',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your Theory of Change explains in broad strokes how change is expected to happen.\n\nIf your origin story explains where this work comes from, your need statement defines the problem, your mission describes what you do and the difference you make, and your vision defines the future you are working toward, your Theory of Change lays out the logic between action, near-term change, and longer-term impact.'
        ),
        jsonb_build_object(
          'name', 'toc_framework_intro',
          'label', 'If, Then, So That',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'At Coach House, we use a simple structure: If we do this with these people, then this change will happen, so that over time these longer-term outcomes can occur.\n\nThe If statement describes the broad activity and people involved. The Then statement predicts the near-term change. The So That statement connects the work to longer-term impact, evaluation, and fundraising.'
        ),
        jsonb_build_object(
          'name', 'toc_approach_intro',
          'label', 'How to approach this exercise',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Your responses will later help generate a clear, testable Theory of Change that you can describe, predict, measure, and adjust.'
        ),
        jsonb_build_object(
          'name', 'toc_problem_context_intro',
          'label', 'Section 1 — The problem and context',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Start with the problem, the people most affected, and the conditions that keep the problem in place.'
        ),
        jsonb_build_object(
          'name', 'toc_core_problem',
          'label', 'What is the core problem you are trying to address?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Refer back to your Need Statement.',
          'placeholder', 'Describe the core problem in plain language...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_affected_population',
          'label', 'Who is most affected by this problem?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Refer back to your Who We Serve section.',
          'placeholder', 'Describe the people, group, or community most affected...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_conditions_patterns',
          'label', 'What conditions or patterns keep this problem in place?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Name the conditions, patterns, gaps, or systems that keep the problem going...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_if_intro',
          'label', 'Section 2 — IF: what you will do, with whom',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'This section defines the If statement: the core things you will do and the people who will participate in or experience the work.'
        ),
        jsonb_build_object(
          'name', 'toc_core_activities',
          'label', 'What are the core things you will do to address this problem?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Examples include mentoring, training, counseling, workforce development, community engagement, or other direct supports.',
          'placeholder', 'List the activities, supports, or approaches you expect to use...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_participants',
          'label', 'Who will participate in or experience this work?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Be specific about the population.',
          'placeholder', 'Describe who will participate in or directly experience the work...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_participant_experience',
          'label', 'What will participants actually experience?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Describe what engagement looks like in practice.',
          'placeholder', 'Describe sessions, relationships, services, supports, or other participant experiences...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_then_intro',
          'label', 'Section 3 — THEN: near-term change',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'This section defines the Then statement: the change you expect to see shortly after people engage with the work.'
        ),
        jsonb_build_object(
          'name', 'toc_near_term_change',
          'label', 'As a result of your work, what changes in the near term?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about knowledge gained, skills developed, behaviors changed, relationships built, confidence increased, or access improved.',
          'placeholder', 'Describe the near-term changes you expect...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_shortly_after_engaging',
          'label', 'What is different for participants shortly after engaging?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what is different soon after participation...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_short_term_measures',
          'label', 'What would you expect to observe or measure in the short term?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the signs, metrics, or observations that would show near-term progress...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_so_that_intro',
          'label', 'Section 4 — SO THAT: longer-term implications',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'This section connects near-term change to broader outcomes and ultimate impact.'
        ),
        jsonb_build_object(
          'name', 'toc_longer_term_leads_to',
          'label', 'If those near-term changes happen, what do they lead to over time?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe what the near-term changes should make possible over time...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_broader_outcomes',
          'label', 'What broader outcomes do you expect for individuals, families, or communities?',
          'type', 'long_text',
          'screen', 'question',
          'placeholder', 'Describe the broader outcomes you expect...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_ultimate_impact',
          'label', 'What is the ultimate impact this contributes to?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'This should connect to your Vision.',
          'placeholder', 'Describe the ultimate impact this work contributes to...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_assumptions_intro',
          'label', 'Section 5 — Your assumptions',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Every Theory of Change includes assumptions. Name why you believe this sequence will work and what you are assuming about how change happens.'
        ),
        jsonb_build_object(
          'name', 'toc_sequence_reason',
          'label', 'Why do you believe this sequence will work?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Think about lived experience, patterns you have observed, research or evidence, and what you have seen succeed or fail.',
          'placeholder', 'Explain why you believe this pathway from action to change makes sense...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_change_assumptions',
          'label', 'What assumptions are you making about how change happens?',
          'type', 'long_text',
          'screen', 'question',
          'description', 'These do not need to be perfect. Be thoughtful and honest.',
          'placeholder', 'Name the assumptions this Theory of Change depends on...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_pulling_together_intro',
          'label', 'Section 6 — Pulling it together',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Bring the answers together using the If, Then, So That structure.'
        ),
        jsonb_build_object(
          'name', 'toc_pulling_together',
          'label', 'In your own words, describe your full Theory of Change using the If, Then, So That structure.',
          'type', 'long_text',
          'screen', 'question',
          'description', 'Speak this naturally in 1-2 paragraphs.',
          'placeholder', 'If we do this with these people, then this change will happen, so that over time...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_ai_prompt_intro',
          'label', 'What happens next',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'Your responses can later be used to generate a clear structured Theory of Change with a short narrative and a breakdown of the problem, IF, THEN, and SO THAT logic.'
        ),
        jsonb_build_object(
          'name', 'toc_summary',
          'label', 'Write or paste your preferred Theory of Change.',
          'type', 'long_text',
          'org_key', 'theory_of_change',
          'roadmap_section', 'theory_of_change',
          'screen', 'question',
          'description', 'Include a polished narrative version and, when useful, a clean If, Then, So That version.',
          'placeholder', 'Write the Theory of Change you want to carry into your Strategic Roadmap...',
          'required', false
        ),
        jsonb_build_object(
          'name', 'toc_refine_prompt_intro',
          'label', 'Refining your Theory of Change',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'When refining, look for clearer cause-and-effect relationships, stronger alignment with the If, Then, So That framework, and language that is useful for program design, evaluation, and fundraising.'
        ),
        jsonb_build_object(
          'name', 'toc_examples_intro',
          'label', 'What to notice',
          'type', 'subtitle',
          'screen', 'intro',
          'description', 'The If defines your program basics. The Then defines what you think will happen as a result and what you intend to measure. The So That connects to long-term impact and creates a structure you can test and improve over time.'
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
      when answers ? 'statement_one' and not answers ? 'toc_pulling_together'
        then jsonb_build_object('toc_pulling_together', answers->'statement_one')
      else '{}'::jsonb
    end
    || case
      when answers ? 'statement_one' and not answers ? 'toc_summary'
        then jsonb_build_object('toc_summary', answers->'statement_one')
      else '{}'::jsonb
    end
  where module_id = toc_module_id;
end $$;
