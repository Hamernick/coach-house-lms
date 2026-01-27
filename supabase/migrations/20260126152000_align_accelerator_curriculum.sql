set search_path = public;

-- Canonical accelerator curriculum as of 2026-01-26
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

-- Archive legacy curriculum classes/modules so the app reflects the canonical list.
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
