create table if not exists public.public_map_organization_curation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(user_id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint public_map_organization_curation_events_action_check
    check (action in ('hide', 'delete')),
  constraint public_map_organization_curation_events_before_state_check
    check (jsonb_typeof(before_state) = 'object'),
  constraint public_map_organization_curation_events_after_state_check
    check (jsonb_typeof(after_state) = 'object')
);

create index if not exists public_map_organization_curation_events_org_idx
  on public.public_map_organization_curation_events (organization_id, created_at desc)
  where organization_id is not null;

create index if not exists public_map_organization_curation_events_actor_idx
  on public.public_map_organization_curation_events (actor_id, created_at desc)
  where actor_id is not null;

create index if not exists public_map_organization_curation_events_action_idx
  on public.public_map_organization_curation_events (action, created_at desc);

alter table public.public_map_organization_curation_events enable row level security;
alter table public.public_map_organization_curation_events force row level security;

drop policy if exists "public_map_organization_curation_events_admin_manage"
  on public.public_map_organization_curation_events;
create policy "public_map_organization_curation_events_admin_manage"
  on public.public_map_organization_curation_events
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
