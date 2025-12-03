set search_path = public;

-- Seed core Academy modules and associated module_content metadata based on the
-- canonical curriculum mapping (sessions 1–6).

with session_classes as (
  -- Map session numbers from the CSV to your actual class slugs
  -- Session 1 → Strategic Foundations
  select 1::int as session_number, 'strategic-foundations'::text as slug
  -- Session 2 → Mission, Vision & Values
  union all select 2, 'mission-vision-values'
  -- Session 3 → Theory of Change & Systems Thinking
  union all select 3, 'theory-of-change'
  -- Session 4 → Piloting Programs
  union all select 4, 'piloting-programs'
),
session_modules as (
  select * from (values
    -- session_number, idx, slug, title, lesson_description, resource_label, homework_instructions
    (1, 1, 'intro-idea-to-impact-accelerator', 'Introduction: Idea to Impact Accelerator', 'Introduction to the accelerator, what do we cover, why Coach House?, how does it work?', 'link to our substack open NFP', null),
    (1, 2, 'start-with-your-why', 'Start with your why', 'How does your personal story relate to what you want to do?', null, 'Use this section to develop your origin story and connect it to your personal background. Write one to two pages and craft a background story that grounds your organizational why.'),
    (1, 3, 'what-is-the-need', 'What is the Need?', 'Using AI to explore how to establish a clearly articulated need statement.', null, 'Give thought to defining the need you are addressing as narrowly as possible in a brief statement or paragraph. Then move to the next module where you will refine the need statement with AI.'),
    (1, 4, 'ai-the-need', 'AI The Need', null, null, 'Use this section to develop your need statement. Be very clear about the problem, how serious it is, and any data that helps explain it. Do not yet describe your organization or solution.'),
    (2, 1, 'mission', 'Mission', 'Why do you exist?', 'Simon Sinek on Start with Why', 'Draft three or more mission statements, share them with others, and refine to a final draft. Check that accomplishing your mission would genuinely address the need.'),
    (2, 2, 'vision', 'Vision', 'Where do you want to go?', 'Peter Senge on Shared Vision', 'Reflect on your personal vision, draft a few versions of a potential vision statement, share for feedback, and refine. Compare it to the need and mission to ensure they fit together.'),
    (2, 3, 'values', 'Values', 'What do you believe?', null, 'Articulate the principles you feel so strongly about that you would not want to do the work without them. Describe the culture you want to build.'),
    (3, 1, 'theory-of-change', 'Theory of Change', 'Moving from why to what, one step ahead of program design.', null, 'Using your need, mission, vision, and values, work with AI to develop several IF-THEN-SO theory of change statements. Ensure the statement aligns with the larger organization and makes clear what you propose to do, what is likely to happen, and the long-term impact.'),
    (3, 2, 'systems-thinking', 'Systems Thinking', 'Applying a lens to consider the complex setting in which your program seeks to achieve its purpose.', 'Systems Thinking Questions', 'Using the systems thinking resource document, reflect on the questions and apply them to your organization. Share your description with AI and ask it to surface considerations you may have missed.'),
    (4, 1, 'develop-a-pilot', 'Program: Develop a Pilot', 'Why pilot a program?', 'Optional Video: The story of SE CBA as a pilot', null),
    (4, 2, 'program-models', 'Program Models', null, null, 'Decide which of the pilot models you will use as you design your program.'),
    (4, 3, 'designing-your-pilot', 'Designing your Pilot', null, 'Questions to Design your Pilot', 'Use the questions in the linked document to clarify your program. Drop the questions into AI, review the options it proposes, and iterate until you have a well-formed program description and, if needed, curricula for staff or volunteers.'),
    (4, 4, 'evaluation', 'Evaluation', null, null, null),
    (5, 1, 'budgeting-for-a-program', 'Budgeting for a Program', null, null, null),
    (5, 2, 'budgeting-for-an-organization', 'Budgeting for an Organization', null, null, null),
    (5, 3, 'multi-year-budgeting', 'Multi-year Budgeting', null, null, null),
    (5, 4, 'mid-year-budget-usage', 'Mid year budget usage', null, null, null),
    (6, 1, 'from-budgeting-to-bookkeeping', 'From Budgeting to Bookkeeping', null, null, null),
    (6, 2, 'financials-ie-bs-coa', 'Financials (IE, BS, COA)', null, null, null)
  ) as t(session_number, idx, slug, title, lesson_description, resource_label, homework_instructions)
),
class_lookup as (
  select sc.session_number, c.id as class_id
  from session_classes sc
  join classes c on c.slug = sc.slug
)
insert into modules (class_id, idx, slug, title, description, content_md, is_published)
select
  cl.class_id,
  sm.idx,
  sm.slug,
  sm.title,
  sm.lesson_description,
  null,
  true
