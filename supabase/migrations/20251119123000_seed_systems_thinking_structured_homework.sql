set search_path = public;

do $$
declare
  systems_module_id uuid;
begin
  select m.id
  into systems_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change'
    and m.slug = 'systems-thinking'
  limit 1;

  if systems_module_id is null then
    raise notice 'Systems Thinking module not found; skipping structured homework seed.';
    return;
  end if;

  insert into module_content (module_id)
  values (systems_module_id)
  on conflict (module_id) do nothing;

  update modules
  set
    description = 'Applying a systems thinking approach to evaluate the complexities in which your program seeks to achieve its purpose. You’ll learn to view your issue through a systems lens, revealing the patterns and structures that must change for your program to create lasting impact.',
    content_md = null
  where id = systems_module_id;

  update module_content
  set
    resources = jsonb_build_array(
      jsonb_build_object(
        'label', 'Systems Thinking Questions',
        'url', ''
      )
    ),
    homework = '[]'::jsonb
  where module_id = systems_module_id;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    systems_module_id,
    jsonb_build_object(
      'title', 'Systems Thinking Worksheet',
      'fields', jsonb_build_array(
        -- 1. Purpose & Problem Definition
        jsonb_build_object(
          'name', 'st_purpose_intro',
          'label', 'Purpose & problem definition',
          'type', 'subtitle',
          'description', 'Ground your work in a clear understanding of the problem and who defines it.'
        ),
        jsonb_build_object(
          'name', 'st_problem',
          'label', 'What problem are we actually trying to solve?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_problem_depth',
          'label', 'How do we know this is the real problem and not a symptom of something deeper?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_problem_owners',
          'label', 'Who defines the problem, and who is most affected by it?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_problem_assumptions',
          'label', 'What assumptions are we making about the causes of this problem?',
          'type', 'long_text'
        ),
        -- 2. Stakeholders & Interconnections
        jsonb_build_object(
          'name', 'st_stakeholders_intro',
          'label', 'Stakeholders & interconnections',
          'type', 'subtitle',
          'description', 'Map who is involved and how they relate to one another.'
        ),
        jsonb_build_object(
          'name', 'st_stakeholders',
          'label', 'Who are all the stakeholders (internal and external) connected to this issue?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_stakeholder_motivations',
          'label', 'How do their motivations, incentives, and constraints influence the system?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_relationships',
          'label', 'What relationships exist between these stakeholders? Where are they weak or strong?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_benefit_harm',
          'label', 'Who benefits from the system staying the way it is? Who is harmed?',
          'type', 'long_text'
        ),
        -- 3. Inputs, Activities, and Flows
        jsonb_build_object(
          'name', 'st_flows_intro',
          'label', 'Inputs, activities, and flows',
          'type', 'subtitle',
          'description', 'Trace the resources, information, and work moving through your system.'
        ),
        jsonb_build_object(
          'name', 'st_inputs',
          'label', 'What resources, people, or information flow into our system?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_bottlenecks',
          'label', 'Where are the bottlenecks, delays, or friction points?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_control',
          'label', 'Who controls the critical resources or information flows?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_workflow_breakdowns',
          'label', 'How does work move through our organization, and where does it break down?',
          'type', 'long_text'
        ),
        -- 4. Patterns, Trends, and Feedback Loops
        jsonb_build_object(
          'name', 'st_patterns_intro',
          'label', 'Patterns, trends, and feedback loops',
          'type', 'subtitle',
          'description', 'Look beyond single events to see repeating patterns and feedback loops.'
        ),
        jsonb_build_object(
          'name', 'st_patterns',
          'label', 'What patterns or trends do we see over time (not just in single events)?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_reinforcing_loops',
          'label', 'What are reinforcing (snowballing) loops that make a problem grow?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_balancing_loops',
          'label', 'What are balancing (stabilizing) loops that slow or contain change?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_repeating_behaviors',
          'label', 'Which behaviors repeat, and what triggers them?',
          'type', 'long_text'
        ),
        -- 5. Root Causes & Underlying Dynamics
        jsonb_build_object(
          'name', 'st_root_causes_intro',
          'label', 'Root causes & underlying dynamics',
          'type', 'subtitle',
          'description', 'Surface the deeper structures and incentives holding the problem in place.'
        ),
        jsonb_build_object(
          'name', 'st_structural_factors',
          'label', 'What structural factors are keeping this problem in place (policies, culture, economics)?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_mental_models',
          'label', 'What mental models (beliefs, assumptions) drive behaviors in this system?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_misaligned_incentives',
          'label', 'Where do we see misaligned incentives?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_problem_gone',
          'label', 'What would make this problem go away permanently?',
          'type', 'long_text'
        ),
        -- 6. Boundaries & Context
        jsonb_build_object(
          'name', 'st_boundaries_intro',
          'label', 'Boundaries & context',
          'type', 'subtitle',
          'description', 'Clarify what is inside your system and how the wider context shapes it.'
        ),
        jsonb_build_object(
          'name', 'st_boundaries',
          'label', 'What are the boundaries of the system we’re addressing — and what’s outside them?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_environment',
          'label', 'How does the larger environment (policy, funding, community, culture) shape the system?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_history',
          'label', 'What historical events created today’s dynamics?',
          'type', 'long_text'
        ),
        -- 7. Leverage Points
        jsonb_build_object(
          'name', 'st_leverage_intro',
          'label', 'Leverage points',
          'type', 'subtitle',
          'description', 'Identify places where small changes could unlock outsized impact.'
        ),
        jsonb_build_object(
          'name', 'st_small_changes',
          'label', 'Where could a small change create a disproportionately big impact?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_upstream',
          'label', 'What upstream interventions could reduce downstream problems?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_assets',
          'label', 'What existing strengths or assets can we amplify?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_rules_norms',
          'label', 'What rules, processes, or norms could we change that would unlock improvement?',
          'type', 'long_text'
        ),
        -- 8. Unintended Consequences
        jsonb_build_object(
          'name', 'st_unintended_intro',
          'label', 'Unintended consequences',
          'type', 'subtitle',
          'description', 'Stress-test your ideas by exploring what might go wrong or shift elsewhere.'
        ),
        jsonb_build_object(
          'name', 'st_break_disrupt',
          'label', 'If we implement this solution, what might we unintentionally break or disrupt?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_make_worse',
          'label', 'Could our intervention make anything worse for certain groups?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_adaptation',
          'label', 'How might people adapt to or work around the changes?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_create_more_of',
          'label', 'What could this create more of (bureaucracy, demand, dependency, etc.)?',
          'type', 'long_text'
        ),
        -- 9. Equity & Power Dynamics
        jsonb_build_object(
          'name', 'st_equity_intro',
          'label', 'Equity & power dynamics',
          'type', 'subtitle',
          'description', 'Center equity by examining who holds power and who benefits.'
        ),
        jsonb_build_object(
          'name', 'st_power',
          'label', 'Who has power in this system? Who doesn’t?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_decisions',
          'label', 'How are decisions made — and who is left out of decision-making?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_beneficiaries',
          'label', 'Who benefits from our interventions? Who might be excluded?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_experience_diff',
          'label', 'How will the system be different for people with different backgrounds or identities?',
          'type', 'long_text'
        ),
        -- 10. Learning & Adaptation
        jsonb_build_object(
          'name', 'st_learning_intro',
          'label', 'Learning & adaptation',
          'type', 'subtitle',
          'description', 'Plan how you will learn from the pilot and adapt over time.'
        ),
        jsonb_build_object(
          'name', 'st_data_needs',
          'label', 'What data or feedback do we need to really understand what’s happening?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_adapt_speed',
          'label', 'How quickly do we learn from mistakes or adapt to new information?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_early_signals',
          'label', 'What early signals would show us our intervention is working (or not)?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_small_pilots',
          'label', 'How can we test ideas through small pilots before scaling them?',
          'type', 'long_text'
        ),
        -- 11. Time Horizons
        jsonb_build_object(
          'name', 'st_time_intro',
          'label', 'Time horizons',
          'type', 'subtitle',
          'description', 'Stretch your view beyond immediate fixes.'
        ),
        jsonb_build_object(
          'name', 'st_future_problem',
          'label', 'What will this problem look like in 1 year? In 5 years?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_short_vs_long',
          'label', 'Are we focused too much on short-term fixes instead of long-term solutions?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_future_decisions',
          'label', 'How will today’s decisions shape tomorrow’s system?',
          'type', 'long_text'
        ),
        -- 12. Vision & Alignment
        jsonb_build_object(
          'name', 'st_vision_intro',
          'label', 'Vision & alignment',
          'type', 'subtitle',
          'description', 'Bring it together by describing the system you want to build.'
        ),
        jsonb_build_object(
          'name', 'st_system_working_well',
          'label', 'How does this system behave when it is working well?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_shared_vision',
          'label', 'What shared vision are we trying to move the system toward?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_aligned_success',
          'label', 'What would success look like if all parts of the system were aligned?',
          'type', 'long_text'
        )
      )
    )::jsonb,
    false
  )
  on conflict (module_id) do update
    set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
end $$;
