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
    (1, 1, 'intro-idea-to-impact-accelerator', 'Introduction: Idea to Impact Accelerator', 'Introduction to the accelerator: what we cover, why Coach House, and how it works.', 'link to our substack open NFP', null),
    (1, 2, 'start-with-your-why', 'Start with your why', 'How does your personal story relate to what you want to do?', null, 'Use this section to develop your origin story and connect it to your personal background. Write one to two pages and craft a background story that grounds your organizational why.'),
    (1, 3, 'what-is-the-need', 'What is the Need?', 'Using AI to explore how to establish a clearly articulated need statement.', null, 'Give thought to defining the need you are addressing as narrowly as possible in a brief statement or paragraph. Then move to the next module where you will refine the need statement with AI.'),
    (1, 4, 'ai-the-need', 'AI The Need', null, null, 'Use this section to develop your need statement. Be very clear about the problem, how serious it is, and any data that helps explain it. Do not yet describe your organization or solution.'),
    (1, 5, 'who-we-serve', 'Who We Serve', 'Clarify the specific people your work is focused on serving.', null, 'Use this section to clearly describe the population you are trying to reach, including their context, strengths, barriers, and boundaries.'),
    (2, 1, 'mission', 'Mission', 'Why do you exist?', 'Simon Sinek on Start with Why', 'Draft three or more mission statements, share them with others, and refine to a final draft. Check that accomplishing your mission would genuinely address the need.'),
    (2, 2, 'vision', 'Vision', 'Where do you want to go?', 'Peter Senge on Shared Vision', 'Reflect on your personal vision, draft a few versions of a potential vision statement, share for feedback, and refine. Compare it to the need and mission to ensure they fit together.'),
    (2, 3, 'values', 'Values', 'What do you believe?', null, 'Articulate the principles you feel so strongly about that you would not want to do the work without them. Describe the culture you want to build.'),
    (3, 1, 'theory-of-change', 'Theory of Change', 'Moving from why to what, one step ahead of program design.', null, 'Using your need, mission, vision, and values, work with AI to develop several IF-THEN-SO theory of change statements. Ensure the statement aligns with the larger organization and makes clear what you propose to do, what is likely to happen, and the long-term impact.'),
    (3, 2, 'systems-thinking', 'Systems Thinking', 'Applying a lens to consider the complex setting in which your program seeks to achieve its purpose.', 'Systems Thinking Questions', 'Using the systems thinking resource document, reflect on the questions and apply them to your organization. Share your description with AI and ask it to surface considerations you may have missed.'),
    (4, 1, 'develop-a-pilot', 'Program: Develop a Pilot', 'Why pilot a program?', 'Optional Video: The story of SE CBA as a pilot', null),
    (4, 2, 'program-models', 'Program Models', null, null, 'Decide which of the pilot models you will use as you design your program.'),
    (4, 3, 'designing-your-pilot', 'Designing your Pilot', null, null, 'Use the questions below to clarify your program. Drop them into AI, review the options it proposes, and iterate until you have a well-formed program description and, if needed, curricula for staff or volunteers.'),
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
set description = 'Introduction to the accelerator: what we cover, why Coach House, and how it works.'
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

with pilot_video as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'designing-your-pilot'
  limit 1
)
update module_content mc
set video_url = 'https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/accelerator-videos/S4%20M3%20Design%20your%20pilot.mp4'
from pilot_video pv
where mc.module_id = pv.id;

with multi_year_video as (
  select m.id
  from modules m
  where m.slug = 'multi-year-budgeting'
     or lower(m.title) = 'multi-year budgeting'
  limit 1
)
update module_content mc
set video_url = 'https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/accelerator-videos/S5%20M3%20Budgets%20(multi%20year).mov'
from multi_year_video mv
where mc.module_id = mv.id;

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
## Build your need statement

Use AI to combine your answers from the previous module's four prompts into a fuller need statement.

### Aim for
- A few paragraphs, up to one page.
- Clear language about the problem and the people affected.

### Avoid for now
- Describing your organization.
- Describing your solution.
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
## Origin story

Many people freeze when asked to "tell their story," but relax when asked to assemble a few components.

You do not need to get this perfect. You do not need to write a polished story yet.

