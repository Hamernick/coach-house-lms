set search_path = public;

do $$
declare
  pilot_module_id uuid;
  board_module_id uuid;
begin
  select m.id
  into pilot_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'designing-your-pilot'
  limit 1;

  if pilot_module_id is not null then
    -- Update the Pilot Design worksheet labels to match the latest wording.
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      pilot_module_id,
      jsonb_build_object(
        'title', 'Pilot Program Design Worksheet',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'purpose_intro',
            'label', 'Purpose & outcomes',
            'type', 'subtitle',
            'description', 'Clarify the problem you are testing and what success will look like at the end of this pilot.'
          ),
          jsonb_build_object(
            'name', 'pilot_problem',
            'label', 'What problem are we testing a solution for?',
            'type', 'long_text',
            'placeholder', 'Describe the specific problem this pilot is designed to address.'
          ),
          jsonb_build_object(
            'name', 'pilot_short_term_outcome',
            'label', 'What is the intended short-term change?',
            'type', 'long_text',
            'placeholder', 'Name the near-term outcomes you expect to see if the pilot works.'
          ),
          jsonb_build_object(
            'name', 'pilot_success_picture',
            'label', 'What will success look like after the pilot?',
            'type', 'long_text',
            'placeholder', 'Paint a picture of what will be true for participants or your organization when the pilot succeeds.'
          ),
          jsonb_build_object(
            'name', 'people_intro',
            'label', 'People',
            'type', 'subtitle',
            'description', 'Define who is involved in the pilot: participants, staff, volunteers, and partners.'
          ),
          jsonb_build_object(
            'name', 'pilot_participants',
            'label', 'Who is the target participant?',
            'type', 'long_text',
            'placeholder', 'Eligibility criteria, demographics, and approximate number of people you will serve.'
          ),
          jsonb_build_object(
            'name', 'pilot_team',
            'label', 'Who are the staff, volunteers, or trainers needed?',
            'type', 'long_text',
            'placeholder', 'List roles, responsibilities, and any required qualifications.'
          ),
          jsonb_build_object(
            'name', 'pilot_partners',
            'label', 'Who else needs to be involved?',
            'type', 'long_text',
            'placeholder', 'Partners, advisors, or community leaders whose involvement will strengthen the pilot.'
          ),
          jsonb_build_object(
            'name', 'design_intro',
            'label', 'Activities & design',
            'type', 'subtitle',
            'description', 'Describe what happens during the pilot, where it happens, and how often.'
          ),
          jsonb_build_object(
            'name', 'pilot_activities',
            'label', 'What exactly happens in the pilot?',
            'type', 'long_text',
            'placeholder', 'Outline services, curriculum, sessions, or events that make up the pilot.'
          ),
          jsonb_build_object(
            'name', 'pilot_location',
            'label', 'Where will it take place?',
            'type', 'short_text',
            'placeholder', 'Venue, online platform, or community site.'
          ),
          jsonb_build_object(
            'name', 'pilot_frequency',
            'label', 'How often, and for how long?',
            'type', 'long_text',
            'placeholder', 'Frequency, duration, and intensity of sessions or touchpoints.'
          ),
          jsonb_build_object(
            'name', 'pilot_scale',
            'label', 'How many sessions / groups / activities?',
            'type', 'short_text',
            'placeholder', 'Approximate counts for cohorts, groups, or events.'
          ),
          jsonb_build_object(
            'name', 'resources_intro',
            'label', 'Resources & supplies',
            'type', 'subtitle',
            'description', 'List the materials, equipment, and costs required to run this pilot.'
          ),
          jsonb_build_object(
            'name', 'pilot_materials',
            'label', 'What materials or equipment are required?',
            'type', 'long_text',
            'placeholder', 'Computers, space, curricula, food, transportation, etc.'
          ),
          jsonb_build_object(
            'name', 'pilot_direct_costs',
            'label', 'What items will incur a direct cost? (Don''t worry about amounts for now).',
            'type', 'long_text',
            'placeholder', 'Staff time, supplies, incentives, and other direct expenses.'
          ),
          jsonb_build_object(
            'name', 'pilot_indirect_costs',
            'label', 'What items will incur an indirect cost? (Don''t worry about amounts for now).',
            'type', 'long_text',
            'placeholder', 'Insurance, admin support, overhead, shared services, transportation, etc.'
          ),
          jsonb_build_object(
            'name', 'timing_intro',
            'label', 'Timing & scale',
            'type', 'subtitle',
            'description', 'Clarify the timeline, number of people served, and how this pilot connects to your larger vision.'
          ),
          jsonb_build_object(
            'name', 'pilot_duration',
            'label', 'How long will the pilot run?',
            'type', 'short_text',
            'placeholder', 'Weeks, months, or cycles.'
          ),
          jsonb_build_object(
            'name', 'pilot_dates',
            'label', 'What are the start and end dates?',
            'type', 'short_text',
            'placeholder', 'Planned start and end dates.'
          ),
          jsonb_build_object(
            'name', 'pilot_people_served',
            'label', 'How many people will you serve?',
            'type', 'short_text',
            'placeholder', 'Estimated number of participants in this pilot.'
          ),
          jsonb_build_object(
            'name', 'pilot_vision_fit',
            'label', 'How does this relate to your larger vision?',
            'type', 'long_text',
            'placeholder', 'Describe how this pilot advances your broader mission and vision.'
          ),
          jsonb_build_object(
            'name', 'pilot_program_summary',
            'label', 'Pilot program summary (for your org profile)',
            'type', 'long_text',
            'org_key', 'programs',
            'description', 'Using your answers above, draft 2–3 paragraphs you would use to describe this pilot on your organization page.',
            'placeholder', 'Write a concise narrative that a funder or supporter could read to understand this pilot.'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;

    update module_content
    set resources = jsonb_build_array(
      jsonb_build_object(
        'label', 'Designing Your Pilot Questions',
        'url', ''
      )
    )
    where module_id = pilot_module_id;
  end if;

  select m.id
  into board_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'board-engagement-governance'
    and m.idx = 2
  limit 1;

  if board_module_id is not null then
    update module_content
    set resources = coalesce(resources, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'label', 'Sample New Member Handbook',
        'url', ''
      )
    )
    where module_id = board_module_id;
  end if;
end $$;
