# Batch 2 Release Candidate

Date: 2026-08-06
Base: `origin/main` at `9843650`
Branch: `agent/batch2-organization-workspace-foundation-20260806`
Status: Preview PR #119 open; connected disposable preview proof passed

## Scope

- Organization profile, Brand Kit, MVV, primary-object, and deep-link work.
- Workspace ontology, canvas persistence, drawer, roadmap/calendar, search,
  Accelerator, and inactive future Finance identity.
- People segments, tags, links, table behavior, and optimistic persistence.
- Production-owned behavior and tests only.

## Release proof

- [x] Dependency-complete scoped diff
- [x] Focused Organization, Workspace, and People tests
- [x] Required Batch 2 guardrails
- [x] Full `pnpm check:quality`
- [x] Isolated desktop/mobile, light/dark, and reduced-motion visual QA
- [x] Reachable non-squashed compatibility checkpoint (`7609daa`)
- [x] Connected Supabase RLS execution
- [x] Authenticated preview QA for fullscreen, overflow, and persistence
- [ ] Preview verification
- [x] Rollback verification

## Local evidence

- `pnpm check:quality` passes: lint, all required guardrails, snapshots,
  `1,695/1,695` executed acceptance tests across `337/337` files, production
  build, `26/26` visual tests, and performance budgets.
- The compatibility checkpoint's layout and persistence proof passes `52/52`.
- A fresh fetch confirms `origin/main` remains at the candidate base,
  `9843650`; no rebase is required before local checkpoint creation.
- The passive Accelerator synchronization path no longer publishes progress on
  mount, prop synchronization, local-storage hydration, or step normalization.
  Explicit navigation/completion remains persistent; its focused proof passes
  `39/39`.
- The disposable, no-data Supabase preview has the complete migration history
  through `20260805145856`; the connected suite ends with the literal result
  `RLS tests passed.`
- Disposable authenticated browser QA passes desktop/mobile, dark/light,
  fullscreen geometry, `20px` corners, zero document overflow, explicit canvas
  persistence, and a passive reload with an unchanged board timestamp. The QA
  user was deleted.
- Authenticated preview QA exposed and closed one missing image-host dependency:
  preview builds now accept both their configured Supabase host and the existing
  production Storage host used by workspace avatars.
- After that two-file fix, lint, formatting, `1,696/1,696` executed acceptance
  tests, the production build, isolated `26/26` visual tests, and performance
  budgets pass. The default visual command was also observed reusing the user's
  unrelated dirty-tree server on port `3000`; candidate-only proof used port
  `3020` without stopping that server.

- Connected RLS ran only against disposable preview project
  `cilvvwguqkakrpseebii`; production data was not cloned.
- Authenticated gate-on QA rendered the People drawer, then was stopped after
  the existing workspace persistence path automatically advanced the remote
  board row timestamp. Future authenticated QA requires a non-persisting test
  environment; no blind data rollback was attempted.
- Read-only audit found no recoverable prior board revision. Only the board
  timestamps are confirmed changed; a semantic change cannot be proven or
  excluded. The organization row did not change.
- No new migration is included; the required People taxonomy migrations already
  exist on `origin/main`.
- Supabase's integration badge still reports its original automated replay
  failure even though the disposable branch was repaired from the immutable
  migration source, now lists every migration, and passes the connected RLS
  suite. The badge must not be represented as green.

## Private rollout gate

- Default off: `WORKSPACE_FOUNDATION_ROLLOUT_ENABLED` must equal `1`.
- Selective access additionally requires a matching UUID in
  `WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS` or
  `WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS`.
- Global access requires `*` in either allowlist variable.
- Compatibility reads/writes remain unconditional. Finance remains inactive.

## Rollback plan

Commit `7609daa` is the reachable, non-squashed `C_compat` checkpoint. It
contains only the unconditional workspace board compatibility reader/writer and
its focused tests:

- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-forward-compatibility.ts`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-hidden-card-normalization.ts`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout.ts`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-state-types.ts`
- `src/app/(dashboard)/my-organization/_lib/workspace-board-state-persistence.ts`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-state.ts`
- `tests/acceptance/workspace-board-layout.test.ts`
- `tests/acceptance/workspace-board-state-persistence.test.ts`

Never roll back below `C_compat`.

Disable `WORKSPACE_FOUNDATION_ROLLOUT_ENABLED` first. If code rollback is still
required, revert only later surface commits and redeploy `C_compat`; retain the
existing People taxonomy migrations and organization-scoped rows. No database
reversal is required.

No release action is approved by this document.