### Two ways to approach this
- Use a coaching session to develop your origin story. We will interview you, draft it, and revise until it feels true to you and aligned with your work.
- Answer the questions in the next section. Your responses will be the raw material for an initial draft you can refine later.
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
    (1, 1, 'intro-idea-to-impact-accelerator', 'Introduction: Idea to Impact Accelerator', 'Introduction to the accelerator: what we cover, why Coach House, and how it works.', 'link to our substack open NFP', null),
    (1, 2, 'start-with-your-why', 'Start with your why', 'How does your personal story relate to what you want to do?', null, 'Use this section to develop your origin story and connect it to your personal background. Write one to two pages and craft a background story that grounds your organizational why.'),
    (1, 3, 'what-is-the-need', 'What is the Need?', 'Using AI to explore how to establish a clearly articulated need statement.', null, 'Give thought to defining the need you are addressing as narrowly as possible in a brief statement or paragraph. Then move to the next module where you will refine the need statement with AI.'),
    (1, 4, 'ai-the-need', 'AI The Need', null, null, 'Use this section to develop your need statement. Be very clear about the problem, how serious it is, and any data that helps explain it. Do not yet describe your organization or solution.'),
    (1, 5, 'who-we-serve', 'Who We Serve', 'Clarify the specific people your work is focused on serving.', null, 'Use this section to clearly describe the population you are trying to reach, including their context, strengths, barriers, and boundaries.'),
    (2, 1, 'mission', 'Mission', 'Why do you exist?', 'Simon Sinek on Start with Why', 'Draft three or more mission statements, share them with others, and refine to a final draft. Check that accomplishing your mission would genuinely address the need.'),
    (2, 2, 'vision', 'Vision', 'Where do you want to go?', 'Peter Senge on Shared Vision', 'Reflect on your personal vision, draft a few versions of a potential vision statement, share for feedback, and refine. Compare it to the need and mission to ensure they fit together.'),
    (2, 3, 'values', 'Values', 'What do you believe?', null, 'Articulate the principles you feel so strongly about that you would not want to do the work without them. Describe the culture you want to build.'),
    (3, 1, 'theory-of-change', 'Theory of Change', 'Moving from why to what, one step ahead of program design.', null, 'Using your need, mission, vision, and values, work with AI to develop several IF-THEN-SO theory of change statements. Ensure the statement aligns with the larger organization and makes clear what you propose to do, what is likely to happen, and the long-term impact.'),
    (3, 2, 'systems-thinking', 'Systems Thinking', 'Applying a lens to consider the complex setting in which your program seeks to achieve its purpose.', 'Systems Thinking Questions', 'Using the systems thinking resource document, reflect on the questions and apply them to your organization. Share your description with AI and ask it to surface considerations you may have missed.'),
    (4, 1, 'develop-a-pilot', 'Program: Develop a Pilot', 'Why pilot a program?', 'Optional Video: The story of SE CBA as a pilot', null),
    (4, 2, 'program-models', 'Program Models', null, null, 'Decide which of the pilot models you will use as you design your program.'),
    (4, 3, 'designing-your-pilot', 'Designing your Pilot', null, null, 'Use the questions below to clarify your program. Drop them into AI, review the options it proposes, and iterate until you have a well-formed program description and, if needed, curricula for staff or volunteers.'),
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
from target_module tm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Budgeting for an Organization homework note
update modules m
set content_md = $MD$
## A Note on Organizational Budgets

Moving from a program budget to a full organizational budget is an important shift. Unlike a program budget, an organizational budget brings together multiple programs, shared staff, administrative costs, and overhead into a single financial picture.

Because of this added complexity, an organizational budget is rarely created effectively using a simple table alone.

We strongly recommend using a coaching session for this step. During coaching, we work with you to build your organizational budget directly in Excel or Google Sheets, helping you:
- Translate program-level costs into an organization-wide budget
- Allocate shared expenses thoughtfully across programs
- Understand cash flow, timing, and sustainability
- Create a budget that is usable for fundraising, board review, and day-to-day decision-making

If your organization has a bookkeeper or finance lead, they are welcome to join the coaching session. This allows us to align the budget with any existing or planned financial systems, such as QuickBooks or Monkeypod, and ensure that your budgeting approach connects cleanly to real-world bookkeeping and reporting.

If you choose to work on this independently, view your first organizational budget as a draft—a tool for learning and iteration rather than a final product.

Clarity, not perfection, is the goal.
$MD$
from classes c
where m.class_id = c.id
  and (
    m.slug = 'budgeting-for-an-organization'
    or lower(m.title) = 'budgeting for an organization'
    or (c.slug = 'session-s5-budgets-program' and m.idx = 2)
  );

-- From Budgeting to Bookkeeping notes
update modules m
set content_md = $MD$
## From Budgeting to Bookkeeping

This lesson focuses on making sure the plans you've developed—program budgets, organizational budgets, and multi-year projections—connect cleanly to how money is actually recorded, reported, and reviewed.

The most important next step after this lesson is a conversation.

We strongly recommend scheduling a conversation with your bookkeeper or accountant to review:
- How your budget structure aligns with your chart of accounts
- Whether your programs and expense categories can be tracked clearly
- How often financial reports should be reviewed and by whom
- What information is needed for board oversight, funders, and audits

You may choose to prepare for this conversation in a coaching session, where we help you:
- Clarify what questions to ask
- Translate your budget into bookkeeping-friendly categories
- Identify gaps between planning and reporting
- Feel confident leading the conversation

Alternatively, we can join the conversation with your bookkeeper or accountant. In these sessions, we help align strategy, budgeting, and bookkeeping in real time—ensuring that your financial systems support decision-making rather than creating confusion.

The goal is not complexity. The goal is clarity, consistency, and confidence in how your organization manages its finances.
$MD$
from classes c
where m.class_id = c.id
  and (
    m.slug = 'from-budgeting-to-bookkeeping'
    or lower(m.title) = 'from budgeting to bookkeeping'
    or (c.slug = 'session-s6-financials' and m.idx = 1)
  );

-- Reading Financial Statements notes
update modules m
set content_md = $MD$
## Reading Nonprofit Financial Statements

Understanding your organization's financial statements is a core leadership responsibility. You don't need to be an accountant—but you do need to know how to read, ask questions, and interpret what you're seeing.

This lesson introduces the three core nonprofit financial statements and what they are designed to tell you about the health of your organization.

We highly recommend reviewing these statements with your bookkeeper or accountant. Doing so helps ensure that:
- You understand how the statements are generated
- The numbers reflect how your organization actually operates
- You can spot trends, risks, or questions early
- Financial reporting supports board oversight and decision-making

If your organization does not yet have financial statements, but is ready to begin preparing them using accounting software, we recommend Monkeypod. Monkeypod combines nonprofit-friendly accounting software with efficient bookkeeping services, making it easier to produce accurate financial statements and understand them as a leader. Bookkeeping support is available starting at approximately $300 per month, making it a practical option for early-stage and growing organizations.

You may also choose to use a coaching session to prepare for or support this work. In coaching, we help you:
- Learn how to read financial statements with confidence
- Identify the key questions nonprofit leaders should ask
- Connect financial reports back to budgets and strategy
- Prepare for productive conversations with finance professionals and board members

Coaching sessions can be used either to prepare for a conversation with a bookkeeper or accountant, or to include them directly so that everyone is aligned around shared understanding.

