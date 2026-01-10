set search_path = public;

do $$
begin
  update modules m
  set content_md = $MD$
## Origin story

Many people freeze when asked to "tell their story," but relax when asked to assemble a few components.

You do not need to get this perfect. You do not need to write a polished story yet.

### Two ways to approach this
- Use a coaching session to develop your origin story. We will interview you, draft it, and revise until it feels true to you and aligned with your work.
- Answer the questions in the next section. Your responses will be the raw material for an initial draft you can refine later.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'strategic-foundations'
    and m.slug = 'start-with-your-why';
end $$;
