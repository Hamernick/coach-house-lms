set check_function_bodies = off;
set search_path = public;

alter table programs add column if not exists location_type text not null default 'in_person';
alter table programs add column if not exists location_url text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'programs_location_type_check'
  ) then
    alter table programs add constraint programs_location_type_check
      check (location_type in ('in_person', 'online'));
  end if;
end $$;