The goal is not to master accounting. The goal is to become a financially literate nonprofit leader.
$MD$
from classes c
where m.class_id = c.id
  and (
    m.slug = 'financials-ie-bs-coa'
    or lower(m.title) in ('financials (ie, bs, coa)', 'reading nonprofit financial statements')
    or (c.slug = 'session-s6-financials' and m.idx = 2)
  );

-- Fundraising Fundamentals homework
with fundraising_modules as (
  select m.id, m.idx
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'fundraising-fundamentals'
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  fm.id,
  case
    when fm.idx = 1 then
      jsonb_build_object(
        'title', 'Fundraising mindset',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'fundraising_mindset',
            'label', 'Fundraising mindset',
            'type', 'long_text',
            'description', 'What idea or reframing from this lesson most shifted how you think about fundraising—and why did it resonate with you?',
            'placeholder', 'Share what changed for you and why it felt important.'
          )
        )
      )
    when fm.idx = 2 then
      jsonb_build_object(
        'title', 'Segmentation',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'segmentation_insight',
            'label', 'What insight from this lesson helped you better understand why different donors respond to different messages or approaches?',
            'type', 'long_text',
            'placeholder', 'Describe the insight that clicked for you.'
          ),
          jsonb_build_object(
            'name', 'segmentation_fit',
            'label', 'Which donor segment or donor type feels most natural or energizing for you to engage right now—and what makes that a good fit?',
            'type', 'long_text',
            'placeholder', 'Name the segment and why it fits your organization today.'
          ),
          jsonb_build_object(
            'name', 'segmentation_change',
            'label', 'After reviewing segmentation, what is one small change you could make to communicate more intentionally with a specific group of donors or supporters?',
            'type', 'long_text',
            'placeholder', 'Focus on tone, frequency, content, or the next best step.'
          )
        )
      )
    when fm.idx = 3 then
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
          )
        )
      )
    when fm.idx = 4 then
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
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Corporate giving strategy',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'corporate_sectors',
            'label', 'Identify high-fit corporate sectors (list 3–5).',
            'type', 'long_text',
            'placeholder', 'List the sectors that align with your mission and community.'
          ),
          jsonb_build_object(
            'name', 'corporate_companies',
            'label', 'List 5–10 specific companies that feel like strong fits.',
            'type', 'long_text',
            'placeholder', 'Include regional employers or mission-aligned brands.'
          ),
          jsonb_build_object(
            'name', 'corporate_network_map',
            'label', 'Map your network access for each company.',
            'type', 'long_text',
            'placeholder', 'Who do you know and how could they help you reach decision-makers?'
          ),
          jsonb_build_object(
            'name', 'corporate_entry_strategy',
            'label', 'Define the entry strategy for 2–3 priority companies.',
            'type', 'long_text',
            'placeholder', 'Who to speak with first and what you will ask for.'
          )
        )
      )
  end::jsonb,
  false
from fundraising_modules fm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Communications strategy homework
with comm_modules as (
  select m.id, m.idx
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'comprehensive-communications-strategy'
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  cm.id,
  case
    when cm.idx = 1 then
      jsonb_build_object(
        'title', 'Core communications content',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'inform_community',
            'label', 'Inform — Community members',
            'type', 'long_text',
            'description', 'What does the broader community need to understand? (problem, who you serve, what you offer, where you operate, how to stay connected)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'inform_partners',
            'label', 'Inform — Partners & ecosystem',
            'type', 'long_text',
            'description', 'What do partners need in order to collaborate effectively? (mission alignment, program model, referral pathways, points of contact)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'inform_clients',
            'label', 'Inform — Clients / participants',
            'type', 'long_text',
            'description', 'What information helps people access and navigate your services? (eligibility, schedules, locations, enrollment steps, expectations)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'inspire_community',
            'label', 'Inspire — Community members',
            'type', 'long_text',
            'description', 'What builds belief, pride, and emotional connection? (impact stories, community wins, progress updates)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'inspire_partners',
            'label', 'Inspire — Partners & ecosystem',
            'type', 'long_text',
            'description', 'What helps partners feel connected? (shared successes, outcomes achieved together, lessons learned)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'inspire_clients',
            'label', 'Inspire — Clients / participants',
            'type', 'long_text',
            'description', 'What affirms and motivates participants? (milestones, affirmations, peer success)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'invite_community',
            'label', 'Invite — Community members',
            'type', 'long_text',
            'description', 'What actions do you want them to take? (events, follow, volunteer, donate)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'invite_partners',
            'label', 'Invite — Partners & ecosystem',
            'type', 'long_text',
            'description', 'How should partners engage? (co-host programs, refer clients, provide funding)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'invite_clients',
            'label', 'Invite — Clients / participants',
            'type', 'long_text',
            'description', 'What do you want participants to do next? (enroll, attend sessions, provide feedback)',
            'placeholder', 'List brief items.'
          ),
          jsonb_build_object(
            'name', 'comms_reflection',
            'label', 'Closing reflection (1 sentence)',
            'type', 'long_text',
            'placeholder', 'What did you notice when you separated your communications into inform, inspire, invite?'
          )
        )
      )
    when cm.idx = 2 then
      jsonb_build_object(
        'title', 'Case for support',
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
          )
        )
      )
    when cm.idx = 3 then
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
          )
        )
      )
    when cm.idx = 4 then
      jsonb_build_object(
        'title', 'Tools and systems',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'tools_current',
            'label', 'Current tools',
            'type', 'long_text',
            'description', 'List tools you use for fundraising, communications, events, donor tracking, or financial transparency.',
            'placeholder', 'CRM, email, giving platforms, event tools, social media, design, accounting, etc.'
          ),
          jsonb_build_object(
            'name', 'tools_support',
            'label', 'Tools you want help with',
            'type', 'long_text',
            'description', 'List any tools or systems you want support setting up or learning.',
            'placeholder', 'CRM setup, migrations, automation, integrations, etc.'
          )
        )
      )
    else
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
          )
        )
      )
  end::jsonb,
  false
