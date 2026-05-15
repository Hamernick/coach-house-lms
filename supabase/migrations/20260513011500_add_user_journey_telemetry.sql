set check_function_bodies = off;
set search_path = public;

create table if not exists public.user_journey_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  org_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  journey text,
  source text not null default 'server',
  surface text,
  plan_tier text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_journey_events_user_id_occurred_at_idx
  on public.user_journey_events (user_id, occurred_at desc);
create index if not exists user_journey_events_org_id_occurred_at_idx
  on public.user_journey_events (org_id, occurred_at desc);
create index if not exists user_journey_events_event_name_idx
  on public.user_journey_events (event_name);
create index if not exists user_journey_events_journey_idx
  on public.user_journey_events (journey);
create index if not exists user_journey_events_plan_tier_idx
  on public.user_journey_events (plan_tier);

alter table public.user_journey_events enable row level security;
alter table public.user_journey_events force row level security;

revoke all on table public.user_journey_events from anon, authenticated;
grant select on table public.user_journey_events to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_journey_events'
      and policyname = 'user_journey_events_admin_read'
  ) then
    execute 'create policy "user_journey_events_admin_read" on public.user_journey_events for select using (public.is_admin())';
  end if;
end $$;

create table if not exists public.user_activation_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid not null references public.profiles(id) on delete cascade,
  checkpoint text not null,
  source_event_id uuid references public.user_journey_events(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_activation_checkpoints_user_org_checkpoint_key
    unique (user_id, org_id, checkpoint)
);

create index if not exists user_activation_checkpoints_user_id_completed_at_idx
  on public.user_activation_checkpoints (user_id, completed_at desc);
create index if not exists user_activation_checkpoints_org_id_completed_at_idx
  on public.user_activation_checkpoints (org_id, completed_at desc);
create index if not exists user_activation_checkpoints_checkpoint_idx
  on public.user_activation_checkpoints (checkpoint);

drop trigger if exists set_updated_at_user_activation_checkpoints on public.user_activation_checkpoints;
create trigger set_updated_at_user_activation_checkpoints
before update on public.user_activation_checkpoints
for each row execute procedure public.handle_updated_at();

alter table public.user_activation_checkpoints enable row level security;
alter table public.user_activation_checkpoints force row level security;

revoke all on table public.user_activation_checkpoints from anon, authenticated;
grant select on table public.user_activation_checkpoints to authenticated;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_activation_checkpoints'
      and policyname = 'user_activation_checkpoints_admin_read'
  ) then
    execute 'create policy "user_activation_checkpoints_admin_read" on public.user_activation_checkpoints for select using (public.is_admin())';
  end if;
end $$;

notify pgrst, 'reload schema';
