set check_function_bodies = off;
set search_path = public;

-- Extend profiles with marketing/newsletter preferences captured on the settings page.
alter table profiles
  add column marketing_opt_in boolean not null default true,
  add column newsletter_opt_in boolean not null default true;

-- Enumerate supported schedule event types to keep UI copy deterministic.
create type schedule_event_type as enum ('session', 'deadline', 'workshop', 'reminder', 'other');

-- Learner-facing schedule entries tied to class enrollments (or marked public).
create table schedule_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  duration_minutes integer,
  event_type schedule_event_type not null default 'session',
  is_public boolean not null default false,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint schedule_events_public_requires_context check (is_public or class_id is not null)
);

create index schedule_events_start_at_idx on schedule_events (start_at desc);
create index schedule_events_class_id_idx on schedule_events (class_id);

create trigger set_updated_at_schedule_events
before update on schedule_events
for each row execute procedure public.handle_updated_at();

alter table schedule_events enable row level security;
alter table schedule_events force row level security;

create policy "schedule_events_public_or_enrolled_select" on schedule_events
  for select
  using (
    is_public
    or (
      class_id is not null and exists (
        select 1
        from enrollments e
        where e.class_id = schedule_events.class_id
          and e.user_id = auth.uid()
      )
    )
    or public.is_admin()
  );

create policy "schedule_events_admin_manage" on schedule_events
  using (public.is_admin())
  with check (public.is_admin());
