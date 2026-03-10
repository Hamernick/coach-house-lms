set check_function_bodies = off;
set search_path = public;

alter table roadmap_calendar_public_events
  add column if not exists event_type text not null default 'meeting';

alter table roadmap_calendar_internal_events
  add column if not exists event_type text not null default 'meeting';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'roadmap_calendar_public_events_event_type_check'
  ) then
    alter table roadmap_calendar_public_events
      add constraint roadmap_calendar_public_events_event_type_check
      check (event_type in ('meeting', 'board_meeting', 'deadline', 'milestone', 'other'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'roadmap_calendar_internal_events_event_type_check'
  ) then
    alter table roadmap_calendar_internal_events
      add constraint roadmap_calendar_internal_events_event_type_check
      check (event_type in ('meeting', 'board_meeting', 'deadline', 'milestone', 'other'));
  end if;
end $$;
