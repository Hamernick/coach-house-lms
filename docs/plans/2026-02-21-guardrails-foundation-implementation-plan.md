# 2026-02-21 — Guardrails Foundation Plan (Implemented)

## Objective

Prevent repeat large refactors by enforcing architecture, UI consistency, and feature structure through executable checks and scaffolding.

## Scope

- Import boundary enforcement
- Visual regression enforcement for core public shell routes
- Deterministic feature scaffolding workflow
- CI integration + local quality parity
- Agent documentation updates with external references

## Workstreams

- [x] Add import boundary gate (`pnpm check:boundaries`) and enforce in `check:quality` + CI.
- [x] Add Playwright visual regression gate (`pnpm test:visual`) with committed baselines.
- [x] Add feature scaffolding command (`pnpm scaffold:feature <name>`).
- [x] Add feature-slice contract gate (`pnpm check:features`) and enforce in `check:quality` + pre-push.
- [x] Add scaffold/contract sync gate (`pnpm check:feature-scaffold`) so generated feature output remains aligned with enforced feature contract.
- [x] Add route entrypoint contract gate (`pnpm check:routes`) and enforce in `check:quality` + pre-push.
- [x] Remove temporary route-size exceptions and lock route allowlist max to `0` to prevent silent reintroduction.
- [x] Update agent contracts and playbooks to make the workflow default.
- [x] Document source references and rationale in `docs/agent/engineering-sources.md`.

## Deliverables

- `scripts/check-import-boundaries.mjs`
- `playwright.visual.config.ts`
- `tests/visual/public-shell.visual.spec.ts`
- `tests/visual/public-shell.visual.spec.ts-snapshots/*`
- `scripts/new-feature.mjs`
- `scripts/check-feature-contract.mjs`
- `scripts/check-feature-scaffold-sync.mjs`
- `scripts/check-route-entry-contract.mjs`
- `docs/agent/engineering-sources.md`
- Updated: `package.json`, `.github/workflows/ci.yml`, `docs/agent/*`, `AGENTS.md`

## Source-backed rationale

- Next.js App Router and server/client guidance:
  - https://nextjs.org/docs/app
  - https://nextjs.org/docs/app/getting-started/server-and-client-components
- Import restriction and module boundary enforcement:
  - https://eslint.org/docs/latest/rules/no-restricted-imports
  - https://nx.dev/features/enforce-module-boundaries
- Visual regression testing mechanics:
  - https://playwright.dev/docs/test-snapshots
- CI required status checks:
  - https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks
  - https://docs.github.com/enterprise/admin/guides/developer-workflow/about-protected-branches-and-required-status-checks
- Generator/scaffolding rationale:
  - https://nx.dev/features/generate-code

## Operational next steps

1. [x] Enable branch protection rules so `quality` must pass before merge.
2. [x] Add CODEOWNERS for `src/components/ui/**`, `docs/agent/**`, and CI config.
3. [x] Ratchet process guard added: thresholds are now non-increasing by default via `pnpm check:thresholds` + baseline lockfile.
