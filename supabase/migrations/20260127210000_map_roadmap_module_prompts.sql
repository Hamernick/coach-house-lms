set search_path = public;

do $$
declare
  origin_module_id uuid;
  need_module_id uuid;
  values_module_id uuid;
  toc_module_id uuid;
  pilot_module_id uuid;
  evaluation_module_id uuid;
  budget_module_id uuid;
begin
  select m.id
  into origin_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'start-with-your-why'
  limit 1;

  if origin_module_id is not null then
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
            'label', 'Share the story behind the mission.',
            'type', 'long_text',
            'placeholder', 'Describe the moment or pattern that made the need impossible to ignore, and who was affected. Mention the early steps you took and how the organization took shape.',
            'required', false
          )
        )
      )::jsonb,
      true
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into need_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'what-is-the-need'
  limit 1;

  if need_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      need_module_id,
      jsonb_build_object(
        'title', 'Need statement (draft)',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'need_intro',
            'label', 'Need snapshot',
            'type', 'subtitle',
            'description', 'Articulate the problem. This can be a few sentences or up to a full page. Focus on who is affected, what is happening, and the consequences of inaction.'
          ),
          jsonb_build_object(
            'name', 'need_who',
            'label', 'Who is experiencing the need?',
            'type', 'long_text',
            'placeholder', 'Describe the specific people or communities impacted.'
          ),
          jsonb_build_object(
            'name', 'need_problem',
            'label', 'What is the problem?',
            'type', 'long_text',
            'placeholder', 'Explain the challenge in clear, concrete language.'
          ),
          jsonb_build_object(
            'name', 'need_data_points',
            'label', 'What are some key data points to help communicate the problem?',
            'type', 'long_text',
            'placeholder', 'Cite data points, trends, or facts that help communicate the need.'
          ),
          jsonb_build_object(
            'name', 'need_consequence',
            'label', 'What happens if it is not addressed?',
            'type', 'long_text',
            'placeholder', 'What gets worse? What is at stake if nothing changes?'
          ),
          jsonb_build_object(
            'name', 'need_statement_draft',
            'label', 'Describe the gap you are closing.',
            'type', 'long_text',
            'org_key', 'need',
            'placeholder', 'Explain the specific problem, who it impacts, and why existing solutions fall short. Use a concrete example or data point to show urgency and scale.'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into values_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug = 'values'
  limit 1;

  if values_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      values_module_id,
      jsonb_build_object(
        'title', 'Values',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'values_intro',
            'label', 'Draft Core Values',
            'type', 'subtitle',
            'description', 'Draft your core values, focusing on the principles you want to consistently model as you grow.'
          ),
          jsonb_build_object(
            'name', 'values_personal',
            'label', 'In a few words, how would you describe your personal core values?',
            'type', 'short_text',
            'placeholder', 'List a few words or phrases that describe your personal values.'
          ),
          jsonb_build_object(
            'name', 'values_examples',
            'label', 'Six favorite values statements',
            'type', 'long_text',
            'placeholder', 'List six values statements you admire.'
          ),
          jsonb_build_object(
            'name', 'values',
            'label', 'Define your core organizational values',
            'type', 'long_text',
            'org_key', 'values',
            'placeholder', 'List the principles you are unwilling to compromise and the culture you want to build.'
          ),
          jsonb_build_object(
            'name', 'mvv_summary',
            'label', 'State the mission, vision, and values in clear language.',
            'type', 'long_text',
            'placeholder', 'State the mission in one clear sentence, then describe the vision of the future you are working toward. List 3-5 values and describe how they guide decisions.'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into toc_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change'
    and m.slug = 'theory-of-change'
  limit 1;

  if toc_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      toc_module_id,
      jsonb_build_object(
        'title', 'IF / THEN / SO exploration',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'statement_intro',
            'label', 'Draft Theory of Change',
            'type', 'subtitle',
            'description', 'Using your need, mission, vision, and values, work with AI (or teammates) to develop multiple IF-THEN-SO statements.'
          ),
          jsonb_build_object(
            'name', 'statement_one',
            'label', 'Statement 1 (IF / THEN / SO)',
            'type', 'long_text',
            'placeholder', 'If we..., then..., so that...'
          ),
          jsonb_build_object(
            'name', 'statement_two',
            'label', 'Statement 2 (IF / THEN / SO)',
            'type', 'long_text',
            'placeholder', 'Experiment with a different angle or audience.'
          ),
          jsonb_build_object(
            'name', 'statement_three',
            'label', 'Statement 3 (IF / THEN / SO)',
            'type', 'long_text',
            'placeholder', 'Stress test a bold or aspirational scenario.'
          ),
          jsonb_build_object(
            'name', 'toc_summary',
            'label', 'Explain the logic behind your work.',
            'type', 'long_text',
            'placeholder', 'Explain the chain from inputs to activities to outcomes, in plain language. Call out the key assumptions you are testing and the indicators that prove progress.'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into pilot_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'designing-your-pilot'
  limit 1;

  if pilot_module_id is not null then
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
            'label', 'Highlight the people and roles needed to deliver the work.',
            'type', 'long_text',
            'placeholder', 'List the key roles needed now and in the next phase, including staff, volunteers, or advisors. Mention gaps or hires that are most critical to success.'
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
            'label', 'Outline the programs you run and who they serve.',
            'type', 'long_text',
            'org_key', 'programs',
            'placeholder', 'Outline the core programs or services, the audience served, and how delivery works. Include reach or volume where you can (participants, sites, sessions).'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into evaluation_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'evaluation'
  limit 1;

  if evaluation_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      evaluation_module_id,
      jsonb_build_object(
        'title', 'Evaluation',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'evaluation_summary',
            'label', 'Describe your evaluation plan and key signals.',
            'type', 'long_text',
            'placeholder', 'Describe how you measure progress and what data you collect. Note how often you review results and how you use findings to improve.'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into budget_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'session-s5-budgets-program'
    and m.slug = 'budgeting-for-a-program'
  limit 1;

  if budget_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      budget_module_id,
      jsonb_build_object(
        'title', 'Program_Expense_Breakdown',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'program_expense_breakdown',
            'label', 'Program_Expense_Breakdown',
            'type', 'budget_table',
            'required', false,
            'description', 'This table is designed to help you translate program activities into real costs. Some expenses happen once. Others increase based on the number of sessions, events, or participants. Use this table to estimate costs, not to be perfect, but to be intentional.',
            'rows', jsonb_build_array(
              jsonb_build_object(
                'category', 'Program Staff / Facilitators',
                'description', 'Instructors, coaches, trainers',
                'costType', 'Variable',
                'unit', 'Session / Hour',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Program Supplies & Materials',
                'description', 'Materials used directly by participants',
                'costType', 'Variable',
                'unit', 'Participant / Session',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Space / Facility Costs',
                'description', 'Room rental, gym, classroom, meeting space',
                'costType', 'Fixed or Variable',
                'unit', 'Event / Month',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Food & Refreshments',
                'description', 'Snacks, meals, water',
                'costType', 'Variable',
                'unit', 'Participant / Event',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Transportation Support',
                'description', 'Bus passes, rides, mileage',
                'costType', 'Variable',
                'unit', 'Participant / Trip',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Equipment',
                'description', 'Laptops, tools, sports gear, technology',
                'costType', 'Fixed',
                'unit', '-',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Marketing & Outreach',
                'description', 'Flyers, ads, printing, outreach materials',
                'costType', 'Fixed',
                'unit', '-',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Insurance / Permits',
                'description', 'Event insurance, permits, certifications',
                'costType', 'Fixed',
                'unit', '-',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Evaluation & Data Collection',
                'description', 'Surveys, tools, stipends for evaluation',
                'costType', 'Fixed or Variable',
                'unit', 'Program / Participant',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              ),
              jsonb_build_object(
                'category', 'Other Direct Program Costs',
                'description', 'Any additional direct expenses',
                'costType', 'Fixed or Variable',
                'unit', '(Specify)',
                'units', '',
                'costPerUnit', '',
                'totalCost', ''
              )
            )
          ),
          jsonb_build_object(
            'name', 'budget_summary',
            'label', 'Summarize the budget and financial priorities.',
            'type', 'long_text',
            'placeholder', 'Summarize the current budget and the biggest cost drivers. Note the near-term investments that would unlock growth or impact.'
          )
        )
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;
end $$;

-- Fundraising homework updates for session S7 (mindset)
with fundraising_modules as (
  select m.id, m.slug
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'session-s7-mindset'
    and m.slug in ('treasure-mapping', 'donor-journey', 'channels', 'storytelling-and-the-ask')
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  fm.id,
  case
    when fm.slug = 'treasure-mapping' then
      jsonb_build_object(
        'title', 'Treasure mapping',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'treasure_crm',
            'label', 'Do you currently use a CRM (Customer Relationship Management system)?',
            'type', 'select',
            'options', jsonb_build_array('Yes', 'No'),
            'placeholder', 'Select one'
          ),
          jsonb_build_object(
            'name', 'treasure_sources',
            'label', 'If no, where do your existing contacts live today? (Check all that apply)',
            'type', 'multi_select',
            'options', jsonb_build_array(
              'Email inbox',
              'Phone contacts',
              'LinkedIn connections',
              'Other social media platforms',
              'Spreadsheets or documents',
              'Personal memory / notes',
              'Other'
            )
          ),
          jsonb_build_object(
            'name', 'treasure_names',
            'label', 'Using the sources above, list people or organizations you already know, have interacted with, or could reasonably reconnect with.',
            'type', 'long_text',
            'placeholder', 'Aim for at least 15–25 names before sorting.'
          ),
          jsonb_build_object(
            'name', 'treasure_circles',
            'label', 'Map names into the Treasure Circles (Inner, Community, Institutional, Public, Legacy).',
            'type', 'long_text',
            'placeholder', 'List 5–10 names per circle (3–5 for legacy).'
          ),
          jsonb_build_object(
            'name', 'treasure_moves',
            'label', 'Select 5–10 unique names you will intentionally approach in the next 60–90 days. Note the circle and strategy for each.',
            'type', 'long_text',
            'placeholder', 'Example: Name — Circle — Strategy.'
          ),
          jsonb_build_object(
            'name', 'crm_plan_summary',
            'label', 'Document the CRM plan and prospect pipeline.',
            'type', 'long_text',
            'placeholder', 'Explain how you track prospects, stages, and follow-ups. Include the size of the pipeline and your cadence for outreach and stewardship.'
          )
        )
      )
    when fm.slug = 'donor-journey' then
      jsonb_build_object(
        'title', 'Donor journey',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'donor_priority',
            'label', 'Select 5–10 individuals or organizations you could realistically engage over the next 60–90 days.',
            'type', 'long_text',
            'placeholder', 'List the names you want to focus on first.'
          ),
          jsonb_build_object(
            'name', 'donor_stage',
            'label', 'Identify their current stage (Identify, Introduce, Cultivate, Steward).',
            'type', 'long_text',
            'placeholder', 'Map each name to a donor journey stage.'
          ),
          jsonb_build_object(
            'name', 'donor_next_step',
            'label', 'Define one clear next action step for each person.',
            'type', 'long_text',
            'placeholder', 'Focus on connection, not the ask, unless the relationship is ready.'
          ),
          jsonb_build_object(
            'name', 'donor_capture',
            'label', 'Capture it simply (Name, Treasure Circle, Stage, Next Action, Target timeframe).',
            'type', 'long_text',
            'placeholder', 'Use a consistent format you can paste into a spreadsheet or CRM.'
          ),
          jsonb_build_object(
            'name', 'donor_reflection',
            'label', 'Closing reflection (1–2 sentences)',
            'type', 'long_text',
            'placeholder', 'What did you notice when you shifted from a list of names to a relationship journey?'
          ),
          jsonb_build_object(
            'name', 'fundraising_strategy',
            'label', 'Detail your fundraising strategy and targets.',
            'type', 'long_text',
            'placeholder', 'List the top funding targets and how you plan to approach them. Include timelines, expected ask sizes, and what proof points you will share.'
          )
        )
      )
    when fm.slug = 'channels' then
      jsonb_build_object(
        'title', 'Fundraising channels inventory',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'channels_digital',
            'label', 'Digital channels (check all you are currently using)',
            'type', 'multi_select',
            'options', jsonb_build_array(
              'Email newsletters or appeals',
              'Email welcome or onboarding sequence',
              'Website with a clear donation page',
              'Online giving platform (e.g., Monkeypod, GiveButter, Stripe, PayPal)',
              'Social media (Instagram, Facebook, LinkedIn, X, etc.)',
              'Substack or blog',
              'Crowdfunding or year-end online campaigns',
              'Online event registration or ticketing',
              'Other digital channels'
            )
          ),
          jsonb_build_object(
            'name', 'channels_events',
            'label', 'Events & in-person channels (check all that apply)',
            'type', 'multi_select',
            'options', jsonb_build_array(
              'Small gatherings or house meetings',
              'Community events or tabling',
              'Workshops, panels, or webinars',
              'Benefit dinners or receptions',
              'Walks, runs, or public fundraisers',
              'Open houses or site visits',
              'Program showcases or graduations',
              'Board-hosted events',
              'Other in-person channels'
            )
          ),
          jsonb_build_object(
            'name', 'channels_peer',
            'label', 'Peer & community channels (check all that apply)',
            'type', 'multi_select',
            'options', jsonb_build_array(
              'Peer-to-peer fundraising campaigns',
              'Board or volunteer-led outreach',
              'Personal introductions and referrals',
              'Community partnerships or co-hosted events',
              'Faith-based or civic group outreach',
              'Birthday or celebration fundraisers',
              'Ambassador or champion programs',
              'Earned media (press, podcasts, interviews)',
              'Speaking engagements or presentations',
              'Thought leadership (op-eds, data, public commentary)',
              'Other peer/community channels'
            )
          ),
          jsonb_build_object(
            'name', 'channels_future',
            'label', 'Are there one or more channels you want to develop over the next year? If yes, which and why?',
            'type', 'long_text',
            'placeholder', 'List channels and the reason (audience fit, capacity, mission alignment, growth potential).'
          ),
          jsonb_build_object(
            'name', 'fundraising_overview',
            'label', 'Explain how you plan to raise the resources you need.',
            'type', 'long_text',
            'placeholder', 'Explain the mix of funding sources you rely on and the goals for the next cycle. Include any upcoming campaigns, renewals, or grants you are pursuing.'
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Developing your case for support',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'case_personal',
            'label', 'Your personal case for support (draft)',
            'type', 'long_text',
            'description', 'Write a full draft in your own words. Include the problem, why it matters, your solution, who benefits, and the impact you are creating.',
            'placeholder', 'Write the full draft in your voice.'
          ),
          jsonb_build_object(
            'name', 'case_ai_short',
            'label', 'Short AI-generated case for support',
            'type', 'long_text',
            'description', 'Concise, donor-friendly (1–2 short paragraphs).',
            'placeholder', 'Paste the AI-generated short version.'
          ),
          jsonb_build_object(
            'name', 'case_ai_long',
            'label', 'Long AI-generated case for support',
            'type', 'long_text',
            'description', 'More detailed, suitable for proposals, major donors, or websites.',
            'placeholder', 'Paste the AI-generated long version.'
          ),
          jsonb_build_object(
            'name', 'case_pitch',
            'label', 'Elevator pitch version (30–60 seconds)',
            'type', 'long_text',
            'placeholder', 'Write the short pitch you can say out loud.'
          ),
          jsonb_build_object(
            'name', 'case_reflection',
            'label', 'Optional reflection (1–2 sentences)',
            'type', 'long_text',
            'placeholder', 'What felt most authentic in your personal draft?'
          ),
          jsonb_build_object(
            'name', 'fundraising_presentation',
            'label', 'Outline the presentation materials and key messages.',
            'type', 'long_text',
            'placeholder', 'Describe the story arc of your pitch and the core messages you want funders to remember. Note which assets are ready (deck, one-pager, demo) and what is missing.'
          )
        )
      )
  end::jsonb,
  false
