-- Fix punctuation for Strategic Foundations intro module subtitle.

with target_module as (
  select m.id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'introduction-idea-to-impact-accelerator'
  limit 1
)
update modules
set description = 'Introduction to the accelerator, what do we cover, why Coach House, & how does it work?'
where id in (select id from target_module);
