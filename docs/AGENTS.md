# AGENTS.md — Coach House LMS (Merged v4)

> **Purpose**: Execution‑ready, UI‑explicit contract for agents. Concise. Deterministic. Testable.

## 0) Ground rules

* **Source of truth**: this file.
* **No inline code**: implement in `src/**`, `app/**`, `migrations/**`, `docs/**`.
* **Small PRs**: each passes typecheck · lint · build · a11y quick‑check.
* **Design**: RSC‑first, mobile‑first, HIG‑inspired; dark/light/system.

## 1) Scope (MVP)

* **Public**: Landing, Pricing.
* **Auth**: email+password, magic link, verify email, reset password.
* **Payments**: Stripe subscriptions; checkout → webhook → subscription record → access.
* **Student**: dashboard (sidebar), classes → modules (video, markdown, inputs, deck download), sequential unlock.
* **Admin**: CRUD classes/modules/content; reorder modules; PDF upload; publish/unpublish; **user mgmt** (list/search/filter, view progress & subscription, role change); **admin dashboard** (active users, completion %, MRR/revenue, recent signups/payments).

## 2) Architecture

* **Runtimes**: Stripe/webhooks/Node‑only → **Node**; static/public pages → **Edge/ISR allowed**.
* **RSC/CSR boundary**: fetch+render on server by default; clients for interactivity (forms, toasts, drawers, video).
* **Caching**

  * Marketing/pricing: ISR with sensible `revalidate`.
  * Auth’d dashboards, per‑user data: `no-store` unless provably safe.
  * Lists/detail: cache server queries where safe; invalidate on writes.
* **Error surfaces**: graceful error pages; server actions return structured errors for UI.

## 3) Technical directives

* **Time**: store **UTC TIMESTAMPTZ**; display in user locale/time zone; locale‑aware number/currency.
* **Sanitize**: HTML/markdown & any user/admin content before render (prevent XSS).

## 4) Data model (contract)

* Entities: **Profile**, **Class**, **Module**, **Enrollment**, **ModuleProgress**, **Subscription**.
* Extended (execution plan): **ModuleAssignment**, **AssignmentSubmission**, **Nonprofit**.
* Constraints

  * Uniques: class `slug`; module `(class_id, idx)` and `(class_id, slug)`; enrollment `(user_id, class_id)`; subscription `(user_id, stripe_subscription_id)`.
  * FKs with `ON DELETE CASCADE` where appropriate.
* Indexes (min): `enrollments.user_id`, `modules.class_id`, `modules(class_id, idx)`, `module_progress.user_id`, `module_progress.module_id`, `subscriptions.user_id`.
* Idempotency: persist external `event_id` (Stripe) to dedupe.
* **Admin views (read‑only)**: `progress_summary`, `subscription_summary`; revenue from Stripe at render or cached server‑side; optional nightly snapshot.
* Notes
  * `ModuleAssignment` stores a JSON form schema per module.
  * `AssignmentSubmission` stores per‑user answers/files with feedback/status.
  * `Nonprofit` stores a denormalized rollup of a learner’s org profile built from latest submissions.

## 5) Access control (RLS)

* **Enable RLS** on all app tables.
* Students: read published classes/modules; read/write **own** profile/enrollments/progress/subscription.
* Admins: full read/write via role in **profiles**; policy bypass.
* **JWT claims** include role; server verifies on privileged routes. **Audit** admin actions.

## 6) Routing & navigation

* **Route groups**: `(public) / (auth) / (dashboard)`; admin under `/admin/**`; billing `/billing`.
* **Canonical URLs**

  * `/dashboard`
  * `/class/{class-slug}`
  * `/class/{class-slug}/module/{index}` (**canonical**) — optional alias `/module/{slug}` 301→index
  * `/pricing`, `/billing`
  * `/assignments` (learner list)
  * `/nonprofit` (learner canvas)
  * `/admin`, `/admin/classes`, `/admin/classes/{id}`, `/admin/modules`, `/admin/modules/{id}`, `/admin/users`, `/admin/users/{id}`, `/admin/payments`, `/admin/reports`
  * `/admin/schedule` (optional)
