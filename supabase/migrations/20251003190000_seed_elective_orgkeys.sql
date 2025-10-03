set check_function_bodies = off;
set search_path = public;

-- Seed org_key interactions for Electives and Deliverables to shape organizations.profile

create or replace function ensure_module_content(p_slug text, p_idx int)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select m.id into v_id from modules m join classes c on c.id = m.class_id where c.slug = p_slug and m.idx = p_idx;
  if v_id is null then
    return null;
  end if;
  insert into module_content (module_id) values (v_id)
  on conflict (module_id) do nothing;
  return v_id;
end;
$$;

-- Legal Structures & Incorporation
do $$
declare v1 uuid; v2 uuid; begin
  v1 := ensure_module_content('legal-structures-and-incorporation', 1);
  if v1 is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Entity type (e.g., 501(c)(3), LLC)","org_key":"entity"}}]'::jsonb
    where module_id = v1;
  end if;
  v2 := ensure_module_content('legal-structures-and-incorporation', 2);
  if v2 is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[
      {"type":"prompt","config":{"label":"EIN (##-#######)","org_key":"ein"}},
      {"type":"prompt","config":{"label":"Incorporation date (YYYY-MM-DD)","org_key":"incorporation"}}
    ]'::jsonb
    where module_id = v2;
  end if;
end $$;

-- Compliance & Security (map lists to toolkit)
do $$
declare v uuid; begin
  v := ensure_module_content('compliance-and-security', 2);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"List your compliance/security tools or policies (CSV)","org_key":"toolkit"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Financial Systems & Audits
do $$
declare v1 uuid; v2 uuid; begin
  v1 := ensure_module_content('financial-systems-and-audits', 1);
  if v1 is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Primary accounting system","org_key":"toolkit"}}]'::jsonb
    where module_id = v1;
  end if;
  v2 := ensure_module_content('financial-systems-and-audits', 2);
  if v2 is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Audit/reporting cadence","org_key":"reports"}}]'::jsonb
    where module_id = v2;
  end if;
end $$;

-- Branding, Messaging & Audience Strategy
do $$
declare v uuid; begin
  v := ensure_module_content('branding-messaging-and-audience-strategy', 2);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Website URL","org_key":"publicUrl"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Marketing & PR
do $$
declare v uuid; begin
  v := ensure_module_content('marketing-and-pr', 1);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Website URL","org_key":"publicUrl"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Grant Writing
do $$
declare v uuid; begin
  v := ensure_module_content('grant-writing', 2);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Target funders (CSV)","org_key":"supporters"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Major Donor Cultivation
do $$
declare v uuid; begin
  v := ensure_module_content('major-donor-cultivation', 1);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Prospective donors (CSV)","org_key":"supporters"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Pitch Deck Design & Storytelling (store deck link in toolkit)
do $$
declare v uuid; begin
  v := ensure_module_content('pitch-deck-design-and-storytelling', 2);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Pitch deck URL","org_key":"toolkit"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Introduction to CRM Design & Management
do $$
declare v uuid; begin
  v := ensure_module_content('introduction-to-crm-design-and-management', 1);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"CRM system name","org_key":"toolkit"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Post-Course Deliverables
do $$
declare v uuid; begin
  v := ensure_module_content('post-course-deliverables', 2);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Capstone link","org_key":"reports"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

drop function if exists ensure_module_content(text, int);

