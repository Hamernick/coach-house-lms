set search_path = public;

do $$
declare
  budget_module_id uuid;
  multi_year_module_id uuid;
begin
  select m.id
  into budget_module_id
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

  if budget_module_id is not null then
    insert into module_assignments (module_id, schema, complete_on_submit)
    values (
      budget_module_id,
      jsonb_build_object(
        'title', 'Program_Expense_Breakdown',
        'fields', jsonb_build_array(
          jsonb_build_object(
            'name', 'program_expense_breakdown',
            'label', 'Program_Expense_Breakdown',
            'type', 'budget_table',
            'required', false,
            'description', 'This table is designed to help you translate program activities into real costs. Some expenses happen once. Others increase based on the number of sessions, events, or participants. Use this table to estimate costs, not to be perfect, but to be intentional.',
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
      )::jsonb,
      false
    )
    on conflict (module_id) do update set
      schema = excluded.schema,
      complete_on_submit = excluded.complete_on_submit;
  end if;

  select m.id
  into multi_year_module_id
  from modules m
  where m.slug = 'multi-year-budgeting'
     or lower(m.title) = 'multi-year budgeting'
  limit 1;

  if multi_year_module_id is null then
    raise notice 'Multi-year Budgeting module not found; skipping update.';
    return;
  end if;

  update modules
  set content_md = $MD$
## Preparing for a Multi-Year Budget

Before building a multi-year budget, it's important to step back and clarify your intentions and assumptions. A multi-year budget is not just a financial exercise—it is a reflection of your strategy, priorities, and capacity for growth.

Answer the questions below to prepare for this work.

## Coaching Recommendation

We strongly recommend using a coaching session to translate these reflections into a practical multi-year budget. During coaching, we can include key voices—such as staff, board members, partners, or finance professionals—to ensure your assumptions are realistic, shared, and aligned with your organization's capacity.

This approach helps turn long-range thinking into a credible, usable financial plan.
$MD$
  where id = multi_year_module_id;

  insert into module_assignments (module_id, schema, complete_on_submit)
  values (
    multi_year_module_id,
    jsonb_build_object(
      'title', 'Multi-year Budget Worksheet',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'name', 'growth_intro',
          'label', 'Growth & Direction',
          'type', 'subtitle'
        ),
        jsonb_build_object(
          'name', 'growth_direction',
          'label', 'Over the next 2–3 years, what do you want to happen to your organization?',
          'type', 'select',
          'options', jsonb_build_array(
            'Maintain current size and scope',
            'Grow intentionally',
            'Not sure yet'
          )
        ),
        jsonb_build_object(
          'name', 'growth_targets',
          'label', 'If growth is a goal, what do you expect to grow? (Check all that apply.)',
          'type', 'multi_select',
          'options', jsonb_build_array(
            'Number of people served',
            'Number of sessions, cohorts, or gatherings',
            'Number of programs',
            'Geographic reach',
            'Depth or intensity of services',
            'All of the above'
          )
        ),
        jsonb_build_object(
          'name', 'growth_description',
          'label', 'Briefly describe what growth would look like in practice.',
          'type', 'long_text',
          'placeholder', 'Describe what you expect to expand or deepen over time.'
        ),
        jsonb_build_object(
          'name', 'program_intro',
          'label', 'Program Implications',
          'type', 'subtitle'
        ),
        jsonb_build_object(
          'name', 'program_implications',
          'label', 'If your programs expand or change, what would need to be different?',
          'type', 'long_text',
          'description', 'More staff or facilitators?\nMore space or longer program timelines?\nHigher per-participant costs?\nAdditional evaluation or reporting requirements?',
          'placeholder', 'List the shifts you anticipate.'
        ),
        jsonb_build_object(
          'name', 'program_assumptions',
          'label', 'What assumptions are you currently making about how growth would happen?',
          'type', 'long_text',
          'placeholder', 'Describe what you believe must be true for growth.'
        ),
        jsonb_build_object(
          'name', 'future_intro',
          'label', 'Future Expenses Not Reflected Today',
          'type', 'subtitle'
        ),
        jsonb_build_object(
          'name', 'future_expenses',
          'label', 'Are there expenses you expect in Year 2 or Year 3 that are not included in your current budget?',
          'type', 'multi_select',
          'description', 'Consider items such as:\n- Additional staff positions\n- Salary increases or benefits\n- Professional services (accounting, legal, HR)\n- Equipment or technology purchases\n- Vehicles or specialized tools\n- Facility costs or real estate\n- Insurance or compliance-related costs',
          'options', jsonb_build_array(
            'Additional staff positions',
            'Salary increases or benefits',
            'Professional services (accounting, legal, HR)',
            'Equipment or technology purchases',
            'Vehicles or specialized tools',
            'Facility costs or real estate',
            'Insurance or compliance-related costs'
          )
        ),
        jsonb_build_object(
          'name', 'future_expenses_notes',
          'label', 'List any anticipated future expenses and when they might occur.',
          'type', 'long_text',
          'placeholder', 'Note expenses and timing for Year 2 or Year 3.'
        ),
        jsonb_build_object(
          'name', 'capacity_intro',
          'label', 'Capacity & Sustainability',
          'type', 'subtitle'
        ),
        jsonb_build_object(
          'name', 'capacity_requirements',
          'label', 'What would need to be true for your organization to support this growth responsibly?',
          'type', 'long_text',
          'description', 'Leadership capacity\nStaff or volunteer bandwidth\nFundraising or earned revenue growth\nSystems and infrastructure',
          'placeholder', 'List the capacity requirements you foresee.'
        ),
        jsonb_build_object(
          'name', 'capacity_confidence',
          'label', 'Where do you feel confident—and where do you feel uncertain?',
          'type', 'long_text',
          'placeholder', 'Share where you feel ready and where you need clarity.'
        ),
        jsonb_build_object(
          'name', 'conversation_intro',
          'label', 'Who Should Be Part of This Conversation?',
          'type', 'subtitle'
        ),
        jsonb_build_object(
          'name', 'conversation_participants',
          'label', 'Who should be involved or consulted as you think about the next 2–3 years?',
          'type', 'multi_select',
          'options', jsonb_build_array(
            'Key staff',
            'Board members',
            'Bookkeeper or accountant',
            'Program partners',
            'Volunteers or community advisors'
          )
        ),
        jsonb_build_object(
          'name', 'conversation_notes',
          'label', 'List specific people you would want to invite into this planning process.',
          'type', 'long_text',
          'placeholder', 'List names, roles, or teams to include.'
        )
      )
    )::jsonb,
    false
  )
  on conflict (module_id) do update set
    schema = excluded.schema,
    complete_on_submit = excluded.complete_on_submit;
end $$;
