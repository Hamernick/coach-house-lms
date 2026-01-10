set search_path = public;

do $$
declare
  pilot_module_id uuid;
begin
  select m.id
  into pilot_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'designing-your-pilot'
  limit 1;

  if pilot_module_id is null then
    raise notice 'Designing your pilot module not found; skipping resource cleanup.';
    return;
  end if;

  update module_content
  set resources = '[]'::jsonb
  where module_id = pilot_module_id;
end $$;