from session_modules sm
join class_lookup cl on cl.session_number = sm.session_number
on conflict (class_id, idx) do update set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  content_md = excluded.content_md,
  is_published = excluded.is_published;

-- Strategic Foundations: class + module copy updates
update classes set description = 'Where clarity begins: mission, vision, values, and the essential logic of your organization''s impact pathway.' where slug = 'strategic-foundations';

with sf_intro as (
  select m.id
  from classes c join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations' and m.slug = 'intro-idea-to-impact-accelerator' limit 1
)
update modules m
set description = 'What do we cover? Why Coach House? How does it work?'
from sf_intro t
where m.id = t.id;

with sf_intro as (
  select m.id
  from classes c join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations' and m.slug = 'intro-idea-to-impact-accelerator' limit 1
)
update module_content mc
set resources = jsonb_build_array(
  jsonb_build_object('label','Coach House Substack','url','https://coachhousesolutions.substack.com/'),
  jsonb_build_object('label','Slide deck (PDF)','url', concat('/api/modules/', sf_intro.id::text, '/deck'))
)
from sf_intro
where mc.module_id = sf_intro.id;

with sf_module as (
  select m.id
  from classes c join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations' and m.slug = 'start-with-your-why' limit 1
)
update modules m
set title = 'The Why'
from sf_module t
where m.id = t.id;

-- Strategic Foundations module 3 + 4 copy
with sf_need as (
  select m.id
  from classes c join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations' and m.slug = 'what-is-the-need' limit 1
)
update modules m
set title = 'Identify the need',
    description = 'Developing a need statement'
from sf_need t
where m.id = t.id;

with sf_need as (
  select m.id
  from classes c join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations' and m.slug = 'ai-the-need' limit 1
)
update modules m
set title = 'Build your need statement',
    description = 'Use AI and structured prompts to stress test and finalize your need statement.',
    content_md = $MD$
Use this section to develop your need statement. Be clear about what the problem is and avoid describing your organization or solution. Focus on the problem: What is happening? How serious is it? What data helps explain it?
$MD$
from sf_need t
where m.id = t.id;

-- Override Strategic Foundations module 2 ("start-with-your-why")
-- with updated title, subtitle, and lesson notes content.
update modules m
set
  title = 'Define your why',
  description = 'Connect your origin story to the organization you are building.'
from classes c
where m.class_id = c.id
  and c.slug = 'strategic-foundations'
  and m.idx = 2;

update modules m
set
  content_md = $MD$
## Define your why

Develop your Origin Story. Where did this come from and how does it relate to your personal background?

Where are you from? If you were to stand up and tell someone your story, how would it help them to understand what you want to do and why?

Write out your story in one to two pages to craft this into a background story. Your personal why will lay the groundwork for the organization you are leading.
$MD$
from classes c
where m.class_id = c.id
  and c.slug = 'strategic-foundations'
  and m.idx = 2;

