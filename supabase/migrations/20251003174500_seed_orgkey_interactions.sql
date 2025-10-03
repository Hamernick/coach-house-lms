set check_function_bodies = off;
set search_path = public;

-- Seed interactions with org_key so learner inputs flow into organizations.profile

-- M1: mission
insert into module_content (module_id, interactions)
select m.id, '[{"type":"prompt","config":{"label":"Write your mission","org_key":"mission"}}]'::jsonb
from modules m join classes c on c.id = m.class_id
where c.slug = 'mission-vision-values' and m.idx = 1
on conflict (module_id) do update set interactions = excluded.interactions;

-- M2: vision
insert into module_content (module_id, interactions)
select m.id, '[{"type":"prompt","config":{"label":"Describe your vision","org_key":"vision"}}]'::jsonb
from modules m join classes c on c.id = m.class_id
where c.slug = 'mission-vision-values' and m.idx = 2
on conflict (module_id) do update set interactions = excluded.interactions;

-- M3: values
insert into module_content (module_id, interactions)
select m.id, '[{"type":"activity","config":{"label":"Select your core values","options":[{"label":"Equity","value":"equity"},{"label":"Sustainability","value":"sustainability"},{"label":"Collaboration","value":"collaboration"},{"label":"Empathy","value":"empathy"}],"org_key":"values"}}]'::jsonb
from modules m join classes c on c.id = m.class_id
where c.slug = 'mission-vision-values' and m.idx = 3
on conflict (module_id) do update set interactions = excluded.interactions;

-- Session 4 (program-design-pilot) – capture programs
with m as (
  select m.id from modules m join classes c on c.id = m.class_id where c.slug = 'program-design-pilot' and m.idx = 5
)
insert into module_content (module_id, interactions)
select (select id from m), '[{"type":"prompt","config":{"label":"List your programs (comma separated)","org_key":"programs"}}]'::jsonb
on conflict (module_id) do update set interactions = excluded.interactions
;

-- Session 7 (comprehensive-communications-strategy) – public site/socials
with m as (
  select m.id from modules m join classes c on c.id = m.class_id where c.slug = 'comprehensive-communications-strategy' and m.idx = 3
)
insert into module_content (module_id, interactions)
select (select id from m), '[
  {"type":"prompt","config":{"label":"Website URL","org_key":"publicUrl"}},
  {"type":"prompt","config":{"label":"Twitter","org_key":"twitter"}},
  {"type":"prompt","config":{"label":"LinkedIn","org_key":"linkedin"}}
]'::jsonb
on conflict (module_id) do update set interactions = excluded.interactions
;

-- Session 8 (fundraising-fundamentals) – supporters
with m as (
  select m.id from modules m join classes c on c.id = m.class_id where c.slug = 'fundraising-fundamentals' and m.idx = 5
)
insert into module_content (module_id, interactions)
select (select id from m), '[{"type":"prompt","config":{"label":"List supporters (comma separated)","org_key":"supporters"}}]'::jsonb
on conflict (module_id) do update set interactions = excluded.interactions
;

-- Session 9 (board-engagement-governance) – people
with m as (
  select m.id from modules m join classes c on c.id = m.class_id where c.slug = 'board-engagement-governance' and m.idx = 5
)
insert into module_content (module_id, interactions)
select (select id from m), '[{"type":"prompt","config":{"label":"Key people (comma separated)","org_key":"people"}}]'::jsonb
on conflict (module_id) do update set interactions = excluded.interactions
;
