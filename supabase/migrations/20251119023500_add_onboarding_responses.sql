set check_function_bodies = off;
set search_path = public;

create table if not exists onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  org_id uuid references organizations (user_id) on delete set null,
  confidence_operating smallint not null check (confidence_operating between 0 and 10),
  confidence_funding smallint not null check (confidence_funding between 0 and 10),
  confidence_funders smallint not null check (confidence_funders between 0 and 10),
  notes text,
  follow_up boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create trigger set_updated_at_onboarding_responses
before update on onboarding_responses
for each row execute procedure public.handle_updated_at();

alter table onboarding_responses enable row level security;
alter table onboarding_responses force row level security;

create policy "onboarding_responses_self_select" on onboarding_responses
  for select using (user_id = auth.uid());

create policy "onboarding_responses_self_insert" on onboarding_responses
  for insert with check (user_id = auth.uid());

create policy "onboarding_responses_self_update" on onboarding_responses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "onboarding_responses_admin_manage" on onboarding_responses
  using (public.is_admin()) with check (public.is_admin());
