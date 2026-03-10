# Workspace Canvas V3 Plan (Stability + Snap System)

Date: 2026-03-05
Owner: Workspace canvas
Scope: `/workspace` React Flow architecture, accelerator card integration, card standards, layout/focus/connections

## 1) What We Learned

1. The biggest failure mode was feedback loops between local card state and board state.
2. React Flow is extremely sensitive to identity churn (`nodeTypes`, `edgeTypes`, node data objects, effects keyed on unstable arrays).
3. Incremental reintroduction worked; broad rewrites did not.
4. Locking rules must be scoped (assignment/step node), not global card visibility logic.
5. We need explicit runtime guardrails and tests for each loop boundary.

## 2) Never-Break Rules

1. `nodeTypes` and `edgeTypes` must be module-level constants, never created in render paths.
2. Any effect that sets state must be idempotent and signature-guarded.
3. Card controller state sync must use semantic signatures, not raw object/array references.
4. Canvas node reconciliation must use semantic compare by card contract, not reference equality.
5. Step-node logic may only mutate accelerator-local state; no global visibility side effects.
6. Every major canvas action logs through `[workspace-canvas]` and fails loudly in console.

## 3) Required Tests/Checks Before Merge

1. `workspace-board-layout.test.ts`
2. `workspace-board-visibility-reducer.test.ts`
3. `workspace-accelerator-card.test.ts`
4. `workspace-board-accelerator-step-node-visibility.test.ts`
5. `pnpm exec tsc -p tsconfig.json --noEmit`
6. `pnpm eslint` on touched workspace/accelerator files

## 4) Debug Runbook (If Freeze Returns)

1. Check console for React Flow `#002`; if present, find non-stable `nodeTypes/edgeTypes` immediately.
2. Check `[workspace-canvas] canvas_render_cycle` cadence; if it spikes while idle, inspect state sync effects.
3. Temporarily disable accelerator card body render; if freeze stops, inspect accelerator controller sync signatures.
4. Validate no effect writes state on every render (`setState` + unstable dependency).
5. Confirm browser extensions are not injecting heavy scripts into dev session (test clean profile/incognito).

## 5) Cleanup Candidates (Old Code)

These appear to be legacy/unused in current v2 path and should be removed only in a dedicated cleanup PR with boundary + acceptance checks:

1. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-accelerator-graph.ts`
2. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-fit-view.ts`
3. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-repair.ts`
4. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-context-menu.ts`
5. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-cursors.tsx`
6. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-fullscreen.tsx`
7. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-loading-preview.tsx`

Note: `workspace-board-flow-surface-accelerator-graph-composition.ts` is still used by v2 and must stay.

## 6) Are We Ready For Autofocus + Autolayout?

Short answer: **partially**.

Ready:
1. Node drag persistence pipeline exists and is stable.
2. Auto-layout primitive exists (`applyAutoLayout`).
3. Accelerator focus request keys are already produced in board state layer.

Not ready (must wire first):
1. `layoutFitRequestKey` and `acceleratorFocusRequestKey` are currently passed to `WorkspaceBoardFlowSurface` but not consumed by `WorkspaceCanvasSurfaceV2`.
2. No single canonical "camera controller" in v2 (fit/focus commands need one owner).

## 7) V3 Card System Standards (Lightweight + Snap-Together)

### 7.1 Card frame contract

1. Standard width tiers: `sm`, `md`, `lg` with fixed token map.
2. Standard body height tokens per mode (`compact`, `default`, `expanded`), avoid arbitrary per-card heights.
3. Header/footer controls must use shared slot structure (no custom one-offs).
4. Every card exposes typed `ports` (left/right anchors) for connection semantics.

### 7.2 Connection contract

1. Each card declares `inputs[]` and `outputs[]` (semantic types, e.g. `organization`, `plan`, `artifact`).
2. Edge creation validates compatibility (`output.type -> input.type`).
3. Incompatible connection attempts show UI feedback; no silent failure.
4. Connection state is board-level, render state is flow-level.

### 7.3 Performance contract

1. Node data objects must be stable unless semantic payload changes.
2. Heavy card bodies use lazy rendering gates and avoid global state writes on hover/click.
3. Use transitions for non-urgent board sync updates.

## 8) Layout Model (Requested Horizontal Root/Timeline)

Target: left-to-right root flow with onboarding-first entry.

1. First landing state shows only onboarding root card.
2. Completing onboarding reveals/activates next cards in sequence.
3. Primary axis: horizontal (LTR). Secondary branches attach above/below lane.
4. Snap grid: 24px base; card x/y snaps on drag stop.
5. Auto-layout mode: deterministic lane placement by card type + dependency order.

## 9) Execution Plan (Phased)

### Phase 0: Stabilization Baseline (1 day)
1. Add dev-only render counters for `WorkspaceCanvasSurfaceV2` and accelerator card panel.
2. Add profiler marks for next/prev actions.
3. Remove or archive legacy unused flow-surface modules in dedicated cleanup PR.

### Phase 1: Camera Controller (Autofocus/Fit) (1 day)
1. Create `workspace-canvas-camera-controller.ts` under `workspace-canvas-v2/runtime/`.
2. Consume `layoutFitRequestKey` and `acceleratorFocusRequestKey` in v2 surface.
3. Add deterministic `focusCard(cardId)` and `fitVisibleNodes()` commands.
4. Acceptance tests for focus + fit command behavior.

### Phase 2: Card Contract + Sizing Tokens (1-2 days)
1. Add `workspace-card-contract.ts` with card dimension/mode/port definitions.
2. Refactor all current cards to contract-driven dimensions.
3. Normalize card heights and reduce rigid one-off sizing.

### Phase 3: Connection System Redo (2 days)
1. Add typed ports and edge compatibility validator.
2. Add edge rendering style system (active/inactive/invalid).
3. Add connection gestures + keyboard-friendly creation/deletion.
4. Add acceptance tests for connection validity and persistence.

### Phase 4: Onboarding-First Horizontal Root (2 days)
1. New initial board preset: onboarding root only.
2. Progressive reveal/unlock pipeline after onboarding milestones.
3. Deterministic horizontal lane autolayout with branch slots.

### Phase 5: Polish + QA Hardening (1 day)
1. Performance pass for drag/focus/connect interactions.
2. Console/runbook enforcement for all fail states.
3. Visual polish pass for snap feel and continuity animations.

## 10) File Layout For New Work

1. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/contracts/workspace-card-contract.ts`
2. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-camera-controller.ts`
3. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-connections.ts`
4. `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-node-ports.tsx`
5. `tests/acceptance/workspace-board-camera-controller.test.ts`
6. `tests/acceptance/workspace-board-connections-contract.test.ts`

## 11) Immediate Next Implementation Slice

1. Implement Phase 1 (camera controller) first.
2. Then implement Phase 2 contract tokens for onboarding + accelerator cards only.
3. Then begin Phase 3 typed connections on those two cards before rolling out to all cards.

