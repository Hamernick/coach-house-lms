set search_path = public;

-- Refresh AI The Need guidance
with ai_need_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'ai-the-need'
  limit 1
)
update modules m
set content_md = $MD$
## Build your need statement

Use AI to combine your answers from the previous module's four prompts into a fuller need statement.

### Aim for
- A few paragraphs, up to one page.
- Clear language about the problem and the people affected.

### Avoid for now
- Describing your organization.
- Describing your solution.
$MD$
from ai_need_module anm
where m.id = anm.id;

with ai_need_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'ai-the-need'
  limit 1
)
insert into module_assignments (module_id, schema, complete_on_submit)
select
  anm.id,
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
  )::jsonb,
  false
from ai_need_module anm
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
