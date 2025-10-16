set check_function_bodies = off;
set search_path = public;

-- Seed classes and placeholder modules to match Academy nav (electives + deliverables)

do $$
declare
  v_deliverables uuid;
  v_class_id uuid;
begin
  -- Post-Course Deliverables
  insert into classes (slug, title, description, is_published)
  values ('post-course-deliverables', 'Post-Course Deliverables', 'Wrap-up materials and capstone outputs.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_deliverables;

  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_deliverables, 1, 'm1', 'Module 1', 'Capstone overview', true),
    (v_deliverables, 2, 'm2', 'Module 2', 'Final submission checklist', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- Electives list
  -- 1) Legal Structures & Incorporation
  insert into classes (slug, title, description, is_published)
  values ('legal-structures-and-incorporation', 'Legal Structures & Incorporation', 'Entity types and registration paths.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Overview & requirements', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Next steps & filings', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 2) Compliance & Security
  insert into classes (slug, title, description, is_published)
  values ('compliance-and-security', 'Compliance & Security', 'Policies, controls, and data protection basics.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Foundations & risk', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Controls & checklists', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 3) Financial Systems & Audits
  insert into classes (slug, title, description, is_published)
  values ('financial-systems-and-audits', 'Financial Systems & Audits', 'Internal systems and audit readiness.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Systems overview', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Audit preparation', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 4) Branding, Messaging & Audience Strategy
  insert into classes (slug, title, description, is_published)
  values ('branding-messaging-and-audience-strategy', 'Branding, Messaging & Audience Strategy', 'Positioning, messaging, and audiences.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Brand foundations', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Audience strategy', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 5) Marketing & PR
  insert into classes (slug, title, description, is_published)
  values ('marketing-and-pr', 'Marketing & PR', 'Campaigns and earned media basics.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Channels & content', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Press outreach', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 6) Grant Writing
  insert into classes (slug, title, description, is_published)
  values ('grant-writing', 'Grant Writing', 'Structuring proposals and narratives.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Proposal structure', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Narratives & budgets', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 7) Major Donor Cultivation
  insert into classes (slug, title, description, is_published)
  values ('major-donor-cultivation', 'Major Donor Cultivation', 'Prospecting and relationship management.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Prospect research', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Moves management', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 8) Pitch Deck Design & Storytelling
  insert into classes (slug, title, description, is_published)
  values ('pitch-deck-design-and-storytelling', 'Pitch Deck Design & Storytelling', 'Design and narrative for pitches.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'Deck structure', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Visuals & story', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

  -- 9) Introduction to CRM Design & Management
  insert into classes (slug, title, description, is_published)
  values ('introduction-to-crm-design-and-management', 'Introduction to CRM Design & Management', 'CRM concepts and setup.', true)
  on conflict (slug) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published
  returning id into v_class_id;
  insert into modules (class_id, idx, slug, title, description, is_published)
  values
    (v_class_id, 1, 'm1', 'Module 1', 'CRM foundations', true),
    (v_class_id, 2, 'm2', 'Module 2', 'Fields & workflows', true)
  on conflict (class_id, idx) do update set title = excluded.title, description = excluded.description, is_published = excluded.is_published;

end $$;

