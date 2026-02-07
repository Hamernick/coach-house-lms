# Product Scope Contract

## MVP Scope

- Public: Landing, Pricing.
- Auth: email/password, magic link, verify, reset.
- Payments: Stripe subscriptions (checkout -> webhook -> subscription record -> access).
- Student: dashboard, classes/modules (video, markdown, inputs, deck download), sequential unlock.
- Admin: class/module/content CRUD, reorder modules, PDF upload, publish/unpublish, user management, dashboard KPIs.

## Routing And Navigation

- Route groups: `(public)`, `(auth)`, `(dashboard)`, plus `/admin/**` and `/billing`.
- Canonical URLs:
  - `/dashboard`
  - `/class/{slug}`
  - `/class/{slug}/module/{index}`
  - `/pricing`
  - `/billing`
  - `/admin/*`
- Breadcrumbs are contextual, with loading skeletons and mobile truncation.
- Guards:
  - 401 -> login
  - 403 -> access message
  - Unpublished content disabled
  - 404 with useful empty state

## UI Layouts

### Student

- Dashboard: Next Up, Progress Overview, Nonprofit Canvas, Upcoming Schedule, Classes, Assignments Due, Recent Activity.
- Class: module sidebar with progress.
- Module: video, markdown, inputs, Prev/Next actions.
- Nonprofit: compiled canvas from submissions.

### Admin

- Dashboard: KPI cards, tasks, recent submissions.
- Classes: table with publish toggle, counts, actions.
- Editor: details + module list (drag handle) + module CRUD.
- Users: list/search/filter/pagination/export.
- Payments: drill-downs + Stripe portal link.

## Core UX Flows

- Auth: signup -> verify -> signin -> reset.
- Payments: pricing -> checkout -> return; webhook syncs subscription state.
- Billing management: card update, invoices, cancel/resubscribe.
- Onboarding: first-login wizard, inactivity nudge.
- Admin: content CRUD, reorder, upload, preview, publish.

## State Coverage

- Every key screen supports loading, empty, error, and success states.
- Maintain a coverage matrix for key screens x state.

## Acceptance Criteria

- Paid signup reaches dashboard with active subscription reflected.
- Module completion unlocks the next module.
- Dashboard Next Up/progress values are accurate.
- Nonprofit Canvas reflects submissions immediately.
- Admin can manage users, submissions, and learning content.
- Meets WCAG AA, performance budgets, and zero console errors.

## Backlog

1. Env bootstrap (clients/config/shell).
2. Auth flow.
3. Pricing/checkout.
4. Webhooks/subscription sync.
5. Student flow (class list + module unlocks).
6. Admin content CRUD.
7. Admin users/dashboard.
8. Billing management.
9. Performance and accessibility polish.

## Non-Goals

- Teams, mentors, certificates, deep analytics, multi-tenant orgs.
