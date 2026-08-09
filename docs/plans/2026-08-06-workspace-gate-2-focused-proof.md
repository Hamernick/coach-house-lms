# Workspace Gate 2 Focused Proof

Date: 2026-08-06
Status: Gate 2 proven locally
Scope: canonical Organization, People, workspace canvas, drawer, persistence,
future Finance identity, and optimistic rollback contracts
Non-goals: production writes, full dirty-tree quality approval, Finance UI,
`/find` UI, commit, push, merge, or deployment

## Result

The exact focused suite passed `195/195` tests across `35/35` files on the
current worktree. This verifies Gate 2 evidence item 2:

> Focused Organization, People, canvas, drawer, and optimistic rollback tests

The separate browser matrix is verified in
[`2026-08-06-workspace-gate-2-browser-proof.md`](./2026-08-06-workspace-gate-2-browser-proof.md).
Gate 2 is proven. Its focused test set, authenticated browser matrix, and full
required guardrail set pass on the current worktree.

## Guardrail Closure

All required Gate 2 checks pass:

- `pnpm check:workspace-storage`
- `pnpm check:interaction-locks`
- `pnpm check:react-grab`
- `pnpm check:workspace-surfaces`
- `pnpm check:raw-buttons`
- `pnpm check:routes`
- `pnpm check:features`
- `pnpm check:feature-scaffold`
- `pnpm check:structure`
- `pnpm check:boundaries`
- `pnpm check:thresholds`

The structure, route, and feature failures were resolved through composition
and responsibility splits. No threshold, allowlist, route limit, or feature
contract was weakened. The exact `195/195` focused suite passed again after
those splits.

## Coverage

| Boundary           | Verified behavior                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organization       | Shared profile/MVV/Brand Kit validation, unknown-key preservation, guarded primary-object persistence, canonical editor routes, and program overview contracts                                                  |
| People             | Authorization, social-link validation, typed taxonomy persistence, scoped table preferences, revision-checked writes, serialized same-record mutations, failed-write recovery, and latest-intent reconciliation |
| Canvas             | Forward-compatible unknown layout records, concurrent save reconciliation, node/state ownership, visibility, layout, viewport, and action contracts                                                             |
| Drawer             | Canonical route round trips, snap state, tab ownership, portal boundary, right rail, and stored preference contracts                                                                                            |
| Finance boundary   | Future `finance` identity remains reserved but inactive; opaque layout state survives; `economic-engine` metadata remains unchanged                                                                             |
| Prototype boundary | Prototype Lab remains restricted to its authenticated admin route and owned navigation                                                                                                                          |

## Exact Test Set

### Organization and primary objects

- `tests/acceptance/my-organization-editor-view.test.ts`
- `tests/acceptance/my-organization-workspace-seed-helpers.test.ts`
- `tests/acceptance/organization-primary-objects.test.ts`
- `tests/acceptance/organization-profile-persistence-validation.test.ts`
- `tests/acceptance/organization-workspace-deep-links.test.ts`
- `tests/acceptance/program-primary-object-persistence.test.ts`
- `tests/acceptance/workspace-brand-kit.test.ts`
- `tests/acceptance/workspace-organization-overview-programs.test.ts`

### People and optimistic persistence

- `tests/acceptance/people-actions-access.test.ts`
- `tests/acceptance/people-profile-write-concurrency.test.ts`
- `tests/acceptance/people-table-columns.test.ts`
- `tests/acceptance/people-table-controls.test.ts`
- `tests/acceptance/people-tags.test.ts`
- `tests/acceptance/person-social-links.test.ts`
- `tests/acceptance/workspace-people-optimistic-mutations.test.ts`
- `tests/acceptance/workspace-people-table-preferences.test.ts`
- `tests/acceptance/workspace-people-taxonomy-persistence.test.ts`

### Canvas, persistence, and drawer

- `tests/acceptance/workspace-board-canvas-body.test.ts`
- `tests/acceptance/app-shell-header-layout.test.ts`
- `tests/acceptance/workspace-board-canvas-helpers.test.ts`
- `tests/acceptance/workspace-board-canvas-state.test.ts`
- `tests/acceptance/workspace-board-layout.test.ts`
- `tests/acceptance/workspace-board-right-rail.test.ts`
- `tests/acceptance/workspace-board-state-actions.test.ts`
- `tests/acceptance/workspace-board-state-persistence.test.ts`
- `tests/acceptance/workspace-board-ui-preferences.test.ts`
- `tests/acceptance/workspace-canvas-node-change-policy.test.ts`
- `tests/acceptance/workspace-canvas-ontology-selection.test.ts`
- `tests/acceptance/workspace-canvas-overlay-drawer.test.ts`
- `tests/acceptance/workspace-canvas-surface-v2-viewport-controls.test.ts`
- `tests/acceptance/workspace-canvas-viewport-command.test.ts`
- `tests/acceptance/workspace-canvas-visible-cards.test.ts`
- `tests/acceptance/workspace-routes.test.ts`

### Future Finance and prototype isolation

- `tests/acceptance/workspace-finance-identity.test.ts`
- `tests/acceptance/prototype-lab-production-boundary.test.ts`

## Failure and Rollback Cases Covered

- invalid Organization data fails before a write;
- partial profile saves preserve unrelated and future keys;
- stale primary-object saves return conflicts rather than overwrite newer data;
- same-record People writes remain ordered while unrelated records stay
  concurrent;
- the newest failed People intent restores confirmed labels, colors,
  memberships, and deletion state without allowing an older failure to win;
- bounded revision retries preserve concurrent People/profile changes;
- stale whole-board responses do not overwrite newer node positions;
- future layout records survive normalization, concurrent saves, and rollback to
  the compatibility release;
- explicit drawer routes override stored tabs without deleting preferences; and
- inactive future Finance layout data never activates a Finance UI or changes
  `economic-engine`.

## Evidence Boundary

This proof is current-worktree evidence. It proves Gate 2 only; it does not
prove production, a clean release artifact, or the repository-wide release
quality gate.
