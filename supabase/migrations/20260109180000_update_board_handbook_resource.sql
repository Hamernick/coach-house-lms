set search_path = public;

do $$
declare
  board_module_id uuid;
begin
  select m.id
  into board_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'board-engagement-governance'
    and m.idx = 2
  limit 1;

  if board_module_id is not null then
    update module_content
    set resources = (
      case
        when resources is null or jsonb_typeof(resources) <> 'array' then
          jsonb_build_array(
            jsonb_build_object(
              'label', 'Sample New Member Handbook',
              'url', 'https://docs.google.com/document/d/1ZH-MATqOh65ssJH-tfB8zDL1MlsizTGtXt0ww1nDyC8/edit?tab=t.0'
            )
          )
        when exists (
          select 1
          from jsonb_array_elements(resources) as r
          where lower(coalesce(r->>'label', '')) like '%new member handbook%'
        ) then
          (
            select jsonb_agg(
              case
                when lower(coalesce(r->>'label', '')) like '%new member handbook%' then
                  jsonb_build_object(
                    'label', coalesce(r->>'label', 'Sample New Member Handbook'),
                    'url', 'https://docs.google.com/document/d/1ZH-MATqOh65ssJH-tfB8zDL1MlsizTGtXt0ww1nDyC8/edit?tab=t.0'
                  )
                else r
              end
            )
            from jsonb_array_elements(resources) as r
          )
        else
          resources || jsonb_build_array(
            jsonb_build_object(
              'label', 'Sample New Member Handbook',
              'url', 'https://docs.google.com/document/d/1ZH-MATqOh65ssJH-tfB8zDL1MlsizTGtXt0ww1nDyC8/edit?tab=t.0'
            )
          )
      end
    )
    where module_id = board_module_id;
  end if;
end $$;
