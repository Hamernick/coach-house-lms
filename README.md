# Coach House Platform

Coach House is a Next.js App Router product for nonprofit organizations. It combines workspace planning, accelerator lessons, roadmap editing, documents, billing, and account management on top of Supabase, Stripe, and shadcn/ui.

## Source of truth

- Root contract: [`AGENTS.md`](AGENTS.md)
- Active continuation thread: [`docs/agent/HANDOFF.md`](docs/agent/HANDOFF.md)
- Product/system overview: [`docs/OVERVIEW.md`](docs/OVERVIEW.md)
- Architecture and security: [`docs/agent/architecture-security.md`](docs/agent/architecture-security.md)
- Workflow and quality gates: [`docs/agent/workflow-quality.md`](docs/agent/workflow-quality.md)
- Recent implementation history: [`docs/RUNLOG.md`](docs/RUNLOG.md)

## Core surfaces

- Public marketing and discovery routes under `src/app/(public)/**`
- Auth flows under `src/app/(auth)/**`
- Workspace and dashboard routes under `src/app/(dashboard)/**`
- Accelerator lesson routes under `src/app/(accelerator)/**`
- Shared feature code under `src/features/**`
- Shared UI and shell components under `src/components/**`
- Supabase SQL and RLS tests under `supabase/**`

Key user-facing routes currently include:

- `/workspace`
- `/workspace/roadmap`
- `/organization/documents`
- `/people`
- `/accelerator`

## Stack

- Next.js 16 + React + TypeScript
- App Router, RSC-first
- Tailwind CSS + shadcn/ui
- Supabase Postgres/Auth/Storage with RLS
- Stripe Checkout + webhook processing
- Vitest + Playwright

## Setup

Prerequisites:

- Node 20+
- `pnpm`
- Supabase project or local CLI setup
- Stripe test/live credentials as needed

Install and run:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm start
pnpm setup:hooks
pnpm db:push
pnpm seed:validate
pnpm verify:settings -- <email>
pnpm verify:stripe
```

## Quality gates

The canonical local and CI gate is:

```bash
pnpm check:quality
```

That command runs:

- `pnpm lint`
- structure / route / feature / boundary checks
- workspace storage and interaction-lock guardrails
- snapshot tests
- acceptance tests
- RLS tests
- production build
- visual regression tests
- performance budget checks

Useful supporting commands:

```bash
pnpm check:prepush
pnpm seed:validate
pnpm verify:settings -- <email>
pnpm verify:stripe
pnpm test:acceptance
pnpm test:snapshots
pnpm test:rls
pnpm test:visual
pnpm test:visual:update
pnpm check:perf
```

## Production preflight

Before a production merge to `main`, run:

```bash
pnpm check:quality
pnpm check:prepush
pnpm seed:validate
pnpm verify:settings -- <email>
pnpm audit --prod --audit-level high
```

Recommended release artifacts:

- a dedicated release branch and PR into `main`
- validation evidence copied into the PR body
- screenshots/manual QA notes for UI changes
- an appended entry in [`docs/RUNLOG.md`](docs/RUNLOG.md)
- a release note/checklist doc under `docs/releases/**` when the change set is broad

## Release workflow

- Branch format: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- PR title format: `[STEP SNN] <title>`
- Use [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)
- Update [`docs/RUNLOG.md`](docs/RUNLOG.md) for every ad-hoc/Codex session
- Ship only after `pnpm check:quality` passes locally and in CI

GitHub Actions currently enforce:

- PR title validation
- full `pnpm check:quality` on PRs and pushes to `main`

## Security and platform expectations

- RLS on application tables
- Server-side authorization for protected actions
- Stripe webhook signature verification and idempotency by `event_id`
- UTC timestamps in storage, locale-aware rendering in UI
- Sanitized HTML and no client-side secret leakage
- Signed URLs for protected storage access

## Notes for contributors

- Keep route files composition-only when possible; put feature logic in `src/features/**`
- Reuse shared UI/system primitives before introducing one-off controls
- Keep visual changes paired with updated baselines when intentional
- If a release changes UI behavior materially, include screenshots and manual QA notes in the PR