from comm_modules cm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Seed structured assignment schema for the Multi-year Budgeting module.
with multi_year_module as (
  select m.id
  from modules m
  where m.slug = 'multi-year-budgeting'
     or lower(m.title) = 'multi-year budgeting'
  limit 1
)
update modules m
set content_md = $MD$
## Preparing for a Multi-Year Budget

Before building a multi-year budget, it's important to step back and clarify your intentions and assumptions. A multi-year budget is not just a financial exercise—it is a reflection of your strategy, priorities, and capacity for growth.

Answer the questions below to prepare for this work.

## Coaching Recommendation

We strongly recommend using a coaching session to translate these reflections into a practical multi-year budget. During coaching, we can include key voices—such as staff, board members, partners, or finance professionals—to ensure your assumptions are realistic, shared, and aligned with your organization's capacity.

This approach helps turn long-range thinking into a credible, usable financial plan.
$MD$
from multi_year_module mym
where m.id = mym.id;

with multi_year_module as (
  select m.id
  from modules m
  where m.slug = 'multi-year-budgeting'
     or lower(m.title) = 'multi-year budgeting'
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  mym.id,
  jsonb_build_object(
    'title', 'Multi-year Budget Worksheet',
    'fields', jsonb_build_array(
      jsonb_build_object(
        'name', 'growth_intro',
        'label', 'Growth & Direction',
        'type', 'subtitle'
      ),
      jsonb_build_object(
        'name', 'growth_direction',
        'label', 'Over the next 2–3 years, what do you want to happen to your organization?',
        'type', 'select',
        'options', jsonb_build_array(
          'Maintain current size and scope',
          'Grow intentionally',
          'Not sure yet'
        )
      ),
      jsonb_build_object(
        'name', 'growth_targets',
        'label', 'If growth is a goal, what do you expect to grow? (Check all that apply.)',
        'type', 'multi_select',
        'options', jsonb_build_array(
          'Number of people served',
          'Number of sessions, cohorts, or gatherings',
          'Number of programs',
          'Geographic reach',
          'Depth or intensity of services',
          'All of the above'
        )
      ),
      jsonb_build_object(
        'name', 'growth_description',
        'label', 'Briefly describe what growth would look like in practice.',
        'type', 'long_text',
        'placeholder', 'Describe what you expect to expand or deepen over time.'
      ),
      jsonb_build_object(
        'name', 'program_intro',
        'label', 'Program Implications',
        'type', 'subtitle'
      ),
      jsonb_build_object(
        'name', 'program_implications',
        'label', 'If your programs expand or change, what would need to be different?',
        'type', 'long_text',
        'description', 'More staff or facilitators?\nMore space or longer program timelines?\nHigher per-participant costs?\nAdditional evaluation or reporting requirements?',
        'placeholder', 'List the shifts you anticipate.'
      ),
      jsonb_build_object(
        'name', 'program_assumptions',
        'label', 'What assumptions are you currently making about how growth would happen?',
        'type', 'long_text',
        'placeholder', 'Describe what you believe must be true for growth.'
      ),
      jsonb_build_object(
        'name', 'future_intro',
        'label', 'Future Expenses Not Reflected Today',
        'type', 'subtitle'
      ),
      jsonb_build_object(
        'name', 'future_expenses',
        'label', 'Are there expenses you expect in Year 2 or Year 3 that are not included in your current budget?',
        'type', 'multi_select',
        'description', 'Consider items such as:\n- Additional staff positions\n- Salary increases or benefits\n- Professional services (accounting, legal, HR)\n- Equipment or technology purchases\n- Vehicles or specialized tools\n- Facility costs or real estate\n- Insurance or compliance-related costs',
        'options', jsonb_build_array(
          'Additional staff positions',
          'Salary increases or benefits',
          'Professional services (accounting, legal, HR)',
          'Equipment or technology purchases',
          'Vehicles or specialized tools',
          'Facility costs or real estate',
          'Insurance or compliance-related costs'
        )
      ),
      jsonb_build_object(
        'name', 'future_expenses_notes',
        'label', 'List any anticipated future expenses and when they might occur.',
        'type', 'long_text',
        'placeholder', 'Note expenses and timing for Year 2 or Year 3.'
      ),
      jsonb_build_object(
        'name', 'capacity_intro',
        'label', 'Capacity & Sustainability',
        'type', 'subtitle'
      ),
      jsonb_build_object(
        'name', 'capacity_requirements',
        'label', 'What would need to be true for your organization to support this growth responsibly?',
        'type', 'long_text',
        'description', 'Leadership capacity\nStaff or volunteer bandwidth\nFundraising or earned revenue growth\nSystems and infrastructure',
        'placeholder', 'List the capacity requirements you foresee.'
      ),
      jsonb_build_object(
        'name', 'capacity_confidence',
        'label', 'Where do you feel confident—and where do you feel uncertain?',
        'type', 'long_text',
        'placeholder', 'Share where you feel ready and where you need clarity.'
      ),
      jsonb_build_object(
        'name', 'conversation_intro',
        'label', 'Who Should Be Part of This Conversation?',
        'type', 'subtitle'
      ),
      jsonb_build_object(
        'name', 'conversation_participants',
        'label', 'Who should be involved or consulted as you think about the next 2–3 years?',
        'type', 'multi_select',
        'options', jsonb_build_array(
          'Key staff',
          'Board members',
          'Bookkeeper or accountant',
          'Program partners',
          'Volunteers or community advisors'
        )
      ),
      jsonb_build_object(
        'name', 'conversation_notes',
        'label', 'List specific people you would want to invite into this planning process.',
        'type', 'long_text',
        'placeholder', 'List names, roles, or teams to include.'
      )
    )
  )::jsonb,
  false
from multi_year_module mym
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
      )
    else
      jsonb_build_object(
        'title', 'Need statement (refinement)',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'need_refine_intro',
            'label', 'Draft with AI',
            'type', 'subtitle',
            'description', 'Use AI to combine your answers from the previous module''s four prompts into a fuller need statement (up to one page).'
          ),
          jsonb_build_object(
            'name', 'need_refined',
            'label', 'AI-supported need statement',
            'type', 'long_text',
            'org_key', 'need',
            'placeholder', 'Draft a fuller statement (a few paragraphs up to one page).'
          )
        )
      )
  end::jsonb,
  true
