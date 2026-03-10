# Handoff — Current Execution State

Read order for any new agent on this repo:
1. `AGENTS.md`
2. `docs/agent/HANDOFF.md` (this file)

## Scope in Progress

Primary thread: organization workspace canvas + accelerator entry flow + React Flow stability.

## What Was Just Shipped

1. Accelerator card cannot be hidden anymore.
   - `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas.tsx`
   - `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout.ts`
   - `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-docks.tsx`
2. Accelerator step-node links now use the paywall-safe override path.
   - `src/features/workspace-accelerator-card/components/workspace-accelerator-card-panel.tsx`
   - `src/features/workspace-accelerator-card/components/workspace-accelerator-step-node-card.tsx`
3. React Flow `nodeTypes` references stabilized in workspace + org chart.
   - `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface.tsx`
   - `src/components/people/org-chart-canvas.tsx`

## Current Reported Issue (Not Yet Closed)

User still reports:
- Clicking "Accelerator" can make content disappear/hide and UI feel frozen/slow.
- Dev warning appears: React Flow `#002` (`nodeTypes/edgeTypes` identity changed).

Status:
- Warning source was mitigated in code above, but user still sees behavior in their runtime.
- Needs live repro with the same account/session and exact click target.

## First Steps for Next Agent

1. Reproduce with user flow in this order:
   - `/workspace` -> dock "Accelerator"
   - `/workspace` -> sidebar "Accelerator"
   - accelerator card CTA/open-step actions
2. For each click, capture:
   - resulting URL
   - whether any card is hidden
   - console errors/warnings
3. If freeze persists, profile the transition to `/accelerator` and isolate whether it is:
   - route/data loading cost
   - canvas re-render churn
   - extension/devtool interference

## Validation Commands

- `pnpm eslint 'src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout.ts' 'src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas.tsx' 'src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-docks.tsx' 'src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface.tsx' 'src/components/people/org-chart-canvas.tsx'`
- `pnpm test:acceptance tests/acceptance/workspace-board-layout.test.ts tests/acceptance/workspace-accelerator-card.test.ts`

## Secondary Backlog (After Blocker)

1. Documents card mode UX polish (dropzone/search/viewer/fullscreen controls).
2. Ensure viewer handles one file open/close flow cleanly.
3. Continue cleanup of workspace card spacing and responsive behavior.
