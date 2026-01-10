do $$
declare
  target_id uuid;
begin
  select m.id
  into target_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'strategic-foundations'
  order by m.idx asc nulls last, m.created_at asc
  limit 1;

  if target_id is not null then
    update module_content
    set resources = (
      case
        when resources is null or jsonb_typeof(resources) <> 'array' then
          jsonb_build_array(
            jsonb_build_object(
              'label', 'Coach House Substack',
              'url', 'https://coachhousesolutions.substack.com/'
            )
          )
        when exists (
          select 1
          from jsonb_array_elements(resources) as r
          where lower(coalesce(r->>'label', '')) like '%substack%'
        ) then
          (
            select jsonb_agg(
              case
                when lower(coalesce(r->>'label', '')) like '%substack%' then
                  jsonb_build_object(
                    'label', coalesce(r->>'label', 'Coach House Substack'),
                    'url', 'https://coachhousesolutions.substack.com/'
                  )
                else r
              end
            )
            from jsonb_array_elements(resources) as r
          )
        else
          resources || jsonb_build_array(
            jsonb_build_object(
              'label', 'Coach House Substack',
              'url', 'https://coachhousesolutions.substack.com/'
            )
          )
      end
    )
    where module_id = target_id;
  end if;
end $$;
