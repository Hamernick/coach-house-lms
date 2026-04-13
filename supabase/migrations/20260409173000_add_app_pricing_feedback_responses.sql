set check_function_bodies = off;
set search_path = public;

create table if not exists app_pricing_feedback_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  org_id uuid references organizations (user_id) on delete set null,
  survey_key text not null check (char_length(trim(survey_key)) > 0),
  price_per_month_usd integer not null check (price_per_month_usd > 0),
  would_pay boolean not null,
  feedback text check (feedback is null or char_length(feedback) <= 1000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, survey_key)
);

create trigger set_updated_at_app_pricing_feedback_responses
before update on app_pricing_feedback_responses
for each row execute procedure public.handle_updated_at();

alter table app_pricing_feedback_responses enable row level security;
alter table app_pricing_feedback_responses force row level security;

create policy "app_pricing_feedback_responses_self_select" on app_pricing_feedback_responses
  for select using (user_id = auth.uid());

create policy "app_pricing_feedback_responses_self_insert" on app_pricing_feedback_responses
  for insert with check (user_id = auth.uid());

create policy "app_pricing_feedback_responses_self_update" on app_pricing_feedback_responses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "app_pricing_feedback_responses_admin_manage" on app_pricing_feedback_responses
  using (public.is_admin()) with check (public.is_admin());
