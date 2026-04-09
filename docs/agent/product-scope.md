# Product Scope Contract

## MVP Scope

- Public: Landing, Pricing.
- Auth: email/password, magic link, verify, reset.
- Payments: Stripe subscriptions (checkout -> webhook -> subscription record -> access).
- Student/member: workspace, classes/modules (video, markdown, inputs, deck download), sequential unlock.
- Admin: class/module/content CRUD, reorder modules, PDF upload, publish/unpublish, user management, admin KPIs.

## Routing And Navigation

- Route groups: `(public)`, `(auth)`, internal authenticated app shell `(dashboard)`, plus `(community)` and `(admin)`.
- Canonical URLs:
  - `/workspace`
  - `/workspace/present`
  - `/projects`
  - `/my-tasks`
  - `/people`
  - `/organization/documents`
  - `/class/{slug}`
  - `/class/{slug}/module/{index}`
  - `/billing`
  - `/community`
  - `/admin/*`
- Legacy aliases:
  - `/my-organization` -> `/workspace`
  - `/organization` -> `/workspace`
- Breadcrumbs are contextual, with loading skeletons and mobile truncation.
- Guards:
  - 401 -> login
  - 403 -> access message
  - Unpublished content disabled
  - 404 with useful empty state

## UI Layouts

### Student

- Workspace: Next Up, progress overview, nonprofit canvas, upcoming schedule, classes, assignments due, recent activity.
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
- Onboarding: first-login wizard -> `/workspace` or `/find` based on intent, inactivity nudge.
- Admin: content CRUD, reorder, upload, preview, publish.

## State Coverage

- Every key screen supports loading, empty, error, and success states.
- Maintain a coverage matrix for key screens x state.

## Acceptance Criteria

- Paid signup reaches the intended post-auth surface (`/workspace` for builders, `/find` for find/fund/support intents) with active subscription reflected.
- Module completion unlocks the next module.
- Workspace Next Up/progress values are accurate.
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
7. Admin users/app shell.
8. Billing management.
9. Performance and accessibility polish.

## Non-Goals

- Teams, mentors, certificates, deep analytics, multi-tenant orgs.
