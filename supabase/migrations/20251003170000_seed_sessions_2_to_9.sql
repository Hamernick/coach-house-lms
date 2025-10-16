-- Seed Sessions 2–9 with initial modules
set check_function_bodies = off;
set search_path = public;

-- Helper to upsert a class and return id
create or replace function upsert_class(p_slug text, p_title text, p_desc text, p_published boolean, p_position int)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into classes (slug, title, description, is_published)
  values (p_slug, p_title, p_desc, p_published)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_id;
  return v_id;
end;
$$;

do $$
declare
  c2 uuid;
  c3 uuid;
  c4 uuid;
  c5 uuid;
  c6 uuid;
  c7 uuid;
  c8 uuid;
  c9 uuid;
begin
  c2 := upsert_class('mission-vision-values', 'Session 2 – Mission, Vision, Values', 'Clarify core purpose and values.', true, 2);
  c3 := upsert_class('strategic-thinking-theory-of-change', 'Session 3 – Strategic Thinking & Theory of Change', 'Define outcomes and logic model.', true, 3);
  c4 := upsert_class('program-design-pilot', 'Session 4 – Program Design & Pilot', 'Design pilot programs and feedback loops.', true, 4);
  c5 := upsert_class('evaluation-data-tracking', 'Session 5 – Evaluation & Data Tracking', 'Measure impact and collect data ethically.', true, 5);
  c6 := upsert_class('budgeting-financial-basics', 'Session 6 – Budgeting & Financial Basics', 'Plan budgets and read financials.', true, 6);
  c7 := upsert_class('comprehensive-communications-strategy', 'Session 7 – Comprehensive Communications Strategy', 'Audience, messaging, channels.', true, 7);
  c8 := upsert_class('fundraising-fundamentals', 'Session 8 – Fundraising Fundamentals', 'Diversify revenue and build pipelines.', true, 8);
  c9 := upsert_class('board-engagement-governance', 'Session 9 – Board Engagement & Governance', 'Roles, responsibilities, effectiveness.', true, 9);

  -- Each session: upsert 5 modules with simple titles and publish
  with defs as (
    select * from (values
      (c2, 1, 'Defining Mission', 'Mission statements that work'),
      (c2, 2, 'Vision Setting', 'Imagining outcomes'),
      (c2, 3, 'Values Workshop', 'Operationalizing values'),
      (c2, 4, 'Case Studies', 'Examples in the wild'),
      (c2, 5, 'Summary & Homework', 'Apply to your org'),

      (c3, 1, 'Intro to Strategy', 'Strategy vs tactics'),
      (c3, 2, 'Outcomes & Metrics', 'Choose indicators'),
      (c3, 3, 'Theory of Change', 'Draft your ToC'),
      (c3, 4, 'Risks & Assumptions', 'Surface constraints'),
      (c3, 5, 'Summary & Homework', 'Refine your ToC'),

      (c4, 1, 'Program Design Basics', 'Inputs, activities, outputs'),
      (c4, 2, 'Pilot Planning', 'Scope, timeline, criteria'),
      (c4, 3, 'Feedback Loops', 'Collect and act'),
      (c4, 4, 'MVP Scoping', 'Right-size experiments'),
      (c4, 5, 'Summary & Homework', 'Pilot brief'),

      (c5, 1, 'Evaluation 101', 'Methods & ethics'),
      (c5, 2, 'Data Model', 'What to track'),
      (c5, 3, 'Tooling Overview', 'Spreadsheets to CRMs'),
      (c5, 4, 'Dashboards', 'Share insights'),
      (c5, 5, 'Summary & Homework', 'Plan your measures'),

      (c6, 1, 'Budget Fundamentals', 'Reading budgets'),
      (c6, 2, 'Forecasting', 'Scenarios & drivers'),
      (c6, 3, 'Cash Flow', 'Timing & reserves'),
      (c6, 4, 'Controls & Policies', 'Basics that matter'),
      (c6, 5, 'Summary & Homework', 'Build a draft'),

      (c7, 1, 'Audience & Goals', 'Who and why'),
      (c7, 2, 'Messaging', 'Value prop & story'),
      (c7, 3, 'Channels & Calendar', 'Reach & cadence'),
      (c7, 4, 'Content', 'Formats & examples'),
      (c7, 5, 'Summary & Homework', 'Plan next 90 days'),

      (c8, 1, 'Fundraising Landscape', 'Sources & ethics'),
      (c8, 2, 'Prospecting', 'Research & fit'),
      (c8, 3, 'Stewardship', 'Relationships & CRM'),
      (c8, 4, 'Grants & Appeals', 'Write & pitch'),
      (c8, 5, 'Summary & Homework', 'Pipeline next steps'),

      (c9, 1, 'Board Basics', 'Fiduciary duties'),
      (c9, 2, 'Recruit & Onboard', 'Composition & roles'),
      (c9, 3, 'Effective Meetings', 'Agendas & decisions'),
      (c9, 4, 'Governance', 'Policies & bylaws'),
      (c9, 5, 'Summary & Homework', 'Board development plan')
    ) as t(class_id, idx, title, description)
  )
  insert into modules (class_id, idx, slug, title, description, is_published)
  select class_id, idx, concat('m', idx), title, description, true from defs
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;
end $$;

drop function if exists upsert_class(text, text, text, boolean, int);

