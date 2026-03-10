# Workspace Production Preflight — 2026-03-10

## Summary

This preflight hardens the current release candidate for a production push from `main`. It focuses on three areas:

- moving `Coach scheduling` into the shared app sidebar above `Resources`
- clearing the workspace canvas structure-budget blocker
- running the major local release gates and operational checks

## User-facing changes

- `Coach scheduling` now lives in the shared internal sidebar above `Resources`
- the duplicate coaching card was removed from the accelerator overview right rail
- workspace canvas internals were refactored to clear the structure budget without changing behavior
- README and PR template now reflect the current workflow, routes, and release expectations

## Validation

- `pnpm exec eslint 'src/components/coaching/coach-scheduling-card.tsx' 'src/components/app-sidebar.tsx' 'src/components/accelerator/accelerator-overview-right-rail.tsx' 'src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas.tsx' 'src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-state.ts'` ✅
- `pnpm lint` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm check:structure` ✅
- `pnpm check:routes` ✅
- `pnpm check:features` ✅
- `pnpm check:feature-scaffold` ✅
- `pnpm check:thresholds` ✅
- `pnpm check:boundaries` ✅
- `pnpm check:workspace-storage` ✅
- `pnpm check:interaction-locks` ✅
- `pnpm check:raw-buttons` ✅
- `pnpm test:snapshots` ✅
- `pnpm test:acceptance tests/acceptance/workspace-board-layout.test.ts tests/acceptance/workspace-board-onboarding-flow.test.ts tests/acceptance/workspace-canvas-tutorial.test.ts tests/acceptance/workspace-canvas-surface-v2-tutorial.test.ts` ✅
- `pnpm test:rls` ✅
- `pnpm build` ✅
- `pnpm test:visual` ✅
- `pnpm check:perf` ✅
- `pnpm seed:validate` ✅
- `pnpm verify:stripe` ✅
- `node --env-file=.env.local scripts/verify-account-settings.mjs c.hamernick@gmail.com` ✅
- `pnpm audit --prod` ✅

## Release notes draft

- Moved `Coach scheduling` into the shared workspace sidebar above `Resources`
- Removed the duplicate accelerator right-rail coaching card
- Cleared the workspace canvas structure-budget violation by extracting internal canvas hooks
- Updated release docs and PR template to match the current quality gate and route structure
- Refreshed dependency overrides for `dompurify`, `markdown-it`, and `qs` to close known production advisories

## Known caveat

- I did not capture one single uninterrupted `pnpm check:quality` run with a final green exit code. The aggregate script repeatedly stopped during the `pnpm lint` handoff when wrapped inside another shell process, even though `pnpm lint` itself passed in isolation and every downstream quality subcommand above also passed.
