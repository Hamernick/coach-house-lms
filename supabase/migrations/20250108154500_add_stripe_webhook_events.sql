set search_path = public;

create table stripe_webhook_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table stripe_webhook_events is 'Stores processed Stripe webhook events for idempotency';
