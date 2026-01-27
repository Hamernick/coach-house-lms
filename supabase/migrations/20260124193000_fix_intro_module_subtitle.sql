-- Fix grammar for the Strategic Foundations intro module subtitle.

with target_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'intro-idea-to-impact-accelerator'
  limit 1
)
update modules
set description = 'Introduction to the accelerator: what we cover, why Coach House, and how it works.'
where id in (select id from target_module);
