# Architecture And Security Contract

## Architecture

- Stack: Next.js App Router (RSC-first) + Supabase + Stripe webhooks.
- Runtime split:
  - Node runtime for Stripe/webhook handlers.
  - Edge/ISR for static/public surfaces where appropriate.
- Caching:
  - Marketing pages use ISR.
  - Authenticated data uses `no-store`.
- Errors:
  - Structured server errors with user-friendly UI.
- All user/admin markdown must be sanitized before render.

## Technical Directives

- Persist timestamps in UTC `TIMESTAMPTZ`.
- Render time/date/currency/number values in user locale/time zone.
- Sanitize HTML to prevent XSS.

## Data Model Contract

- Core entities:
  - `Profile`
  - `Class`
  - `Module`
  - `Enrollment`
  - `ModuleProgress`
  - `Subscription`
- Extended entities:
  - `ModuleAssignment`
  - `AssignmentSubmission`
  - `Nonprofit`
- Constraints:
  - Unique slugs.
  - Unique `(class_id, idx)` module ordering.
  - Foreign keys cascade.
  - Stripe `event_id` idempotency enforced.
- Required admin views:
  - `progress_summary`
  - `subscription_summary`
  - Nightly cached revenue snapshots.

## Access Control And Authz

- RLS is enabled on all tables.
- Students can read published class/module data and edit their own records only.
- Admins get full access based on `profiles.role`.
- JWT includes role claims.
- Audit all admin actions.
- All mutations enforce server-side authorization.

## Performance Budget

- LCP <= 2.5s on mid-range mobile.
- TTI <= 4.0s on mid-range mobile.
- Minimize hydration and lazy-load heavy widgets.
- Paginate long lists and stream large payloads.

## Security Baseline

- Keep Stripe/Supabase secrets server-side only.
- Verify Stripe webhook signatures and idempotency.
- Enforce CSP and sanitize rendered HTML.
- HTTPS only with Secure + HttpOnly cookies.
- Keep an admin audit log.

## Observability

- Structured logs for app/webhook flows.
- No silent failures; all failures surface actionable context.
- Minimal analytics events:
  - page view
  - module view
  - module completion

## Integrations

- Supabase:
  - Use env-based config with SSR cookies.
  - Keep `decks` bucket private with signed URLs.
- Stripe:
  - Product/price setup in dashboard.
  - Use webhook signature verification.
  - Use Customer Portal for billing management.

## I18n And Time Zones

- Do not hard-code labels (maintain i18n scaffolding).
- Store UTC, render local.
- Use locale-aware number/currency/date formatting APIs.
