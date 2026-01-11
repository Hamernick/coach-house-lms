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
      )
    when mv.slug = 'vision' then
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
      )
    else
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

update module_assignments ma
set schema = jsonb_build_object(
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
)::jsonb
from toc_module t
where ma.module_id = t.id;

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
