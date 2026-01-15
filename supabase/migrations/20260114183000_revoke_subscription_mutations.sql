set check_function_bodies = off;
set search_path = public;

-- Subscriptions are written exclusively via server-side Stripe webhooks (service role).
-- End users (authenticated) may read their own subscription row via RLS, but must not mutate it.

revoke insert, update, delete on table subscriptions from anon;
revoke insert, update, delete on table subscriptions from authenticated;

grant select on table subscriptions to authenticated;

