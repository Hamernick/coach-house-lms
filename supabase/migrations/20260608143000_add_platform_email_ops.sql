create table if not exists public.platform_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subject text not null,
  preview_text text not null default '',
  markdown_content text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'review', 'scheduled', 'sent', 'paused')),
  audience_segment_id text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.platform_email_campaigns(id) on delete cascade,
  recipient_email text not null,
  audience_segment_id text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued'
    check (
      status in (
        'queued',
        'sent',
        'delivered',
        'opened',
        'clicked',
        'bounced',
        'complained',
        'unsubscribed',
        'failed'
      )
    ),
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.platform_email_campaigns(id) on delete set null,
  delivery_id uuid references public.platform_email_deliveries(id) on delete set null,
  provider text not null default 'resend',
  provider_event_id text not null unique,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null
    check (reason in ('unsubscribe', 'bounce', 'complaint', 'manual')),
  source text not null default 'manual',
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_email_campaigns_status_updated_at_idx
  on public.platform_email_campaigns (status, updated_at desc);

create index if not exists platform_email_deliveries_campaign_status_idx
  on public.platform_email_deliveries (campaign_id, status);

create index if not exists platform_email_deliveries_recipient_email_idx
  on public.platform_email_deliveries (lower(recipient_email));

create index if not exists platform_email_events_campaign_event_idx
  on public.platform_email_events (campaign_id, event_type, occurred_at desc);

create unique index if not exists platform_email_suppressions_email_reason_idx
  on public.platform_email_suppressions (lower(email), reason);

drop trigger if exists set_updated_at_platform_email_campaigns
  on public.platform_email_campaigns;
create trigger set_updated_at_platform_email_campaigns
before update on public.platform_email_campaigns
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_platform_email_deliveries
  on public.platform_email_deliveries;
create trigger set_updated_at_platform_email_deliveries
before update on public.platform_email_deliveries
for each row execute procedure public.handle_updated_at();

alter table public.platform_email_campaigns enable row level security;
alter table public.platform_email_deliveries enable row level security;
alter table public.platform_email_events enable row level security;
alter table public.platform_email_suppressions enable row level security;

create policy "platform_email_campaigns_admin_all"
on public.platform_email_campaigns
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_deliveries_admin_all"
on public.platform_email_deliveries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_events_admin_all"
on public.platform_email_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_suppressions_admin_all"
on public.platform_email_suppressions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
