set search_path = public;

update module_assignments as ma
set schema = jsonb_set(
  ma.schema,
  '{fields}',
  (
    select jsonb_agg(
      case
        when f.value ? 'description'
          and position('\n' in f.value ->> 'description') > 0
        then jsonb_set(
          f.value,
          '{description}',
          to_jsonb(replace(f.value ->> 'description', '\n', E'\n'))
        )
        else f.value
      end
      order by f.ordinality
    )
    from jsonb_array_elements(ma.schema -> 'fields') with ordinality as f(value, ordinality)
  )
)
where jsonb_typeof(ma.schema -> 'fields') = 'array'
  and exists (
    select 1
    from jsonb_array_elements(ma.schema -> 'fields') as f(value)
    where f.value ? 'description'
      and position('\n' in f.value ->> 'description') > 0
  );
