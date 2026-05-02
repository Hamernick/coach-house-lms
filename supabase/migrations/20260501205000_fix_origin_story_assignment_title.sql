set search_path = public;

update module_assignments ma
set schema = jsonb_set(ma.schema, '{title}', to_jsonb('Origin Story'::text), true)
from modules m
join classes c on c.id = m.class_id
where ma.module_id = m.id
  and c.slug = 'strategic-foundations'
  and m.slug = 'start-with-your-why'
  and ma.schema->>'title' = 'Origin Story Worksheet';
