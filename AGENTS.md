# AGENTS.md — Coach House LMS

Canonical agent contract for this repo. Keep this file short; details live in `/docs/agent/**`.

## Non-Negotiables

- Source of truth: this file + linked `docs/agent/**` documents.
- Implement changes in `src/**`, `app/**`, `migrations/**`, or `docs/**`.
- Keep PRs small and pass: `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.
- Build for Next.js App Router, RSC-first, mobile-first, shadcn/ui, dark/light/system.
- Enforce security defaults: RLS on all tables, server-side authz, webhook signature verification, Stripe idempotency via `event_id`, HTML sanitization.
- Store timestamps in UTC (`TIMESTAMPTZ`) and render locale-aware date/time/currency.
- Append each ad-hoc/Codex session summary to `docs/RUNLOG.md`.

## Quick Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build/start: `pnpm build && pnpm start`

## Detailed Contracts

- Product scope, routes, UX flows, acceptance, backlog: `docs/agent/product-scope.md`
- Architecture, data model, RLS, security, observability, integrations: `docs/agent/architecture-security.md`
- Workflow, QA, CI/CD, git/PR, file layout, tooling: `docs/agent/workflow-quality.md`
- UI quality rubric (MUST/SHOULD/NEVER): `docs/agent/ui-rubric.md`

## Existing Supporting Docs

- Overview: `docs/OVERVIEW.md`
- Schema: `docs/DB_SCHEMA.md`
- Next.js runbook: `docs/NEXTJS_RUNBOOK.md`
- Codex runbook: `docs/CODEX_RUNBOOK.md`
