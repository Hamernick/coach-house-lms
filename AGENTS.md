# AGENTS.md — Coach House LMS

Canonical agent contract for this repo. Keep this file short; details live in `/docs/agent/**`.

## Non-Negotiables

- Source of truth: this file + linked `docs/agent/**` documents.
- Continuation protocol: after this file, read exactly `docs/agent/HANDOFF.md` to resume the active thread.
- Implement changes in `src/**`, `app/**`, `migrations/**`, or `docs/**`.
- Keep PRs small and pass: `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.
- Keep PRs small and pass guardrails: `pnpm check:structure`, `pnpm check:routes`, `pnpm check:features`, `pnpm check:feature-scaffold`, `pnpm check:thresholds`, `pnpm check:boundaries`, `pnpm check:workspace-storage`, `pnpm check:raw-buttons`.
- Build for Next.js App Router, RSC-first, mobile-first, shadcn/ui, dark/light/system.
- Enforce security defaults: RLS on all tables, server-side authz, webhook signature verification, Stripe idempotency via `event_id`, HTML sanitization.
- Store timestamps in UTC (`TIMESTAMPTZ`) and render locale-aware date/time/currency.
- Append each ad-hoc/Codex session summary to `docs/RUNLOG.md`.

## Default Codex Mode (UI/Feature/Product)

- Treat UI, feature, and product-development requests as implementation tasks by default (not brainstorming-only) unless the user explicitly asks for planning only.
- For new feature work, start from `pnpm scaffold:feature <kebab-name>` and implement inside `src/features/**`; keep `src/app/**` route files composition-only.
- For UI changes, use existing shadcn/ui primitives and shared patterns; avoid one-off controls where system primitives already exist.
- Ship only when `pnpm check:quality` passes (includes structure, boundaries, visual regression, tests, build, perf).
- If visuals intentionally changed, update visual baselines with `pnpm test:visual:update` and include the rationale in `docs/RUNLOG.md`.

## Quick Commands

- Install: `pnpm install`
- Setup local git hooks (once per clone): `pnpm setup:hooks`
- Dev: `pnpm dev`
- Build/start: `pnpm build && pnpm start`

## Detailed Contracts

- Product scope, routes, UX flows, acceptance, backlog: `docs/agent/product-scope.md`
- Architecture, data model, RLS, security, observability, integrations: `docs/agent/architecture-security.md`
- Workflow, QA, CI/CD, git/PR, file layout, tooling: `docs/agent/workflow-quality.md`
- Code structure, naming, ownership, decomposition limits: `docs/agent/code-structure.md`
- UI quality rubric (MUST/SHOULD/NEVER): `docs/agent/ui-rubric.md`
- Prompt templates for deterministic execution: `docs/agent/codex-execution-playbook.md`
- External engineering references for guardrails: `docs/agent/engineering-sources.md`
- Workspace presentation operations checklist: `docs/agent/workspace-presentation-runbook.md`

## Existing Supporting Docs

- Overview: `docs/OVERVIEW.md`
- Schema: `docs/DB_SCHEMA.md`
- Next.js runbook: `docs/NEXTJS_RUNBOOK.md`
- Codex runbook: `docs/CODEX_RUNBOOK.md`
