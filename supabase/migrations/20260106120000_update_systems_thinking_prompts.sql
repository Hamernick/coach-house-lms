set search_path = public;

do $$
declare
  systems_module_id uuid;
begin
  select m.id
  into systems_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'theory-of-change'
    and m.slug = 'systems-thinking'
  limit 1;

  if systems_module_id is null then
    raise notice 'Systems Thinking module not found; skipping prompt update.';
    return;
  end if;

  update module_content
  set resources = '[]'::jsonb,
      homework = '[]'::jsonb
  where module_id = systems_module_id;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    systems_module_id,
    jsonb_build_object(
      'title', 'Systems Thinking Worksheet',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'st_program_snapshot',
          'label', 'Program Snapshot',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_problem_response',
          'label', 'What Problem Is This Program Responding To—and What Contributes to It?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_success_connections',
          'label', 'What Else Is Connected to This Program’s Success?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_changes_for_whom',
          'label', 'If This Program Works Well, What Changes—and for Whom?',
          'type', 'long_text'
        ),
        jsonb_build_object(
          'name', 'st_assumption_change',
          'label', 'What Assumption Are You Making About How Change Will Happen?',
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