from need_modules nm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Seed assignment schema for Strategic Foundations "Who We Serve"
-- so the document's third exercise appears as its own guided lesson.
with who_we_serve_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'who-we-serve'
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  wsm.id,
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
from who_we_serve_module wsm
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
      )
    when mv.slug = 'vision' then
      jsonb_build_object(
        'title', 'Vision Statement',
        'roadmap_section', 'mission_vision_values',
        'completion_mode', 'all_answered',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'vision_intro',
            'label', 'Defining your vision',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Your vision describes the future you are working toward.\n\nIf your origin story explains where this work comes from, your need statement defines the problem, and your mission describes what you do and the difference you make, your vision answers: what does the world look like if your work succeeds, what is different for the people and communities you serve, and what long-term change are you working toward?\n\nA strong vision does not describe programs or activities. It describes the end result: a desired future that is meaningfully different from what exists today.'
          ),
          jsonb_build_object(
            'name', 'vision_realistic_aspirational_intro',
            'label', 'Realistic or aspirational vision',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'There are two valid approaches to vision statements.\n\nA realistic vision describes a concrete, measurable future outcome, such as 200 quality jobs created along 61st Street.\n\nAn aspirational vision describes a broader, values-driven future, such as no family will be left to suffer alone.\n\nBoth approaches are valid, but choose intentionally. A realistic vision provides clarity and measurable direction. An aspirational vision provides inspiration and long-term purpose.'
          ),
          jsonb_build_object(
            'name', 'vision_approach_intro',
            'label', 'How to approach this exercise',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Your responses will later help generate draft vision statements that reflect your perspective and aspirations for the future.'
          ),
          jsonb_build_object(
            'name', 'vision_people_intro',
            'label', 'Section 1 — The future for the people you serve',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Start with the future you want for the people you serve: the opportunities they will have, the challenges they will no longer face, and how daily life will improve.'
          ),
          jsonb_build_object(
            'name', 'vision_people_difference',
            'label', 'If your work is successful, what will be different in the lives of the people you serve?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Think about opportunities they will have, challenges they will no longer face, and how their daily lives will improve.',
            'placeholder', 'Describe what changes for the people you serve...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_individual_success',
            'label', 'What does success look like for individuals?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe what success looks like at the individual level...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_community_intro',
            'label', 'Section 2 — The future for the community',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Now widen the lens to the broader community or environment, including neighborhoods, systems, culture, or norms.'
          ),
          jsonb_build_object(
            'name', 'vision_community_difference',
            'label', 'What will be different in the broader community or environment?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Think about neighborhoods, systems such as education, workforce, or health, and culture or norms.',
            'placeholder', 'Describe what changes in the broader community...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_visible_changes',
            'label', 'What positive changes would others be able to see or feel?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe the visible or felt changes others would notice...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_long_term_intro',
            'label', 'Section 3 — Long-term change',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Look beyond the near term and name the lasting change you hope your work can help create.'
          ),
          jsonb_build_object(
            'name', 'vision_lasting_change',
            'label', 'Looking 5-10 years ahead, what lasting change do you hope to see?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe the long-term change you hope to see...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_scaled_impact',
            'label', 'If your work scaled or grew, what larger impact could it have?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe the larger impact your work could have over time...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_problem_removed_intro',
            'label', 'Section 4 — Removing the problem',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Connect the vision back to the need statement by naming what would be different if the problem were meaningfully addressed.'
          ),
          jsonb_build_object(
            'name', 'vision_need_addressed',
            'label', 'If the problem you described in your need statement were addressed, what would be different?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe what changes if the need is meaningfully addressed...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_problem_lower_level',
            'label', 'What would no longer exist, or would exist at a much lower level?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe what decreases, disappears, or becomes far less common...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_type_intro',
            'label', 'Section 5 — Choosing your vision type',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Choose intentionally between a concrete measurable vision and a broader values-driven vision.'
          ),
          jsonb_build_object(
            'name', 'vision_type',
            'label', 'Do you want your vision to be more concrete and measurable, or broad and values-driven?',
            'type', 'select',
            'screen', 'question',
            'options', jsonb_build_array(
              'Concrete and measurable',
              'Broad and values-driven',
              'A blend of both'
            ),
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_type_reason',
            'label', 'Why does this approach fit your work?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Explain why this kind of vision fits your work and audience...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_pulling_together_intro',
            'label', 'Section 6 — Pulling it together',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Bring the answers together into a natural description of the future you are working toward.'
          ),
          jsonb_build_object(
            'name', 'vision_pulling_together',
            'label', 'In your own words, describe the future you are working toward.',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Speak this naturally in 1-2 paragraphs.',
            'placeholder', 'Describe the future you are working toward...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_ai_prompt_intro',
            'label', 'What happens next',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Your responses can later be used to generate four vision statement options that describe a desired future meaningfully different from today, focus on what is different for people and communities, reflect long-term change, and align with your selected vision type.'
          ),
          jsonb_build_object(
            'name', 'vision_final_statement',
            'label', 'Write or paste your preferred vision statement draft.',
            'type', 'long_text',
            'org_key', 'vision',
            'screen', 'question',
            'description', 'Aim for one clear sentence focused on the desired future.',
            'placeholder', 'Write a clear, compelling vision statement...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'vision_examples_intro',
            'label', 'Examples to notice',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Strong vision statements describe a future state, not current work. They reflect a desired future different from today, focus on people and outcomes, choose realistic or aspirational intentionally, and stay clear and concise.'
          )
        )
      )
    else
      jsonb_build_object(
        'title', 'Core Values',
        'roadmap_section', 'mission_vision_values',
        'completion_mode', 'all_answered',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'values_intro',
            'label', 'Defining your core values',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Your core values define how your organization operates and makes decisions.\n\nIf your origin story explains where this work comes from, your need statement defines the problem, your mission describes what you do and the difference you make, and your vision defines the future you are working toward, your values answer: how do you show up in this work, what principles guide your decisions, and what does it look like to do this work well?\n\nCore values are deeply held beliefs: the principles you are unwilling to compromise, even under pressure.'
          ),
          jsonb_build_object(
            'name', 'values_quality_intro',
            'label', 'What makes a value real',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Core values are not aspirational slogans or marketing language. They should be enduring, authentic, behavioral, and distinctive.\n\nA useful value reflects what you truly believe, shows up in how you act and make decisions, and differentiates how your organization operates from others.'
          ),
          jsonb_build_object(
            'name', 'values_approach_intro',
            'label', 'How to approach this exercise',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Capture your thinking in your own words. There are no right answers.\n\nWe recommend speaking your responses out loud with voice-to-text instead of trying to craft perfect sentences. Your responses will later help generate a set of core values that reflect your beliefs, standards, and approach to this work.'
          ),
          jsonb_build_object(
            'name', 'values_deep_beliefs_intro',
            'label', 'Section 1 — Your deepest beliefs',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Start by naming what you believe deeply about the work and the people you serve.'
          ),
          jsonb_build_object(
            'name', 'values_deep_beliefs',
            'label', 'What do you believe deeply about this work and the people you serve?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Think about what you know to be true from experience, what others often get wrong, and what you feel strongly about even when it is not easy.',
            'placeholder', 'Describe the beliefs that sit underneath your work...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_hard_principles',
            'label', 'What principles would you hold onto, even if they made your work harder?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'This is a key Good to Great test of real values.',
            'placeholder', 'Name the principles you would keep even under pressure...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_stand_for_intro',
            'label', 'Section 2 — What you stand for and against',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Real values often become clear when you name what you are committed to doing differently.'
          ),
          jsonb_build_object(
            'name', 'values_stand_for',
            'label', 'What do you stand for in how this work should be done?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe what you stand for in how the work is carried out...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_do_differently',
            'label', 'What have you seen done poorly that you are committed to doing differently?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Real values often emerge from frustration with what does not work.',
            'placeholder', 'Describe what you have seen done poorly and how you want to operate differently...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_refuse_accept',
            'label', 'What would you push back on or refuse to accept in your field?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Name the patterns, shortcuts, or compromises you would refuse...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_behavior_intro',
            'label', 'Section 3 — Behavior and standards',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Values must show up in action. Describe the behaviors, treatment, and standards that make the values real.'
          ),
          jsonb_build_object(
            'name', 'values_best_operating',
            'label', 'What does it look like when your organization is operating at its best?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe what people would see, feel, and experience when the organization is at its best...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_treatment',
            'label', 'How should people be treated in your work?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Consider participants, staff, partners, and community members.',
            'placeholder', 'Describe the standard of treatment you want to uphold...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_non_negotiable_behaviors',
            'label', 'What behaviors are non-negotiable?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'List the behaviors and standards that must be consistently protected...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_pressure_intro',
            'label', 'Section 4 — Decision-making under pressure',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Values matter most when decisions are hard. Name the principles that guide tradeoffs and boundaries.'
          ),
          jsonb_build_object(
            'name', 'values_decision_principles',
            'label', 'When faced with a difficult decision, what principles will guide your choices?',
            'type', 'long_text',
            'screen', 'question',
            'placeholder', 'Describe the principles you would use when the decision is hard...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_never_do',
            'label', 'What would you never do, even if it would lead to more funding, growth, or visibility?',
            'type', 'long_text',
            'screen', 'question',
            'description', 'This question often reveals the most important values.',
            'placeholder', 'Name the compromises you would not make...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_pulling_together_intro',
            'label', 'Section 5 — Pulling it together',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Bring the answers together into a natural description of the principles that should guide the organization.'
          ),
          jsonb_build_object(
            'name', 'values_pulling_together',
            'label', 'In your own words, describe the principles that should guide your organization.',
            'type', 'long_text',
            'screen', 'question',
            'description', 'Speak this naturally in 1-2 paragraphs.',
            'placeholder', 'Describe the principles that should guide the organization...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_ai_prompt_intro',
            'label', 'What happens next',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Your responses can later be used to generate 5-7 core values. Each value should include a concise title and a brief description explaining what the value means in practice.'
          ),
          jsonb_build_object(
            'name', 'values_final_set',
            'label', 'Write or paste your preferred core values set.',
            'type', 'long_text',
            'org_key', 'values',
            'screen', 'question',
            'description', 'Include 5-7 values with a short title and practical description for each.',
            'placeholder', 'List each core value with a brief practical description...',
            'required', false
          ),
          jsonb_build_object(
            'name', 'values_examples_intro',
            'label', 'Examples to notice',
            'type', 'subtitle',
            'screen', 'intro',
            'description', 'Strong core values reflect deep beliefs, describe how the organization behaves, guide real decisions under pressure, and stay specific and meaningful rather than generic.'
          )
        )
      )
  end::jsonb,
  true
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
        'label', 'What items will incur a direct cost? (Don\\'t worry about amounts for now).',
        'type', 'long_text',
        'placeholder', 'Staff time, supplies, incentives, and other direct expenses.'
      ),
      jsonb_build_object(
        'name', 'pilot_indirect_costs',
        'label', 'What items will incur an indirect cost? (Don\\'t worry about amounts for now).',
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
update modules m
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
from toc_module t
where m.id = t.id;

