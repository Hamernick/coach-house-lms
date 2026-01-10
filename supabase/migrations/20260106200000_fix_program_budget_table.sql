set search_path = public;

do $$
declare
  target_module uuid;
begin
  select m.id
  into target_module
  from modules m
  join classes c on c.id = m.class_id
  where m.slug = 'budgeting-for-a-program'
     or lower(m.title) = 'budgeting for a program'
     or (c.slug = 'budgeting-financial-basics' and m.idx = 1)
  order by
    case
      when m.slug = 'budgeting-for-a-program' then 0
      when lower(m.title) = 'budgeting for a program' then 1
      when c.slug = 'budgeting-financial-basics' and m.idx = 1 then 2
      else 3
    end,
    m.updated_at desc nulls last
  limit 1;

  if target_module is null then
    raise notice 'Budgeting for a Program module not found; skipping homework update.';
    return;
  end if;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    target_module,
    jsonb_build_object(
      'title', 'Program_Expense_Breakdown',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'program_expense_breakdown',
          'label', 'Program_Expense_Breakdown',
          'type', 'budget_table',
          'required', false,
          'description', 'Estimate direct program costs by entering units and costs for each category. Total Estimated Cost is calculated as # of Units x Cost per Unit, and the subtotal sums all direct costs.',
          'rows', jsonb_build_array(
            jsonb_build_object(
              'category', 'Program Staff / Facilitators',
              'description', 'Instructors, coaches, trainers',
              'costType', 'Variable',
              'unit', 'Session / Hour',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Program Supplies & Materials',
              'description', 'Materials used directly by participants',
              'costType', 'Variable',
              'unit', 'Participant / Session',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Space / Facility Costs',
              'description', 'Room rental, gym, classroom, meeting space',
              'costType', 'Fixed or Variable',
              'unit', 'Event / Month',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Food & Refreshments',
              'description', 'Snacks, meals, water',
              'costType', 'Variable',
              'unit', 'Participant / Event',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Transportation Support',
              'description', 'Bus passes, rides, mileage',
              'costType', 'Variable',
              'unit', 'Participant / Trip',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Equipment',
              'description', 'Laptops, tools, sports gear, technology',
              'costType', 'Fixed',
              'unit', '-',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Marketing & Outreach',
              'description', 'Flyers, ads, printing, outreach materials',
              'costType', 'Fixed',
              'unit', '-',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Insurance / Permits',
              'description', 'Event insurance, permits, certifications',
              'costType', 'Fixed',
              'unit', '-',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Evaluation & Data',
              'description', 'Surveys, tools, stipends for evaluation',
              'costType', 'Fixed or Variable',
              'unit', 'Program / Participant',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            ),
            jsonb_build_object(
              'category', 'Other Direct Costs',
              'description', 'Any additional direct expenses',
              'costType', 'Fixed or Variable',
              'unit', '(Specify)',
              'units', '',
              'costPerUnit', '',
              'totalCost', ''
            )
          )
        )
      )
    ),
    false
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;
end $$;
