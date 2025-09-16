# CODEX\_RUNBOOK — Stepper & Prompts

> **Goal**: Deterministic, PR‑first build using AGENTS.md (v4). One step per PR. Codex drives; humans review.

## How to use

* **Single command**: *“Proceed.”*  → Codex finds **first unchecked** step and executes.
* On completion: Codex checks the box, opens PR with template below, waits.
* If blocked: mark step **BLOCKED** with reason + proposed fixes.

## Global meta‑prompt (prepend once)

> You are a senior engineer. Follow **AGENTS.md**. Execute **one step** at a time from `## Steps`. Produce: diffs, migrations, tests, docs. Keep PRs small. No speculation; if blocked, write `BLOCKED:` with exact missing info and a minimal fallback. End each run with `DONE` or `BLOCKED`.

## PR template

**Title**: `[STEP {id}] {title}`
**Summary**: what/why; scope; risks
**Checks**: typecheck, lint, build, a11y quick, unit/e2e (list)
**Screens**: light/dark, mobile
**Notes**: rollbacks/migrations/back‑compat

## Commit msg template

```
feat(step {id}): {title}

- Summary
- Notable decisions
- Tests
- Follow‑ups
```

## Steps

* [x] **S00** — Baseline & repo

  * Init Next.js (App Router, TS), Tailwind, shadcn; route groups `(public)|(auth)|(dashboard)`; base lint/format/prettier; `src/lib`, `src/components` skeletons. Add `docs/AGENTS.md` from v4.
  * **Accept**: `pnpm build` passes; folders present; sample page per group.
  * **Changelog**:
    * Route groups now live under `(public)`, `(auth)`, and `(dashboard)` with placeholder pages.
    * Docs migrated into `docs/` with Prettier config and offline-safe font setup.
    * `npm run build` succeeds (pnpm unavailable in sandbox).
  * PR: https://github.com/Hamernick/coach-house-lms/pull/1
* [x] **S01** — Design system

  * Install shadcn/ui, config tokens, dark/light, typography; basic components: Button, Card, Input, Table, Skeleton, Breadcrumb.
  * **Accept**: components render; stories/snapshots added.
  * **Changelog**:
    * Added design system stories for Button, Card, Input, Table, Skeleton, and Breadcrumb.
    * Introduced a TypeScript snapshot runner with a JSON baseline under `tests/snapshots`.
    * Exposed snapshot verify/update scripts via `npm test`.
  * PR: https://github.com/Hamernick/coach-house-lms/pull/2
* [x] **S02** — Supabase client & SSR auth

  * SSR cookie wiring; typed client in `src/lib/supabase`; envs; helper hooks.
  * **Accept**: server and client examples reading user session.
  * **Changelog**:
    * Added Supabase env validation and typed client factories for server, browser, and route handlers.
    * Dashboard now fetches the session server-side and hydrates a `SessionPreview` client widget.
    * Documented required Supabase env vars in `.env.example`.
  * PR: https://github.com/Hamernick/coach-house-lms/pull/3
* [x] **S03** — DB schema & RLS (migrations)
  * **Changelog**:
    * Schema + migrations (profiles, classes, modules, enrollments, module_progress, subscriptions), indexes, RLS.
    * Seeds + RLS test script; generated DB types; npm scripts.
  * PR: https://github.com/Hamernick/coach-house-lms/pull/4
  * Create tables per AGENTS §4; indexes; uniques; RLS policies; profiles with roles.
  * **Accept**: migration up/down; RLS tests; seed script.
  * **Changelog**:
    * Added canonical migrations with triggers, enums, and RLS policies for profiles, classes, modules, enrollments, module progress, and subscriptions.
    * Seeded sample curriculum data and published Supabase typings plus RLS verification script.
    * Wired `npm run test:rls` to exercise policies (skips when Supabase credentials are absent).
  * PR: https://github.com/Hamernick/coach-house-lms/pull/4
* [x] **S04** — Auth flows

  * Signup/verify/signin/reset; guards; route middleware.
  * **Accept**: e2e happy paths; screenshots.
  * **Changelog**:
    * Implemented Supabase email/password flows (sign in, sign up, password reset/update) with server-side callbacks.
    * Added shared auth UI, protected route middleware, and sign-out control for the dashboard shell.
    * Linked verification/reset redirects through `/auth/callback` and surfaced helpful form states.
  * PR: https://github.com/Hamernick/coach-house-lms/pull/5
