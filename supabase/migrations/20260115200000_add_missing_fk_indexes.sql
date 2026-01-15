set check_function_bodies = off;
set search_path = public;

-- Supabase linter: unindexed_foreign_keys
-- Add covering indexes for FK columns to improve join/delete/update performance.

create index if not exists enrollment_invites_invited_by_idx on public.enrollment_invites (invited_by);
create index if not exists onboarding_responses_org_id_idx on public.onboarding_responses (org_id);
create index if not exists schedule_events_created_by_idx on public.schedule_events (created_by);
create index if not exists search_events_org_id_idx on public.search_events (org_id);
