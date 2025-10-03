set check_function_bodies = off;
set search_path = public;

-- Add org_key interactions to Foundations session (slug: foundations)

insert into module_content (module_id, interactions)
select m.id, '[{"type":"poll","config":{"question":"How ready is your organization today?","scale_min":1,"scale_max":5,"org_key":"readiness_score"}}]'::jsonb
from modules m join classes c on c.id = m.class_id
where c.slug = 'foundations' and m.idx = 1
on conflict (module_id) do update set interactions = excluded.interactions;

insert into module_content (module_id, interactions)
select m.id, '[{"type":"prompt","config":{"label":"Describe your vision","org_key":"vision"}}]'::jsonb
from modules m join classes c on c.id = m.class_id
where c.slug = 'foundations' and m.idx = 3
on conflict (module_id) do update set interactions = excluded.interactions;

insert into module_content (module_id, interactions)
select m.id, '[{"type":"prompt","config":{"label":"Write your need statement","org_key":"need"}}]'::jsonb
from modules m join classes c on c.id = m.class_id
where c.slug = 'foundations' and m.idx = 4
on conflict (module_id) do update set interactions = excluded.interactions;
