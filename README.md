# Coach House LMS

Minimal, production‑ready LMS. Next.js (App Router, RSC), Supabase, Stripe, shadcn/ui.

## Why this repo design

* **PR‑first**: small, reviewable changes.
* **Agent‑driven**: `docs/CODEX_RUNBOOK.md` stepper; say **“Proceed.”** to advance.
* **Explicit contract**: `docs/AGENTS.md` = source of truth.

## Architecture

* **Web**: Next.js + TS, RSC‑first, Tailwind, shadcn/ui, next‑themes, Sonner.
* **Data/Auth**: Supabase (Postgres, Auth, Storage, RLS).
* **Billing**: Stripe (Checkout, Customer Portal, webhooks).
* **Runtimes**: Node (API, webhooks), Edge/ISR (public pages).
* **Caching**: ISR for marketing; `no-store` for authed data; invalidate on writes.
* **Security**: CSP, XSS sanitization, HTTPS, HttpOnly cookies, admin audit.

## Repository layout

```
app/                     # routes: (public)|(auth)|(dashboard), /admin, /billing
src/components/          # UI + app components (Skeleton, Breadcrumb, DataTable, etc.)
src/lib/                 # clients/helpers (supabase, stripe, auth)
docs/AGENTS.md           # execution contract (v4)
docs/CODEX_RUNBOOK.md    # build stepper & prompts
migrations/              # SQL schema + RLS policies (versioned)
.github/workflows/       # CI (validate title, build/test)
.github/PULL_REQUEST_TEMPLATE.md
```

## Prerequisites

* Node 18+ and **pnpm**
* Supabase project (or local via CLI)
* Stripe account (test mode)

## Setup

```bash
pnpm i
cp .env.example .env.local
# Fill:
# NEXT_PUBLIC_SITE_URL=https://localhost:3000
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...      # server only
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
```

## Run (dev)

```bash
pnpm dev          # web
# optional: supabase start  # if using local DB
```

## Database & RLS

* Schema per `docs/AGENTS.md §4`; RLS enabled on all app tables.
* Apply migrations (example):

```bash
# using Supabase CLI (or psql):
supabase db push   # or run SQL files in migrations/
```

## Stripe

* Create products/prices in dashboard.
* Set webhook → `/api/stripe/webhook` (verify signature).
* Use Customer Portal for billing mgmt.

## CI/CD

* **Checks**: `ci.yml` runs lint (`npm run lint`), snapshot tests (`npm run test:snapshots`), and build (`npm run build`).
* **Titles**: enforce `[STEP SNN]` via `validate-step-id.yml`.
* **Previews**: configure your host (e.g., Vercel) for PR previews.

## Agent workflow

1. Open `docs/CODEX_RUNBOOK.md`.
2. Say **“Proceed.”** (Codex executes first unchecked step).
3. Review PR → merge.
4. Repeat.

## Development standards

* RSC by default; client only for interactivity.
* Secrets server‑side; storage via **signed URLs**.
* Verify webhooks; log failures; idempotency by `event_id`.
* Hydration minimization; lazy/dynamic for heavy UI.
* WCAG AA; keyboard/focus visible; touch targets ≥44px.

## Acceptance (MVP)

* Paid signup → dashboard reflects subscription.
* `/class/[slug]/module/[index]` flow; completing 1 unlocks 2.
* Admin: classes/modules CRUD + reorder + publish; users list/detail (search/filter/CSV, role change, resend verification/magic link, revoke sessions); KPIs.
* Errors observable; budgets met (LCP ≤2.5s, TTI ≤4s); no console errors.

## Contributing

* Branch: `feat|fix|chore/<slug>`.
* PR title: `[STEP SNN] <title>`; use template.
* One concern per PR; migrations reversible; tests/docs included.

## License

MIT

---

**Sanity check**: This README matches the proposed workflow: runbook in `docs/`, PR‑gated steps, CI title guard, agent proceeds step‑by‑step. Ready to start at **S00**.
