set search_path = public;

with mapping(name, section_id) as (
  values
    ('origin_story_draft', 'origin_story'),
    ('need_statement_draft', 'need'),
    ('mvv_summary', 'mission_vision_values'),
    ('toc_summary', 'theory_of_change'),
    ('pilot_program_summary', 'program'),
    ('pilot_team', 'people'),
    ('evaluation_summary', 'evaluation'),
    ('budget_summary', 'budget'),
    ('fundraising_overview', 'fundraising'),
    ('fundraising_strategy', 'fundraising_strategy'),
    ('fundraising_presentation', 'fundraising_presentation'),
    ('crm_plan_summary', 'fundraising_crm_plan'),
    ('communications_summary', 'communications'),
    ('board_strategy', 'board_strategy'),
    ('board_calendar', 'board_calendar'),
    ('board_handbook', 'board_handbook'),
    ('next_actions', 'next_actions')
)
update module_assignments as ma
set schema = jsonb_set(
  ma.schema,
  '{fields}',
  (
    select jsonb_agg(
      case
        when mapping.section_id is not null then
          fields.field || jsonb_build_object('roadmap_section', mapping.section_id)
        else fields.field
      end
      order by fields.ordinality
    )
    from jsonb_array_elements(ma.schema->'fields') with ordinality as fields(field, ordinality)
    left join mapping on mapping.name = fields.field->>'name'
  ),
  true
)
where ma.schema ? 'fields'
  and exists (
    select 1
    from jsonb_array_elements(ma.schema->'fields') as f
    join mapping on mapping.name = f->>'name'
  );