* **Shell**: persistent sidebar + header; only main canvas scrolls.
* **Breadcrumbs**: `Dashboard › {Class} › Module {n}` or `Admin › {Section} › {Entity}`; last crumb not a link; skeleton while resolving; mobile truncate.
* **Guards**: 401→login; 403→friendly message; unpublished/locked disabled with reason; 404 pleasant empty.

## 7) UI/UX layouts & key screens

### Student

* **Dashboard (`/dashboard`)**: top: **Next Up** card; **Progress Overview**; **Nonprofit Canvas** (read‑only preview). Below: **Upcoming Schedule**, **My Classes** (enrolled only, with real progress), **Assignments Due**, **Recent Activity**.
* **Class (`/class/[slug]`)**: main pane = description; left sidebar = modules with progress/lock icons.
* **Module (`/class/[slug]/module/[index]`)**: single‑column: video, markdown, form inputs; bottom **Prev/Next**.
* **Nonprofit (`/nonprofit`)**: full canvas view of the learner’s org, compiled from assignment submissions; each section links back to its module.

### Admin

* **Admin Dashboard (`/admin`)**: KPI cards (Total Students, Active Subs, 30‑day Revenue); **Teaching Tasks** (new submissions, stalled learners, upcoming sessions); **Recent Submissions** stream with “Review”.
* **Classes (`/admin/classes`)**: full‑page data table (shadcn/ui). Columns: **Class Title**, **Published** (Switch), **# Modules**, **Actions** (Edit, Delete). Primary **New Class** button top‑right.
* **Class Editor (`/admin/classes/[id]`)**: two‑column.

  * Left: form (Title, Slug, Description, Stripe IDs, Publish toggle).
  * Right: list of modules with drag‑handle; buttons **Edit Module** / **Add Module**.
* **Module Editor (extended)**: Tabs — Details (title/slug/video), Content (markdown + preview), **Assignment** (form schema), **Resources** (links/files), Deck (PDF upload).
* **Roster (tab under Class)**: table of learners with progress %, last activity; CSV export; links to user detail.
* **Users (`/admin/users`)**: table with search (name/email), filters (role/status/plan), pagination, **CSV export**.
* **User Detail (`/admin/users/[id]`)**: profile, enrollments, progress summary, subscription status, recent payments; actions: change role, resend verification/magic link, revoke sessions (no direct password edits). **Impersonation** read‑only preview.
* **Payments/Reports**: lists with drill‑downs; link to billing portal for account changes.

### Design system

* shadcn **dashboard‑01** shell; Tailwind tokens via CSS vars; dark/light.
* Prefer shadcn primitives; forms via React Hook Form; visible focus rings; keyboard navigable; touch targets ≥44px.
* **Video**: YouTube **unlisted**, privacy‑enhanced; rounded corners, `aspect-video`, lazy‑load; accessible title; fallback poster; provider allowlist.

## 8) UX flows

* **Auth**: signup→verify; signin; optional magic link; reset (request→email→set new→success redirect).
* **Payments**: pricing→checkout→return; webhook sync; reflect `trialing|active|past_due|canceled`.
* **Billing mgmt**: card update, invoices, cancel/resubscribe (Stripe Portal or in‑app).
* **Onboarding**: first‑login wizard (name/org, select class, acknowledge guidelines); nudge to next module after inactivity.
* **Admin content**: classes/modules CRUD; reorder; markdown preview; deck upload; publish/unpublish; validation + confirms.

## 9) States (must implement)

* **Loading**: route spinners; **skeletons** for cards/lists/forms.
* **Empty**: friendly CTAs.
* **Error**: inline explain + retry; toast; preserve input.
* **Success**: visible confirmation; UI state reflects change.
* **Coverage matrix**: checklist of key screens × (loading, empty, error, success).

## 10) Performance

* Budgets: **LCP ≤2.5s**, **TTI ≤4s** on mid‑range mobile.
* Hydration minimization; dynamic‑import heavy widgets (markdown editor, admin tables).
* Lazy‑load media; paginate long lists; prefer streaming for large server payloads.

## 11) Security

