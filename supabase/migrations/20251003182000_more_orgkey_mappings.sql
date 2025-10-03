set check_function_bodies = off;
set search_path = public;

-- Helper to ensure a module_content row exists for a given class slug and module idx
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

-- Session 7: add Facebook prompt alongside other social links
do $$
declare v uuid; begin
  v := ensure_module_content('comprehensive-communications-strategy', 3);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Facebook","org_key":"facebook"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

-- Session 5: add Toolkit list (M3: Tooling Overview) and Reports plan (M5)
do $$
declare v3 uuid; v5 uuid; begin
  v3 := ensure_module_content('evaluation-data-tracking', 3);
  if v3 is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"List your data/reporting tools (comma separated)","org_key":"toolkit"}}]'::jsonb
    where module_id = v3;
  end if;
  v5 := ensure_module_content('evaluation-data-tracking', 5);
  if v5 is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Describe your reporting cadence/outputs","org_key":"reports"}}]'::jsonb
    where module_id = v5;
  end if;
end $$;

-- Session 1: add organization name prompt on orientation (M1)
do $$
declare v uuid; begin
  v := ensure_module_content('foundations', 1);
  if v is not null then
    update module_content
    set interactions = coalesce(interactions, '[]'::jsonb) || '[{"type":"prompt","config":{"label":"Organization name","org_key":"name"}}]'::jsonb
    where module_id = v;
  end if;
end $$;

drop function if exists ensure_module_content(text, int);