-- Module content: resources + legacy homework prompts
with session_classes as (
  -- Same class mapping used above
  select 1::int as session_number, 'strategic-foundations'::text as slug
  union all select 2, 'mission-vision-values'
  union all select 3, 'theory-of-change'
  union all select 4, 'piloting-programs'
),
session_modules as (
  select * from (values
    -- session_number, idx, slug, title, lesson_description, resource_label, homework_instructions
    (1, 1, 'intro-idea-to-impact-accelerator', 'Introduction: Idea to Impact Accelerator', 'Introduction to the accelerator, what do we cover, why Coach House?, how does it work?', 'link to our substack open NFP', null),
    (1, 2, 'start-with-your-why', 'Start with your why', 'How does your personal story relate to what you want to do?', null, 'Use this section to develop your origin story and connect it to your personal background. Write one to two pages and craft a background story that grounds your organizational why.'),
    (1, 3, 'what-is-the-need', 'What is the Need?', 'Using AI to explore how to establish a clearly articulated need statement.', null, 'Give thought to defining the need you are addressing as narrowly as possible in a brief statement or paragraph. Then move to the next module where you will refine the need statement with AI.'),
    (1, 4, 'ai-the-need', 'AI The Need', null, null, 'Use this section to develop your need statement. Be very clear about the problem, how serious it is, and any data that helps explain it. Do not yet describe your organization or solution.'),
    (2, 1, 'mission', 'Mission', 'Why do you exist?', 'Simon Sinek on Start with Why', 'Draft three or more mission statements, share them with others, and refine to a final draft. Check that accomplishing your mission would genuinely address the need.'),
    (2, 2, 'vision', 'Vision', 'Where do you want to go?', 'Peter Senge on Shared Vision', 'Reflect on your personal vision, draft a few versions of a potential vision statement, share for feedback, and refine. Compare it to the need and mission to ensure they fit together.'),
    (2, 3, 'values', 'Values', 'What do you believe?', null, 'Articulate the principles you feel so strongly about that you would not want to do the work without them. Describe the culture you want to build.'),
    (3, 1, 'theory-of-change', 'Theory of Change', 'Moving from why to what, one step ahead of program design.', null, 'Using your need, mission, vision, and values, work with AI to develop several IF-THEN-SO theory of change statements. Ensure the statement aligns with the larger organization and makes clear what you propose to do, what is likely to happen, and the long-term impact.'),
    (3, 2, 'systems-thinking', 'Systems Thinking', 'Applying a lens to consider the complex setting in which your program seeks to achieve its purpose.', 'Systems Thinking Questions', 'Using the systems thinking resource document, reflect on the questions and apply them to your organization. Share your description with AI and ask it to surface considerations you may have missed.'),
    (4, 1, 'develop-a-pilot', 'Program: Develop a Pilot', 'Why pilot a program?', 'Optional Video: The story of SE CBA as a pilot', null),
    (4, 2, 'program-models', 'Program Models', null, null, 'Decide which of the pilot models you will use as you design your program.'),
    (4, 3, 'designing-your-pilot', 'Designing your Pilot', null, 'Questions to Design your Pilot', 'Use the questions in the linked document to clarify your program. Drop the questions into AI, review the options it proposes, and iterate until you have a well-formed program description and, if needed, curricula for staff or volunteers.'),
    (4, 4, 'evaluation', 'Evaluation', null, null, null),
    (5, 1, 'budgeting-for-a-program', 'Budgeting for a Program', null, null, null),
    (5, 2, 'budgeting-for-an-organization', 'Budgeting for an Organization', null, null, null),
    (5, 3, 'multi-year-budgeting', 'Multi-year Budgeting', null, null, null),
    (5, 4, 'mid-year-budget-usage', 'Mid year budget usage', null, null, null),
    (6, 1, 'from-budgeting-to-bookkeeping', 'From Budgeting to Bookkeeping', null, null, null),
    (6, 2, 'financials-ie-bs-coa', 'Financials (IE, BS, COA)', null, null, null)
  ) as t(session_number, idx, slug, title, lesson_description, resource_label, homework_instructions)
),
class_lookup as (
  select sc.session_number, c.id as class_id
  from session_classes sc
  join classes c on c.slug = sc.slug
),
module_targets as (
  select
    sm.session_number,
    sm.idx,
    sm.resource_label,
    sm.homework_instructions,
    m.id as module_id
  from session_modules sm
  join class_lookup cl on cl.session_number = sm.session_number
  join modules m on m.class_id = cl.class_id and m.idx = sm.idx
)
insert into module_content (module_id, resources, homework)
select
  mt.module_id,
  case
    when mt.resource_label is null
      or length(trim(mt.resource_label)) = 0
      or lower(trim(mt.resource_label)) in ('none', 'n/a')
    then '[]'::jsonb
    else jsonb_build_array(
      jsonb_build_object(
        'label', mt.resource_label,
        'url', ''
      )
    )
  end,
  case
    when mt.homework_instructions is null
      or length(trim(mt.homework_instructions)) = 0
      or lower(trim(mt.homework_instructions)) in ('none', 'n/a')
    then '[]'::jsonb
    else jsonb_build_array(
      jsonb_build_object(
        'label', 'Homework',
        'instructions', mt.homework_instructions,
        'upload_required', false
      )
    )
  end
from module_targets mt
on conflict (module_id) do update set
  resources = excluded.resources,
  homework = excluded.homework;

