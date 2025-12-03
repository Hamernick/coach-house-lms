set check_function_bodies = off;
set search_path = public;

create type roadmap_event_type as enum ('view', 'cta_click');

create table if not exists roadmap_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (user_id) on delete cascade,
  section_id text,
  event_type roadmap_event_type not null,
  source text,
  referrer text,
  duration_ms integer,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists roadmap_events_org_event_idx on roadmap_events (org_id, event_type, created_at desc);

alter table roadmap_events enable row level security;
alter table roadmap_events force row level security;

create policy "roadmap_events_owner_select" on roadmap_events
  for select using (org_id = auth.uid());

create policy "roadmap_events_owner_insert" on roadmap_events
  for insert with check (org_id = auth.uid());

create policy "roadmap_events_admin_manage" on roadmap_events
  using (public.is_admin()) with check (public.is_admin());