from fundraising_modules fm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Communications homework updates for session S8 (comms as mission)
with comm_modules as (
  select m.id, m.slug
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'session-s8-comms-as-mission'
    and m.slug = 'comprehensive-plan'
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  cm.id,
  jsonb_build_object(
    'title', 'Communications rhythm & 90-day plan',
    'fields', jsonb_build_array(
      jsonb_build_object(
        'name', 'annual_q1',
        'label', 'Annual rhythm — Q1',
        'type', 'long_text',
        'placeholder', 'Major programs, seasons, or moments.'
      ),
      jsonb_build_object(
        'name', 'annual_q2',
        'label', 'Annual rhythm — Q2',
        'type', 'long_text',
        'placeholder', 'Major programs, seasons, or moments.'
      ),
      jsonb_build_object(
        'name', 'annual_q3',
        'label', 'Annual rhythm — Q3',
        'type', 'long_text',
        'placeholder', 'Major programs, seasons, or moments.'
      ),
      jsonb_build_object(
        'name', 'annual_q4',
        'label', 'Annual rhythm — Q4',
        'type', 'long_text',
        'placeholder', 'Major programs, seasons, or moments.'
      ),
      jsonb_build_object(
        'name', 'plan_audience',
        'label', '90-day focus — primary audience(s)',
        'type', 'long_text',
        'placeholder', 'Who are you prioritizing in this period?'
      ),
      jsonb_build_object(
        'name', 'plan_messages',
        'label', '90-day focus — key message(s)',
        'type', 'long_text',
        'placeholder', 'What do you want them to understand?'
      ),
      jsonb_build_object(
        'name', 'plan_invites',
        'label', '90-day focus — primary invitation(s)',
        'type', 'long_text',
        'placeholder', 'What action are you inviting?'
      ),
      jsonb_build_object(
        'name', 'plan_channels',
        'label', '90-day focus — core channels',
        'type', 'long_text',
        'placeholder', 'Which channels matter most this quarter?'
      ),
      jsonb_build_object(
        'name', 'cadence_social',
        'label', 'Cadence — social',
        'type', 'short_text',
        'placeholder', 'Times per week'
      ),
      jsonb_build_object(
        'name', 'cadence_email',
        'label', 'Cadence — email',
        'type', 'short_text',
        'placeholder', 'Times per month'
      ),
      jsonb_build_object(
        'name', 'cadence_longform',
        'label', 'Cadence — long-form content',
        'type', 'short_text',
        'placeholder', 'Times per month'
      ),
      jsonb_build_object(
        'name', 'cadence_other',
        'label', 'Cadence — other',
        'type', 'short_text',
        'placeholder', 'Any other rhythms you want to keep'
      ),
      jsonb_build_object(
        'name', 'ai_notes',
        'label', 'AI support notes',
        'type', 'long_text',
        'description', 'What did you ask AI to generate, and what felt helpful or still needs revision?',
        'placeholder', 'Capture prompts and edits you plan to make.'
      ),
      jsonb_build_object(
        'name', 'comms_plan_reflection',
        'label', 'Optional reflection (1 sentence)',
        'type', 'long_text',
        'placeholder', 'What changed when you planned communications as a rhythm?'
      ),
      jsonb_build_object(
        'name', 'communications_summary',
        'label', 'Describe how you communicate with stakeholders.',
        'type', 'long_text',
        'placeholder', 'List the primary audiences, channels, and the frequency of outreach. Include the key messages you want consistent across communications.'
      )
    )
  )::jsonb,
  false
from comm_modules cm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Board homework prompts
with board_modules as (
  select m.id, m.slug
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'session-s9-intro-to-boards'
    and m.slug in ('intro-to-boards', 'annual-calendar', 'policy-4-board-self-governance', 'agendas-minutes-resolutions')
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  bm.id,
  case
    when bm.slug = 'intro-to-boards' then
      jsonb_build_object(
        'title', 'Board strategy',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'board_strategy',
            'label', 'Summarize board strategy and recruitment goals.',
            'type', 'long_text',
            'placeholder', 'Describe the ideal board composition and the skills or networks you need. Include recruitment targets and governance improvements you want this year.'
          )
        )
      )
    when bm.slug = 'annual-calendar' then
      jsonb_build_object(
        'title', 'Board calendar',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'board_calendar',
            'label', 'List the board calendar and important milestones.',
            'type', 'long_text',
            'placeholder', 'Outline the cadence for meetings, reporting, and committees. Include key dates for budget approvals, strategy reviews, and annual filings.'
          )
        )
      )
    when bm.slug = 'policy-4-board-self-governance' then
      jsonb_build_object(
        'title', 'Board handbook',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'board_handbook',
            'label', 'Capture board policies and onboarding materials.',
            'type', 'long_text',
            'placeholder', 'List the policies, expectations, and onboarding materials new board members receive. Note anything that needs to be created or updated.'
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Next actions',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'next_actions',
            'label', 'List the next actions and who owns them.',
            'type', 'long_text',
            'placeholder', 'List the top 3-7 actions for the next 30-90 days with owners and due dates. Focus on moves that unlock the next section of work.'
          )
        )
      )
  end::jsonb,
  false
from board_modules bm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;
