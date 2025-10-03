set check_function_bodies = off;
set search_path = public;

-- Add minimal content_md stubs to elective and deliverables modules to avoid empty pages

-- Ensure target column exists on module_content
alter table if exists public.module_content
  add column if not exists content_md text;

create or replace function ensure_module_content(p_slug text, p_idx int)
returns uuid
language plpgsql
as $$
declare v_id uuid; begin
  select m.id into v_id from modules m join classes c on c.id = m.class_id where c.slug = p_slug and m.idx = p_idx;
  if v_id is null then return null; end if;
  insert into module_content (module_id) values (v_id) on conflict (module_id) do nothing;
  return v_id;
end; $$;

do $$
declare
  slugs text[] := array[
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
  ];
  s text;
  v1 uuid;
  v2 uuid;
begin
  foreach s in array slugs loop
    v1 := ensure_module_content(s, 1);
    if v1 is not null then
      update module_content set content_md = coalesce(content_md, '# Module 1 — Overview\n\nThis placeholder introduces the topic and outlines outcomes.') where module_id = v1;
    end if;
    v2 := ensure_module_content(s, 2);
    if v2 is not null then
      update module_content set content_md = coalesce(content_md, '# Module 2 — Overview\n\nThis placeholder continues the topic with examples and short exercises.') where module_id = v2;
    end if;
  end loop;
end $$;

drop function if exists ensure_module_content(text, int);