* [ ] **S05** — Shell & navigation

  * Sidebar/header shell; breadcrumbs; skeletons; empty states.
  * **Accept**: `/dashboard` loads with skeletons; a11y landmarks.
* [ ] **S06** — Pricing page

  * Public `/pricing` with plans pulled from Stripe (test keys placeholder).
  * **Accept**: LCP budget met on mid‑range mobile.
* [ ] **S07** — Stripe checkout

  * Client → Checkout; return handler; subscription record.
  * **Accept**: trialing/active states shown on dashboard.
* [ ] **S08** — Stripe webhook + idempotency

  * Verify signature; store `event_id`; sync subscription lifecycle.
  * **Accept**: replay safe; logs; tests for states.
* [ ] **S09** — Billing management - We're going to placeholder this. We don't have stripe set up yet so we'll set this up so our flows are created/demonstrated but we'll set it up with functionality later. 

  * Stripe Customer Portal link; invoices; cancel/resubscribe.
  * **Accept**: portal opens; state reflects after return.
* [ ] **S10** — Classes model & list

  * CRUD API + RSC queries; `/dashboard` cards with progress stub.
  * **Accept**: list, paginate; empty state.
* [ ] **S11** — Modules & sequential unlock

  * Canonical route `/class/[slug]/module/[index]`; video embed; markdown render; form inputs; Prev/Next.
  * **Accept**: completing module 1 unlocks 2.
* [ ] **S12** — Admin: classes/modules CRUD

  * `/admin/classes`, `/admin/classes/[id]`, `/admin/modules/[id]`; drag‑reorder; publish/unpublish.
  * **Accept**: reorder persists; publish toggles visibility.
* [ ] **S13** — PDF storage (signed URLs)

  * Supabase Storage `decks` private; server‑generated signed URLs; upload UI.
  * **Accept**: upload→view via signed URL; no public ACLs.
* [ ] **S14** — Admin: users list/detail

  * `/admin/users` with search/filter/CSV; detail: profile, enrollments, progress, subscription; actions: role change, resend verification/magic link, revoke sessions; read‑only impersonation.
  * **Accept**: CSV export; audit log entries.
* [ ] **S15** — Admin dashboard KPIs

  * KPI cards (students, active subs, 30‑day revenue); recent enrollments/payments.
  * **Accept**: queries cached sensibly; loading skeletons.
* [ ] **S16** — Observability & errors

  * Structured logs; error boundaries; toasts; webhook/event logs.
  * **Accept**: forced failures produce actionable errors.
* [ ] **S17** — Performance

  * Hydration minimization; dynamic imports; pagination; budgets enforced.
  * **Accept**: LCP≤2.5s, TTI≤4s on mid‑range mobile.
* [ ] **S18** — i18n & time

  * Locale scaffolding; UTC→local formatting; currency/number.
  * **Accept**: per‑user locale switch; snapshots updated.
* [ ] **S19** — CI/CD & environments

  * GitHub Actions: typecheck/lint/build/test/a11y; preview deploy; prod envs wired.
  * **Accept**: PR status checks green; preview URL posted.
* [ ] **S20** — Acceptance tests

  * E2E flows: paid signup→dashboard; module unlock; admin CRUD; billing changes.
  * **Accept**: all green in CI; no console errors.

## Controller prompt (for “Proceed” runs)

> Read `CODEX_RUNBOOK.md`. Identify the first unchecked step. Execute only that step. Produce a PR with the prescribed template. Update the checkbox to checked, add a short **Changelog** section under the step with what changed, and append a link to the PR. End with `DONE`.

## Step‑specific prompt (when targeting a step)

> Execute **{step id} — {title}**. Follow AGENTS.md. Keep scope minimal. Provide: diffs, tests, screenshots. If blocked, output `BLOCKED: …` and propose minimal unblocking changes.

## Blocked/redo prompt

> Investigate failure for **{step id}**. Read CI logs and code. Propose and apply the smallest fix. Re‑run checks. Update PR.

## State files

* `docs/CODEX_RUNBOOK.md` (this file; Codex updates checkboxes + changelogs)
* `docs/RUNLOG.md` (timestamped log per step)

## Quality gates

* Required checks: typecheck · lint · build · unit · e2e · a11y quick.
* Review checklist: security, perf, a11y, RLS, migrations reversible.

## Ground rules for Codex

* Never bypass RLS; no client secrets.
* One concern per PR; no unrelated refactors.
* Prefer server actions/RSC; minimal client code.
* Use signed URLs for private files; verify webhooks.
* Ask only when blocked; suggest defaults.