insert into module_assignments (module_id, schema, complete_on_submit)
select
  t.id,
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
from toc_module t
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

with systems_module as (
  select m.id from classes c join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change' and m.slug = 'systems-thinking' limit 1
)
update modules m
set description = 'Applying a systems thinking approach to evaluate the complexities in which your program seeks to achieve its purpose.',
    content_md = $MD$
## Systems Thinking — Program Design Reflection

Applying today's lesson is about thinking critically and creatively as you move from describing a problem to designing an actual program. Systems thinking helps you slow down just enough to consider how change might happen—not just what you want to do.

With that in mind, fill in the following boxes. This exercise is not about getting the "right" answer; it's about thinking thoughtfully about how your program fits within a broader system.
$MD$
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

      jsonb_build_object(
        'name', 'st_program_snapshot',
        'label', 'Program Snapshot',
        'type', 'long_text'
      ),
      jsonb_build_object(
        'name', 'st_problem_response',
        'label', 'What Problem Is This Program Responding To—and What Contributes to It?',
        'type', 'long_text'
      ),
      jsonb_build_object(
        'name', 'st_success_connections',
        'label', 'What Else Is Connected to This Program’s Success?',
        'type', 'long_text'
      ),
      jsonb_build_object(
        'name', 'st_changes_for_whom',
        'label', 'If This Program Works Well, What Changes—and for Whom?',
        'type', 'long_text'
      ),
      jsonb_build_object(
        'name', 'st_assumption_change',
        'label', 'What Assumption Are You Making About How Change Will Happen?',
        'type', 'long_text'
      )
    )
  )::jsonb,
  false