-- Seed structured assignment schema for the Strategic Foundations
-- "Start with your why" module so learners see a guided Origin Story
-- worksheet instead of a single generic homework textarea.
with target_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'start-with-your-why'
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  tm.id,
  jsonb_build_object(
    'title', 'Origin Story Worksheet',
    'fields', jsonb_build_array(
      jsonb_build_object(
        'name', 'origin_intro',
        'label', 'Origin Story',
        'type', 'subtitle',
        'description', 'Use this section to develop your Origin Story and connect it to your personal background. We encourage you to use AI to help draft it.'
      ),
      jsonb_build_object(
        'name', 'origin_home',
        'label', 'Where are you from?',
        'type', 'short_text',
        'placeholder', 'City, region, or community you call home.',
        'required', false
      ),
      jsonb_build_object(
        'name', 'origin_background',
        'label', 'What experiences shaped this work?',
        'type', 'long_text',
        'description', 'If you stood up and told your story, what moments would help someone understand what you want to do and why?',
        'placeholder', 'List 2–4 experiences that connect your story to the work you want to do.',
        'required', false
      ),
      jsonb_build_object(
        'name', 'origin_personal_why',
        'label', 'Your personal “why”',
        'type', 'long_text',
        'description', 'Why does this work matter to you personally?',
        'placeholder', 'In a few paragraphs, describe why you feel called to this work.',
        'required', false
      ),
      jsonb_build_object(
        'name', 'origin_story_section',
        'label', 'Draft your origin story',
        'type', 'subtitle',
        'description', 'Pull your reflections together into a 1–2 page narrative you could share with a supporter or board member.'
      ),
      jsonb_build_object(
        'name', 'origin_story_draft',
        'label', 'Origin story draft (1–2 pages)',
        'type', 'long_text',
        'org_key', 'boilerplate',
        'placeholder', 'Write or paste your full origin story here.',
        'required', true
      )
    )
  )::jsonb,
  true
from target_module tm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Seed assignment schema for Strategic Foundations "What is the Need?" and "AI The Need"
-- so the final need statement flows into organizations.profile.need.
with need_modules as (
  select m.id, m.slug
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug in ('what-is-the-need', 'ai-the-need')
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  nm.id,
  case
    when nm.slug = 'what-is-the-need' then
      jsonb_build_object(
        'title', 'Need statement (draft)',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'need_intro',
            'label', 'Need snapshot',
            'type', 'subtitle',
            'description', 'Articulate the problem in a few sentences. Focus on who is affected, what is happening, and the consequences of inaction.'
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
            'name', 'need_consequence',
            'label', 'What happens if it isn’t addressed?',
            'type', 'long_text',
            'placeholder', 'What gets worse? What’s at stake if nothing changes?'
          ),
          jsonb_build_object(
            'name', 'need_statement_draft',
            'label', 'Begin developing your need statement (2–3 sentences)',
            'type', 'long_text',
            'org_key', 'need',
            'placeholder', 'Summarize the problem, who it affects, and why it matters.'
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Need statement (refinement)',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'need_refine_intro',
            'label', 'Refine your statement',
            'type', 'subtitle',
            'description', 'Use AI or feedback from peers to sharpen the clarity of your need statement.'
          ),
          jsonb_build_object(
            'name', 'need_refined',
            'label', 'Finalized need statement',
            'type', 'long_text',
            'org_key', 'need',
            'placeholder', 'Deliver a crisp, compelling description of the need.'
          )
        )
      )
  end::jsonb,
  false
from need_modules nm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Mission, Vision & Values copy updates
update classes
set description = 'This session helps you define the core identity of your organization—your mission, vision, and values. You’ll learn how each piece functions, how they work together, and how to articulate them in a way that guides decisions, aligns your team, and communicates your purpose with clarity.'
where slug = 'mission-vision-values';

with mv_targets as (
  select m.id, m.slug
  from classes c join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values' and m.slug in ('mission','vision','values')
)
update modules m
set description = case
  when t.slug = 'mission' then 'What difference are you making in the world?'
  when t.slug = 'vision' then 'A compelling picture of what could be.'
  else 'The principles that guide your actions.'
end
from mv_targets t
where m.id = t.id;

