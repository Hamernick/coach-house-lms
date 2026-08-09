set check_function_bodies = off;
set search_path = public;

create table if not exists public.organization_finance_engagement_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  event_type text not null,
  source_label text not null,
  surface text,
  finance_record_id uuid references public.organization_finance_records(id)
    on delete set null,
  external_provider text not null,
  external_event_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_engagement_events_type_check
    check (event_type in ('view', 'click', 'conversion')),
  constraint organization_finance_engagement_events_source_label_check
    check (char_length(btrim(source_label)) between 1 and 120),
  constraint organization_finance_engagement_events_surface_check
    check (
      surface is null
      or char_length(btrim(surface)) between 1 and 80
    ),
  constraint organization_finance_engagement_events_provider_check
    check (char_length(btrim(external_provider)) between 1 and 40),
  constraint organization_finance_engagement_events_external_id_check
    check (char_length(btrim(external_event_id)) between 1 and 256)
);

create index if not exists organization_finance_engagement_events_org_occurred_idx
  on public.organization_finance_engagement_events (
    org_id,
    occurred_at desc,
    id desc
  );

create index if not exists organization_finance_engagement_events_org_type_occurred_idx
  on public.organization_finance_engagement_events (
    org_id,
    event_type,
    occurred_at desc
  );

create unique index if not exists organization_finance_engagement_events_external_id_idx
  on public.organization_finance_engagement_events (
    org_id,
    external_provider,
    external_event_id
  );

alter table public.organization_finance_engagement_events
  enable row level security;
alter table public.organization_finance_engagement_events
  force row level security;

drop policy if exists "organization_finance_engagement_events_select"
  on public.organization_finance_engagement_events;

create policy "organization_finance_engagement_events_select"
  on public.organization_finance_engagement_events
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

revoke all on table public.organization_finance_engagement_events
  from anon, authenticated;

grant select on table public.organization_finance_engagement_events
  to authenticated;