from systems_module sm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Seed structured assignment schema for the Budgeting for a Program module.
with program_budget_module as (
  select m.id
  from modules m
  join classes c on c.id = m.class_id
  where m.slug = 'budgeting-for-a-program'
     or lower(m.title) = 'budgeting for a program'
     or (c.slug = 'budgeting-financial-basics' and m.idx = 1)
  order by
    case
      when m.slug = 'budgeting-for-a-program' then 0
      when lower(m.title) = 'budgeting for a program' then 1
      when c.slug = 'budgeting-financial-basics' and m.idx = 1 then 2
      else 3
    end,
    m.updated_at desc nulls last
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  pbm.id,
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
        'category', 'Evaluation & Data',
        'description', 'Surveys, tools, stipends for evaluation',
        'costType', 'Fixed or Variable',
        'unit', 'Program / Participant',
        'units', '',
        'costPerUnit', '',
        'totalCost', ''
      ),
      jsonb_build_object(
        'category', 'Other Direct Costs',
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
from program_budget_module pbm
on conflict (module_id) do update set
  schema = excluded.schema,
  complete_on_submit = excluded.complete_on_submit;

-- Align accelerator curriculum (classes/modules) to current app structure.
with target_classes as (
  select * from (values
    ('strategic-foundations', 'Strategic Foundations', 1),
    ('mission-vision-values', 'Mission, Vision & Values', 2),
    ('theory-of-change', 'Theory of Change & Systems Thinking', 3),
    ('piloting-programs', 'Piloting Programs', 4),
    ('session-s5-budgets-program', 'Budgets', 5),
    ('session-s6-budgets-to-bookkeeping', 'Intro to NFP Financials', 6),
    ('session-s7-mindset', 'Fundraising', 7),
    ('session-s8-comms-as-mission', 'Communications', 8),
    ('session-s9-intro-to-boards', 'Boards that make a difference', 9),
    ('electives', 'Electives', 10)
  ) as t(slug, title, position)
)
insert into classes (slug, title, position, is_published)
select slug, title, position, true from target_classes
on conflict (slug) do update
  set title = excluded.title,
      position = excluded.position,
      is_published = true,
      description = coalesce(excluded.description, classes.description);

with class_ids as (
  select id, slug from classes
), target_modules as (
  select * from (values
    ('strategic-foundations', 1, 'introduction-idea-to-impact-accelerator', 'Introduction: Idea to Impact Accelerator'),
    ('strategic-foundations', 2, 'start-with-your-why', 'Start with your why'),
    ('strategic-foundations', 3, 'what-is-the-need', 'What is the Need?'),
    ('strategic-foundations', 4, 'ai-the-need', 'AI The Need'),

    ('mission-vision-values', 1, 'mission', 'Mission'),
    ('mission-vision-values', 2, 'vision', 'Vision'),
    ('mission-vision-values', 3, 'values', 'Values'),

    ('theory-of-change', 1, 'theory-of-change', 'Theory of Change'),
    ('theory-of-change', 2, 'systems-thinking', 'Systems Thinking'),

    ('piloting-programs', 1, 'program-develop-a-pilot', 'Program: Develop a Pilot'),
    ('piloting-programs', 2, 'program-models', 'Program Models'),
    ('piloting-programs', 3, 'designing-your-pilot', 'Designing your Pilot'),
    ('piloting-programs', 4, 'evaluation', 'Evaluation'),

    ('session-s5-budgets-program', 1, 'budgeting-for-a-program', 'Budgeting for a Program'),
    ('session-s5-budgets-program', 2, 'budgeting-for-an-organization', 'Budgeting for an Organization'),
    ('session-s5-budgets-program', 3, 'multi-year-budgeting', 'Multi-year Budgeting'),
    ('session-s5-budgets-program', 4, 'mid-year-budget-usage', 'Mid year budget usage'),

    ('session-s6-budgets-to-bookkeeping', 1, 'from-budgeting-to-bookkeeping', 'From Budgeting to Bookkeeping'),
    ('session-s6-budgets-to-bookkeeping', 2, 'financials-ie-bs-coa', 'Financials (IE, BS, COA)'),

    ('session-s7-mindset', 1, 'mindset', 'Mindset'),
    ('session-s7-mindset', 2, 'segmentation', 'Segmentation'),
    ('session-s7-mindset', 3, 'treasure-mapping', 'Treasure Mapping'),
    ('session-s7-mindset', 4, 'donor-journey', 'Donor Journey'),
    ('session-s7-mindset', 5, 'channels', 'Channels'),
    ('session-s7-mindset', 6, 'storytelling-and-the-ask', 'Storytelling & the Ask'),
    ('session-s7-mindset', 7, 'tools-and-systems', 'Tools & Systems'),
    ('session-s7-mindset', 8, 'corporate-giving', 'Corporate Giving'),

    ('session-s8-comms-as-mission', 1, 'comms-as-mission', 'Comms as Mission'),
    ('session-s8-comms-as-mission', 2, 'branding', 'Branding'),
    ('session-s8-comms-as-mission', 3, 'comprehensive-plan', 'Comprehensive Plan'),

    ('session-s9-intro-to-boards', 1, 'intro-to-boards', 'Intro to Boards'),
    ('session-s9-intro-to-boards', 2, 'policy-1-and-2-ends-means', 'Policy 1 & 2: Ends, Means'),
    ('session-s9-intro-to-boards', 3, 'policy-3-board-staff-linkage', 'Policy 3: Board Staff Linkage'),
    ('session-s9-intro-to-boards', 4, 'policy-4-board-self-governance', 'Policy 4: Board Self Governance'),
    ('session-s9-intro-to-boards', 5, 'annual-calendar', 'Annual Calendar'),
    ('session-s9-intro-to-boards', 6, 'agendas-minutes-resolutions', 'Agendas, Minutes, Resolutions'),

    ('electives', 1, 'financial-handbook', 'Financial Handbook'),
    ('electives', 2, 'due-diligence', 'Due Diligence'),
    ('electives', 3, 'retention-and-security', 'Retention and Security'),
    ('electives', 4, 'naming-your-nfp', 'Naming your NFP'),
    ('electives', 5, 'nfp-registration', 'NFP Registration'),
    ('electives', 6, 'filing-1023', 'Filing 1023')
  ) as t(class_slug, idx, slug, title)
)
insert into modules (class_id, idx, slug, title, is_published)
select c.id, tm.idx, tm.slug, tm.title, true
from target_modules tm
join class_ids c on c.slug = tm.class_slug
on conflict (class_id, idx) do update
  set slug = excluded.slug,
      title = excluded.title,
      is_published = true,
      description = coalesce(excluded.description, modules.description);

-- Archive legacy curriculum classes/modules so the sidebar matches the current list.
with target_slugs as (
  select slug from (values
    ('strategic-foundations'),
    ('mission-vision-values'),
    ('theory-of-change'),
    ('piloting-programs'),
    ('session-s5-budgets-program'),
    ('session-s6-budgets-to-bookkeeping'),
    ('session-s7-mindset'),
    ('session-s8-comms-as-mission'),
    ('session-s9-intro-to-boards'),
    ('electives')
  ) as t(slug)
), legacy_classes as (
  select id
  from classes
  where (slug like 'session-%' and slug not in (select slug from target_slugs))
     or slug in (
       'foundations',
       'strategic-thinking-theory-of-change',
       'program-design-pilot',
       'evaluation-data-tracking',
       'budgeting-financial-basics',
       'comprehensive-communications-strategy',
       'fundraising-fundamentals',
       'board-engagement-governance',
       'post-course-deliverables',
       'legal-structures-and-incorporation',
       'compliance-and-security',
       'financial-systems-and-audits',
       'branding-messaging-and-audience-strategy',
       'marketing-and-pr',
       'grant-writing',
       'major-donor-cultivation',
       'pitch-deck-design-and-storytelling',
       'introduction-to-crm-design-and-management'
     )
)
update modules
set is_published = false
where class_id in (select id from legacy_classes);

with target_slugs as (
  select slug from (values
    ('strategic-foundations'),
    ('mission-vision-values'),
    ('theory-of-change'),
    ('piloting-programs'),
    ('session-s5-budgets-program'),
    ('session-s6-budgets-to-bookkeeping'),
    ('session-s7-mindset'),
    ('session-s8-comms-as-mission'),
    ('session-s9-intro-to-boards'),
    ('electives')
  ) as t(slug)
), legacy_classes as (
  select id
  from classes
  where (slug like 'session-%' and slug not in (select slug from target_slugs))
     or slug in (
       'foundations',
       'strategic-thinking-theory-of-change',
       'program-design-pilot',
       'evaluation-data-tracking',
       'budgeting-financial-basics',
       'comprehensive-communications-strategy',
       'fundraising-fundamentals',
       'board-engagement-governance',
       'post-course-deliverables',
       'legal-structures-and-incorporation',
       'compliance-and-security',
       'financial-systems-and-audits',
       'branding-messaging-and-audience-strategy',
       'marketing-and-pr',
       'grant-writing',
       'major-donor-cultivation',
       'pitch-deck-design-and-storytelling',
       'introduction-to-crm-design-and-management'
     )
)
update classes
set is_published = false
where id in (select id from legacy_classes);
