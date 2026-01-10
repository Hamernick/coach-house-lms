set search_path = public;

do $$
declare
  origin_module_id uuid;
begin
  select m.id
  into origin_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
    and m.slug = 'start-with-your-why'
  limit 1;

  if origin_module_id is not null then
    update modules
    set content_md = $MD$
## Origin story

Many people freeze when asked to "tell their story," but relax when asked to assemble a few components.

You do not need to get this perfect. You do not need to write a polished story yet.

### Two ways to approach this
- Use a coaching session to develop your origin story. We will interview you, draft it, and revise until it feels true to you and aligned with your work.
- Answer the questions below. Your responses will serve as the raw material for an initial draft you can revisit and strengthen later.
$MD$
    where id = origin_module_id;
  end if;
end $$;
