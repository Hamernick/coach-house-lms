set search_path = public;

do $$
declare
  origin_module_id uuid;
  need_module_id uuid;
  ai_need_module_id uuid;
  mission_module_id uuid;
  vision_module_id uuid;
  values_module_id uuid;
  toc_module_id uuid;
  systems_module_id uuid;
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
    update modules
    set content_md = $MD$
## Origin story

Many people freeze when asked to "tell their story," but relax when asked to assemble a few components.

You do not need to get this perfect. You do not need to write a polished story yet.

### Two ways to approach this
- Use a coaching session to develop your origin story. We will interview you, draft it, and revise until it feels true to you and aligned with your work.
- Answer the questions below. Your responses will be the raw material for an initial draft you can refine later.
$MD$
    where id = origin_module_id;

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
            'name', 'origin_personal_why',
            'label', 'Why do you believe this work matters now, and why do you feel called to be part of it?',
            'type', 'long_text',
            'placeholder', 'Describe why this work matters now and why you are called to it.',
            'required', false
          ),
          jsonb_build_object(
            'name', 'origin_story_draft',
            'label', 'Origin story draft (optional)',
            'type', 'long_text',
            'org_key', 'boilerplate',
            'description', 'Optional: pull your responses together into a narrative you can refine later.',
            'placeholder', 'Write or paste a draft if you have one.',
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
            'label', 'Begin developing your need statement',
            'type', 'long_text',
            'org_key', 'need',
            'placeholder', 'Summarize the problem, who it affects, and why it matters. A few sentences to a full page is fine.'
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
  into ai_need_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'ai-the-need'
  limit 1;

  if ai_need_module_id is not null then
    update modules
    set content_md = $MD$
## Build your need statement

Use AI to combine your answers from the previous module into a fuller need statement.

### Aim for
- A few paragraphs, up to one page.
- Clear language about the problem and the people affected.

### Avoid for now
- Describing your organization.
- Describing your solution.
$MD$
    where id = ai_need_module_id;

    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      ai_need_module_id,
      jsonb_build_object(
        'title', 'Need statement (refinement)',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'need_refine_intro',
            'label', 'Draft with AI',
            'type', 'subtitle',
            'description', 'Use AI to combine your answers from the previous module into a fuller need statement (up to one page).'
          ),
          jsonb_build_object(
            'name', 'need_refined',
            'label', 'AI-supported need statement',
            'type', 'long_text',
            'org_key', 'need',
            'placeholder', 'Draft a fuller statement (a few paragraphs up to one page).'
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
  into mission_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug = 'mission'
  limit 1;

  if mission_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      mission_module_id,
      jsonb_build_object(
        'title', 'Mission statement',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'mission_intro',
            'label', 'Draft Mission Statement',
            'type', 'subtitle',
            'description', 'Collect examples you admire, then draft a starting point you can refine later.'
          ),
          jsonb_build_object(
            'name', 'mission_examples',
            'label', 'Six favorite mission statements',
            'type', 'long_text',
            'placeholder', 'List six mission statements you admire.'
          ),
          jsonb_build_object(
            'name', 'mission',
            'label', 'Mission statement',
            'type', 'long_text',
            'org_key', 'mission',
            'placeholder', 'Write a clear, specific statement of why your organization exists.'
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
  into vision_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug = 'vision'
  limit 1;

  if vision_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      vision_module_id,
      jsonb_build_object(
        'title', 'Vision statement',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'vision_intro',
            'label', 'Draft Vision Statement',
            'type', 'subtitle',
            'description', 'Are you choosing a practical near-future vision or a bold, aspirational one? Draft a couple of options you can revisit as you progress.'
          ),
          jsonb_build_object(
            'name', 'vision_personal',
            'label', 'In a few sentences, how would you describe your personal vision statement?',
            'type', 'long_text',
            'placeholder', 'Describe your personal vision in a few sentences.'
          ),
          jsonb_build_object(
            'name', 'vision_examples',
            'label', 'Six favorite vision statements',
            'type', 'long_text',
            'placeholder', 'List six vision statements you admire.'
          ),
          jsonb_build_object(
            'name', 'vision',
            'label', 'Vision statement',
            'type', 'long_text',
            'org_key', 'vision',
            'placeholder', 'Describe the future you are working toward if your mission succeeds.'
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
    update modules
    set content_md = $MD$
## Theory of Change — homework guidance

Many people freeze when asked to develop a Theory of Change, but relax when asked to assemble a few clear components.

You do not need a polished Theory of Change yet. This is a working draft.

### Recommended approach
- Use a coaching session. We will connect your Need Statement to Mission, Vision, Values, and Theory of Change.

### If you work solo
1. Enter your Need Statement.
2. Enter your Mission, Vision, and Values.
3. Ask an AI tool to generate three "If / Then / So" versions.

### Review questions
- Which version most clearly responds to the need?
- "If": Is this what you intend to do?
- "Then": Is this the change you plan to measure?
- "So": Does this outcome connect back to the problem?

Your goal is clarity. We will refine this later.
$MD$
    where id = toc_module_id;

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
  into systems_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change'
    and m.slug = 'systems-thinking'
  limit 1;

  if systems_module_id is not null then
    update modules
    set description = 'Applying a systems thinking approach to evaluate the complexities in which your program seeks to achieve its purpose. You will learn to view your issue through a systems lens, revealing the patterns and structures that must change for your program to create lasting impact.',
        content_md = $MD$
## Systems thinking — program design reflection

Systems thinking helps you slow down and see how change happens, not just what you want to do.

### Use this exercise to
- Move from problem description to program design.
- Notice the conditions that need to shift.

There is no single "right" answer. The goal is thoughtful alignment with the broader system.
$MD$
    where id = systems_module_id;

    update module_content
    set resources = '[]'::jsonb,
        homework = '[]'::jsonb
    where module_id = systems_module_id;

    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      systems_module_id,
      jsonb_build_object(
        'title', 'Systems Thinking Worksheet',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'st_program_snapshot',
            'label', 'Program Snapshot',
            'type', 'long_text',
            'description', 'In 1-3 sentences, describe the program you are thinking about. What does it do, and who is it for?'
          ),
          jsonb_build_object(
            'name', 'st_problem_response',
            'label', 'What Problem Is This Program Responding To - and What Contributes to It?',
            'type', 'long_text',
            'description', 'What conditions, behaviors, policies, or gaps help create the problem your program is addressing? Which of these does your program directly touch - and which does it not?'
          ),
          jsonb_build_object(
            'name', 'st_success_connections',
            'label', 'What Else Is Connected to This Program''s Success?',
            'type', 'long_text',
            'description', 'Who or what needs to change, cooperate, or function well for this program to succeed? Consider participants, families, partners, institutions, incentives, or constraints.'
          ),
          jsonb_build_object(
            'name', 'st_changes_for_whom',
            'label', 'If This Program Works Well, What Changes - and for Whom?',
            'type', 'long_text',
            'description', 'Beyond immediate participants, who else experiences a difference? What might improve, shift, or become easier elsewhere as a result of this program?'
          ),
          jsonb_build_object(
            'name', 'st_assumption_change',
            'label', 'What Assumption Are You Making About How Change Will Happen?',
            'type', 'long_text',
            'description', 'What are you assuming must be true for this program to work as intended? What would you want to test or learn through piloting the program?'
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
  from modules m
  join classes c on c.id = m.class_id
  where m.slug = 'budgeting-for-a-program'
     or lower(m.title) = 'budgeting for a program'
     or (c.slug = 'budgeting-financial-basics' and m.idx = 1)
  order by
    case
      when m.slug = 'budgeting-for-a-program' then 1
      when lower(m.title) = 'budgeting for a program' then 2
      else 3
    end,
    m.updated_at desc nulls last
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
