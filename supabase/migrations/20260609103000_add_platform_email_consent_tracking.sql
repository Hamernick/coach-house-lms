create table if not exists public.platform_email_topics (
  id text primary key,
  label text not null,
  description text not null default '',
  required boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_preferences (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topic_id text not null references public.platform_email_topics(id) on delete restrict,
  status text not null
    check (status in ('subscribed', 'unsubscribed', 'pending')),
  source text not null default 'manual',
  person_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_consent_events (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topic_id text references public.platform_email_topics(id) on delete restrict,
  action text not null
    check (
      action in (
        'opt_in',
        'unsubscribe',
        'resubscribe',
        'global_unsubscribe',
        'provider_suppression'
      )
    ),
  source text not null,
  person_id text,
  campaign_id uuid references public.platform_email_campaigns(id) on delete set null,
  delivery_id uuid references public.platform_email_deliveries(id) on delete set null,
  user_agent text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.platform_email_campaigns(id) on delete cascade,
  link_key text not null,
  label text not null default '',
  url text not null,
  block_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_email_link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.platform_email_links(id) on delete set null,
  campaign_id uuid references public.platform_email_campaigns(id) on delete set null,
  delivery_id uuid references public.platform_email_deliveries(id) on delete set null,
  email text,
  user_agent text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  clicked_at timestamptz not null default timezone('utc', now())
);

insert into public.platform_email_topics (id, label, description, required)
values
  ('product_updates', 'Product updates', 'Weekly product notes, platform changes, and launch updates.', false),
  ('coaching', 'Coaching', 'Coaching reminders, services, and coach-specific updates.', false),
  ('funding_opportunities', 'Funding opportunities', 'Relevant grants, events, and funding opportunities.', false),
  ('events', 'Events', 'Workshops, office hours, and live session announcements.', false),
  ('transactional', 'Account notices', 'Required account, billing, and security notices.', true)
on conflict (id) do update
set
  label = excluded.label,
  description = excluded.description,
  required = excluded.required,
  updated_at = timezone('utc', now());

create unique index if not exists platform_email_preferences_email_topic_idx
  on public.platform_email_preferences (email, topic_id);

create index if not exists platform_email_preferences_topic_status_idx
  on public.platform_email_preferences (topic_id, status);

create index if not exists platform_email_consent_events_email_created_at_idx
  on public.platform_email_consent_events (lower(email), created_at desc);

create index if not exists platform_email_consent_events_campaign_idx
  on public.platform_email_consent_events (campaign_id, created_at desc);

create unique index if not exists platform_email_links_campaign_key_idx
  on public.platform_email_links (campaign_id, link_key)
  where campaign_id is not null;

create index if not exists platform_email_link_clicks_campaign_clicked_idx
  on public.platform_email_link_clicks (campaign_id, clicked_at desc);

drop trigger if exists set_updated_at_platform_email_topics
  on public.platform_email_topics;
create trigger set_updated_at_platform_email_topics
before update on public.platform_email_topics
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_platform_email_preferences
  on public.platform_email_preferences;
create trigger set_updated_at_platform_email_preferences
before update on public.platform_email_preferences
for each row execute procedure public.handle_updated_at();

alter table public.platform_email_topics enable row level security;
alter table public.platform_email_preferences enable row level security;
alter table public.platform_email_consent_events enable row level security;
alter table public.platform_email_links enable row level security;
alter table public.platform_email_link_clicks enable row level security;

create policy "platform_email_topics_admin_all"
on public.platform_email_topics
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_preferences_admin_all"
on public.platform_email_preferences
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_consent_events_admin_all"
on public.platform_email_consent_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_links_admin_all"
on public.platform_email_links
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "platform_email_link_clicks_admin_all"
on public.platform_email_link_clicks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
