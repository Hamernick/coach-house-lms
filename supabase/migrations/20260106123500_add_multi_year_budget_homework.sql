set search_path = public;

do $$
declare
  target_module_id uuid;
begin
  select m.id
  into target_module_id
  from modules m
  where m.slug = 'multi-year-budgeting'
  limit 1;

  if target_module_id is null then
    select m.id
    into target_module_id
    from modules m
    where lower(m.title) = 'multi-year budgeting'
    limit 1;
  end if;

  if target_module_id is null then
    raise notice 'Multi-year Budgeting module not found; skipping homework update.';
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    target_module_id,
    jsonb_build_object(
      'title', 'Multi-year Budget Worksheet',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'multi_year_budget_prep',
          'label', 'Preparing for a Multi-Year Budget',
          'type', 'long_text'
        )
      )
    ),
    false
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;
end $$;