* Secrets server‑side only (Stripe, Supabase service key).
* **Webhook**: verify signature; idempotent by `event_id`; log + alert failures.
* Server‑side authz on every API/server action; **never** trust client.
* XSS/HTML sanitization; apply **CSP** where feasible.
* HTTPS only; cookies `Secure` + `HttpOnly`; **admin audit log**.

## 12) Observability & errors

* Structured server logs; webhook event logs; minimal analytics (page/module view, module completion); admin audit entries.
* Error reporting in prod; **silent failures forbidden**; toast + actionable text.

## 13) File & module layout (guidance)

* `src/app/(public)/*`, `(auth)/*`, `(dashboard)/*`, `/billing`, `/admin/**`.
* `src/components/**` (ui + app; **Skeleton**, Breadcrumb, Sidebar, KPI cards, DataTable).
* `src/lib/**` (clients/helpers: supabase/stripe); `migrations/**` (schema/RLS); `docs/**` (contracts, admin handbook).

## 14) Integrations (requirements)

* **Supabase**: URL/keys via env; SSR cookie wiring. Storage bucket `decks` is **private**; access via server‑generated **signed URLs** (time‑limited). Provide migrations implementing §4–§5.
* **Stripe**: products/prices in dashboard; webhook validates signature and updates Subscription; billing via **Stripe Customer Portal**.

## 15) CI/CD & environments

* Only 1 environment to increase velocity **prod** (Supabase; Stripe test/live).
* Migrations versioned & reversible; seed scripts/fixtures.
* GitHub Actions on PRs: typecheck · lint · build; preview deploys.
* Feature flags for risky changes.

## 16) Internationalization & time zones

* Labels not hard‑coded; basic locale scaffolding.
* Store UTC; display local; locale‑aware currency/number.

## 17) Acceptance criteria

* Paid signup → authenticated return → dashboard reflects subscription.
* Student can open module 1, save inputs, **complete**, and **unlock** module 2.
* Student dashboard shows **Next Up** and accurate per‑class progress; completing a module advances **Next Up**.
* Nonprofit Canvas reflects latest assignment submissions immediately (server‑rendered snapshot).
* Admin can manage users (list/search/filter, view detail with progress & subscription, role change, resend verification/magic link, revoke sessions) and see **Admin Dashboard** with KPIs and recent payments.
* Admin can review submissions, leave feedback/status, and see cohort progress in a roster view.
* Admin can create/edit class & module, reorder, upload PDF, publish.
* Routing matches §6; deep links work; guards handled. States implemented; video spec met.
* Meets perf budgets; no console errors; WCAG AA; build passes.

## 18) Agent workflow

1. **Plan**: list files to touch; propose diffs.
2. **Implement**: generate code/migrations/docs in proper folders.
3. **Validate**: run checks; smoke test (auth, payment, unlock, billing update, admin users).
4. **Deliver**: PR with screenshots (light/dark, mobile) + state coverage notes.

## 19) Backlog (order)

1. Bootstrap & Env: clients, config, dashboard shell, routing groups, skeletons.
2. Auth flow: signup/verify/signin/reset + guards; onboarding stub.
3. Pricing & Checkout; return handling.
4. Webhooks & Subscriptions: signature verify, idempotency, subscription sync; logs.
5. Student course flow: class list, modules, sequential unlock; YouTube embed; form\_schema rendering; overview aggregation.
6. Admin Content CRUD: classes/modules CRUD, drag‑reorder, PDF upload, publish/unpublish.
7. Admin Users & Dashboard: list/detail, role change, resend verification/magic link, revoke sessions; KPIs; payments list.
8. Billing Mgmt: portal or in‑app (payment method, invoices, cancel/resub).
9. Perf + A11y polish: budgets, lazy/dynamic, pagination; finalize acceptance tests.

## 20) Non‑goals (MVP)

* Teams/mentors, certificates, rich analytics (beyond dashboard KPIs), multi‑tenant orgs.

## 21) Notes for human maintainers

* Keep this file short and directive; move extra detail to `docs/**` and `migrations/**`.
* Update acceptance criteria as scope evolves.