-- Seed assignment schema for Mission, Vision & Values modules so
-- mission, vision, and values flow directly into the org profile.
with mvv_modules as (
  select m.id, m.slug
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'mission-vision-values'
    and m.slug in ('mission', 'vision', 'values')
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  mv.id,
  case
    when mv.slug = 'mission' then
      jsonb_build_object(
        'title', 'Mission statement',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'mission_intro',
            'label', 'Draft 01',
            'type', 'subtitle',
            'description', 'Think of this as a starting point—you’ll revisit and refine it throughout the accelerator.'
          ),
          jsonb_build_object(
            'name', 'mission',
            'label', 'Mission statement',
            'type', 'long_text',
            'org_key', 'mission',
            'placeholder', 'Write a clear, specific statement of why your organization exists.'
          )
        )
      )
    when mv.slug = 'vision' then
      jsonb_build_object(
        'title', 'Vision statement',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'vision_intro',
            'label', 'Vision options',
            'type', 'subtitle',
            'description', 'Are you choosing a practical near-future vision or a bold, aspirational one? Draft a couple of options you can revisit as you progress.'
          ),
          jsonb_build_object(
            'name', 'vision',
            'label', 'Vision statement',
            'type', 'long_text',
            'org_key', 'vision',
            'placeholder', 'Describe the future you are working toward if your mission succeeds.'
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Values',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'values_intro',
            'label', 'Values drafting',
            'type', 'subtitle',
            'description', 'Draft your core values, focusing on the principles you want to consistently model as you grow.'
          ),
          jsonb_build_object(
            'name', 'values',
            'label', 'Define your core organizational values',
            'type', 'long_text',
            'org_key', 'values',
            'placeholder', 'List the principles you are unwilling to compromise and the culture you want to build.'
          )
        )
      )
  end::jsonb,
  false
from mvv_modules mv
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Seed structured assignment schema for Piloting Programs
-- "Designing your Pilot" module using the Pilot Design Questions worksheet.
with pilot_design_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'designing-your-pilot'
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  pdm.id,
  jsonb_build_object(
    'title', 'Pilot Program Design Worksheet',
    'fields', jsonb_build_array(
      -- 1. Purpose & Outcomes
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
      -- 2. People
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
      -- 3. Activities & Design
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
      -- 4. Resources & Supplies
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
        'label', 'What are the direct costs?',
        'type', 'long_text',
        'placeholder', 'Staff time, supplies, incentives, and other direct expenses.'
      ),
      jsonb_build_object(
        'name', 'pilot_indirect_costs',
        'label', 'What are the indirect costs?',
        'type', 'long_text',
        'placeholder', 'Insurance, admin support, overhead, shared services, transportation, etc.'
      ),
      -- 5. Timing & Scale
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
      -- Summary mapped into org profile
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
from pilot_design_module pdm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Theory of Change & Systems Thinking copy + homework updates
update classes
set description = 'Build the strategic backbone that links need, mission, vision, and programs.'
where slug = 'theory-of-change';

with toc_module as (
  select m.id from classes c join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change' and m.slug = 'theory-of-change' limit 1
)
update module_assignments ma
set schema = jsonb_build_object(
  'title', 'IF · THEN · SO exploration',
  'fields', jsonb_build_array(
    jsonb_build_object(
      'name', 'statement_intro',
      'label', 'Outline three versions of your theory of change',
      'type', 'subtitle',
      'description', 'Using your need, mission, vision, and values, work with AI (or teammates) to develop multiple IF–THEN–SO statements.'
    ),
    jsonb_build_object(
      'name', 'statement_one',
      'label', 'Statement 1 (IF · THEN · SO)',
      'type', 'long_text',
      'placeholder', 'If we…, then…, so that…'
    ),
    jsonb_build_object(
      'name', 'statement_two',
      'label', 'Statement 2 (IF · THEN · SO)',
      'type', 'long_text',
      'placeholder', 'Experiment with a different angle or audience.'
    ),
    jsonb_build_object(
      'name', 'statement_three',
      'label', 'Statement 3 (IF · THEN · SO)',
      'type', 'long_text',
      'placeholder', 'Stress test a bold or aspirational scenario.'
    )
  )
)::jsonb
from toc_module t
where ma.module_id = t.id;

with systems_module as (
  select m.id from classes c join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change' and m.slug = 'systems-thinking' limit 1
)
update modules m
set description = 'Applying a systems thinking approach to evaluate the complexities in which your program seeks to achieve its purpose. You’ll learn to view your issue through a systems lens, revealing the patterns and structures that must change for your program to create lasting impact.'
from systems_module t
where m.id = t.id;

with systems_module as (
  select m.id from classes c join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change' and m.slug = 'systems-thinking' limit 1
)
update module_content mc
set resources = '[]'::jsonb
from systems_module t
where mc.module_id = t.id;

-- Seed structured assignment schema for the Systems Thinking module so
-- learners can respond directly to the Systems Thinking Questions.
with systems_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change'
    and m.slug = 'systems-thinking'
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  sm.id,
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
from systems_module sm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;
