# AGENTS.md — Coach House LMS (Merged v5)

> **Purpose:** Canonical agent + repository contract. Execution-ready, deterministic, testable. For deeper context, cross-reference all companion documents under `/docs`.

---

## 0) Ground Rules

* **Source of truth:** this file.
* **Additional context:** see `/docs` for architecture, schema, and runbook details.
* **No inline code:** implement in `src/**`, `app/**`, `migrations/**`, `docs/**`.
* **Small PRs:** each passes `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.
* **Design:** RSC-first, mobile-first, HIG-inspired; dark/light/system; shadcn/ui.

---

## 1) Scope (MVP)

**Public:** Landing, Pricing.
**Auth:** email+password, magic link, verify, reset.
**Payments:** Stripe subscriptions (checkout → webhook → subscription record → access).
**Student:** dashboard, classes → modules (video, markdown, inputs, deck download), sequential unlock.
**Admin:** CRUD classes/modules/content; reorder modules; PDF upload; publish/unpublish; user mgmt (list/search/filter, view progress & subs, role change); admin dashboard (KPIs, completion %, MRR, recent signups/payments).

---

## 2) Architecture

* **Next.js App Router (RSC-first)** with Supabase + Stripe webhooks.
* **Runtimes:** Node for Stripe/webhooks; Edge/ISR for static/public.
* **Cache:** Marketing via ISR; authed data `no-store`.
* **Error surfaces:** structured server errors; friendly UI.
* **HTML sanitization:** all user/admin markdown.

---

## 3) Technical Directives

* Store **UTC TIMESTAMPTZ**; display in user locale/time zone.
* Locale-aware currency/number formatting.
* Sanitize HTML; prevent XSS.

---

## 4) Data Model (Contract)

Entities: `Profile`, `Class`, `Module`, `Enrollment`, `ModuleProgress`, `Subscription`.

Extended: `ModuleAssignment`, `AssignmentSubmission`, `Nonprofit`.

Constraints:

* Unique slugs and `(class_id, idx)`.
* FKs cascade.
* Stripe `event_id` idempotent.

Admin Views:

* `progress_summary`, `subscription_summary`.
* Cached nightly revenue snapshots.

---

## 5) Access Control (RLS)

* **RLS on all tables.**
* Students: read published classes/modules; edit own data.
* Admins: full access via role in `profiles`.
* JWT includes role; audit all admin actions.

---

## 6) Routing & Navigation

Groups: `(public) / (auth) / (dashboard)`; `/admin/**`; `/billing`.

Canonical URLs:

```
/dashboard
/class/{slug}
/class/{slug}/module/{index}
/pricing
/billing
/admin/*
```

Breadcrumbs: contextual; skeletons while resolving; mobile truncate.

Guards: 401→login; 403→message; unpublished disabled; 404 empty.

---

## 7) UI/UX Layouts

### Student

* Dashboard: Next Up, Progress Overview, Nonprofit Canvas, Upcoming Schedule, Classes, Assignments Due, Recent Activity.
* Class: sidebar modules with progress.
* Module: video, markdown, inputs; Prev/Next buttons.
* Nonprofit: compiled canvas from submissions.

### Admin

* Dashboard: KPI cards, tasks, recent submissions.
* Classes: table with publish switch, count, actions.
* Editor: details, modules list (drag handle), module CRUD.
* Users: list/search/filter/pagination/export.
* Payments: drill-downs, link to Stripe portal.

Design: shadcn dashboard shell; Tailwind tokens; dark/light; React Hook Form; accessible; responsive; YouTube unlisted embeds.

---

## 8) UX Flows

* Auth: signup→verify→signin→reset.
* Payments: pricing→checkout→return; webhook→sync subscription.
* Billing mgmt: card update, invoices, cancel/resubscribe.
* Onboarding: first-login wizard; inactivity nudge.
* Admin: CRUD content, reorder, upload, preview, publish.

---

## 9) States

* Loading: skeletons/spinners.
* Empty: friendly CTAs.
* Error: inline + toast.
* Success: confirmation; UI updates.
* Coverage matrix: key screens × (loading, empty, error, success).

---

## 10) Performance

* LCP ≤2.5s, TTI ≤4s mid-range mobile.
* Hydration minimization; lazy/dynamic heavy widgets.
* Paginate long lists; stream large payloads.

---

## 11) Security

* Secrets server-side (Stripe, Supabase service key).
* Verify webhook signature; idempotency via `event_id`.
* Server-side authz for all actions.
* Sanitize HTML; enforce CSP.
* HTTPS only; Secure+HttpOnly cookies; admin audit log.

---

## 12) Observability & Errors

* Structured logs; webhook events; admin audit.
* No silent failures; actionable errors.
* Minimal analytics: page/module view, completion.

---

## 13) File & Module Layout

```
src/app/(public|auth|dashboard)/**
src/app/admin/**
src/app/billing/**
src/components/**  # shadcn ui, tables, skeletons, etc.
src/lib/**         # supabase/stripe clients
src/hooks/**       # shared logic
supabase/**        # schema, policies, tests
public/**          # static assets
docs/**            # runbooks, contracts, diagrams, context extensions
```

---

## 14) Integrations

* **Supabase:** env vars; SSR cookies; `decks` bucket private w/ signed URLs.
* **Stripe:** dashboard products/prices; webhook signature verify; Customer Portal for billing.

---

## 15) CI/CD & Environments

* Single env `prod` (Supabase + Stripe test/live).
* Migrations versioned & reversible.
* GitHub Actions: typecheck, lint, build, preview deploys.
* Feature flags for risky changes.

---

## 16) Internationalization & Time Zones

* Labels not hard-coded; base i18n scaffolding.
* Store UTC; display local; locale-aware currency/number.

---

## 17) Acceptance Criteria

* Paid signup → dashboard reflects subscription.
* Student completes module → unlocks next.
* Dashboard shows accurate Next Up/progress.
* Nonprofit Canvas updates instantly.
* Admin manages users, reviews submissions, edits content.
* Meets perf budgets, WCAG AA, zero console errors.

---

## 18) Agent Workflow

1. Plan: list files to touch; propose diffs.
2. Implement: code/migrations/docs in correct dirs.
3. Validate: run checks; smoke test (auth, payment, unlock, billing, admin).
4. Deliver: PR with screenshots (light/dark/mobile) + state coverage notes.
5. Log: append a concise entry to `docs/RUNLOG.md` for every ad‑hoc or Codex session (what changed, what worked, what didn’t, and where to pick up next).

---

## 19) Backlog

1. Env bootstrap (clients/config/shell).
2. Auth flow.
3. Pricing/checkout.
4. Webhooks/subscription sync.
5. Student flow (class list, module unlocks).
6. Admin content CRUD.
7. Admin users/dashboard.
8. Billing mgmt.
9. Perf + a11y polish.

---

## 20) Non-goals

Teams, mentors, certificates, deep analytics, multi-tenant orgs.

---

## 21) Maintainer Notes

Keep concise; move extra detail to `/docs/**`.

---

## 22) Testing & QA

* **Vitest**: acceptance, snapshots; mirror CI locally.
* RLS tests after every migration/policy edit.
* Snapshots updated via `pnpm snapshots:update`.
* Mirror CI: `pnpm lint && pnpm test:snapshots && pnpm test:acceptance`.
* Add targeted edge cases.

---

## 23) Git & PR Workflow

* Branch: `feat|fix|chore/<slug>`.
* Commit present tense (e.g., `docs: mark S32 complete`).
* PR title `[STEP SNN] <title>` with checklist, linked issue, UI artifacts.
* Flag risks and env notes for reproducibility.

---

## 24) Build & Dev Commands

* Install: `pnpm install`.
* Dev: `pnpm dev` → `http://localhost:3000`.
* Build: `pnpm build` → `pnpm start`.
* Guardrails: lint/tests/RLS.
* Utilities: `pnpm check:perf`, `pnpm db:push`, `pnpm create:admin`, `pnpm verify:settings`.

---

## 25) Performance, Security & Observability Summary

* **Performance:** LCP ≤2.5s, lazy media, paginated tables.
* **Security:** CSP, signed URLs, verified webhooks.
* **Observability:** structured logs, alerts, no silent failures.

---

## 26) Agent Tooling

* Workspace `mcp.json` provisions `filesystem`, `shell`, `ripgrep`, and `git` MCP servers via `npx`; they default to the repo root.
* Install `rg` (ripgrep) locally so the search server succeeds (`brew install ripgrep` on macOS).
* Approve the servers in your MCP-aware client (Claude Desktop, VS Code MCP) before starting runs.

---

**End of file — canonical agent & repo contract for Coach House LMS.
For extended documentation and reasoning, review `/docs` files.**
