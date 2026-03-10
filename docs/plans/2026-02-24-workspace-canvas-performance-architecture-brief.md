# Workspace Canvas Performance Architecture Brief (2026-02-24)

## Problem

The organization workspace canvas is not meeting interaction quality expectations:

- Card drag feels delayed / sticky / sluggish.
- Zoom and pan feel heavy.
- Canvas nodes mount full editor-grade UI (forms, tabs, sheets, switches, rich controls), which is expensive to transform during React Flow viewport updates.
- Visual treatment in dark mode is too heavy/dark, reducing grid legibility and making the canvas feel muddy.

This brief defines the architecture and UI contract for a performant workspace canvas and a clear separation between:

- `Canvas preview` (fast, lightweight, transform-friendly)
- `Fullscreen editor` (heavy controls, forms, actions)

## Primary Objectives

1. Make drag, pan, and zoom feel responsive on the workspace canvas.
2. Keep canvas nodes visually informative without mounting heavy editor controls.
3. Move heavy interactive editors to fullscreen card mode only.
4. Preserve current product behavior and routing (edit workspace vs shared workspace).
5. Improve dark-mode canvas surface legibility (lighter base surface, visible dot grid).

## Root Cause Summary

The main issue is not one React Flow prop. It is the combined cost of:

- Frequent state updates during drag/zoom/pan.
- Complex node internals (forms, tabs, switches, sheets, dense controls) being transformed continuously.
- Paint-heavy styles on moving/transformed surfaces (shadows, blur, gradients).
- Extra mousemove work (realtime cursor publishing) competing during interaction.

## Docs-Backed Constraints (React Flow)

React Flow’s performance guidance explicitly emphasizes:

- memoizing components passed to `<ReactFlow />`
- memoizing functions/objects passed as props
- avoiding broad dependencies on frequently changing node state
- simplifying node and edge styles when nodes are complex

React Flow API reference also notes:

- `onlyRenderVisibleElements` can help for large graphs but adds overhead
- `nodeDragThreshold` affects how quickly drag starts

Applied sources:

- React Flow Performance guide: https://reactflow.dev/learn/advanced-use/performance
- ReactFlow API reference: https://reactflow.dev/api-reference/react-flow

## Target Architecture

### 1) Canvas Preview vs Fullscreen Editor

Each workspace card will support two render modes:

- `Canvas preview mode` (`!presentationMode && !isCanvasFullscreen`)
  - lightweight summary only
  - no heavy forms/tabs/sheets/interactive editor controls
  - minimal DOM, fewer shadows, fewer animated surfaces
- `Fullscreen editor mode` (`isCanvasFullscreen`)
  - full editing UI (forms, tabs, switches, event sheets, actions)
  - richer controls are acceptable because only one card is mounted in this mode

### 2) Flow Surface Isolation

Keep live React Flow interaction state local to a memoized flow surface component:

- local `useNodesState(...)` for drag frame updates
- local fullscreen overlay state
- parent owns durable `boardState` and right-rail state

This prevents drag frames from re-rendering unrelated shell/right-rail composition.

### 3) Interaction-Time Load Shedding

During drag/pan/zoom:

- suspend local realtime cursor publishing (keep subscriptions mounted, pause local mousemove broadcasts)
- reduce paint complexity on moving nodes
- avoid unnecessary animated layout transitions

## UI/UX Contract

### Canvas Nodes (Edit Workspace)

Canvas nodes should feel like “board summaries,” not mini-apps.

MUST:

- show status and key signals for each card
- fit cleanly within node dimensions without clipping
- avoid nested scroll regions on canvas nodes
- keep drag handle discoverable

NEVER:

- mount event sheets, multi-field forms, tabs, or dense switch matrices in compact canvas nodes
- rely on animation-heavy layout transitions in nodes during viewport transforms

### Fullscreen Card View

Fullscreen is the primary editing surface for heavy card interactions.

MUST:

- render edge-to-edge within workspace canvas overlay
- carry full editor controls/actions
- close in place without route navigation

## Implementation Plan (Phased)

### Phase A — Interaction Baseline Hardening (Done / In Progress)

- React Flow prop memoization
- flow surface isolation
- drag-state local node updates
- cursor publish suspension during drag/pan/zoom
- style simplification (shadows/blur reductions)
- dark-mode canvas gradient removal

### Phase B — Canvas Node Lightweight Preview Architecture (Current)

- Calendar card: compact preview summary on canvas
- Communications card: compact preview summary on canvas
- Heavy controls render only in fullscreen mode

### Phase C — Fullscreen Editor Ownership

- Ensure all heavy controls remain available in fullscreen mode
- Optional: move some actions to right rail if card density still feels high
- Optional: lazy-load heavy editor modules/sheets when fullscreen opens

### Phase D — Verification

- Profile drag and zoom in dev + prod
- Validate no clipped content in compact previews
- Validate keyboard/close behavior for fullscreen overlay

## Acceptance Criteria

### Performance

- Drag starts immediately when using the card header handle.
- Drag feels smooth (no obvious delayed/frozen movement).
- Zoom/pan feel responsive without visible stutter from node content churn.
- Interaction quality improves further in production (`pnpm build && pnpm start`) vs dev mode.

### UX

- Canvas nodes are concise summaries, not dense editors.
- Fullscreen card view provides the full editing experience.
- Dark mode canvas is lighter than the current near-black surface and the dot grid remains visible.

### Stability

- No regression to workspace drag functionality.
- No regression to fullscreen overlay close behavior (`Esc`, close button).
- Shared workspace mode remains view-only.

## Measurement / Debug Checklist

When validating a perf pass:

1. Test in dev (`pnpm dev`) after restart + hard refresh.
2. Test in production (`pnpm build && pnpm start`).
3. Test:
   - drag header on `Calendar`
   - drag header on `Communications`
   - zoom in/out rapidly
   - pan across canvas
4. If still sluggish, capture a DevTools Performance trace and classify:
   - React scripting
   - layout/reflow
   - paint/compositing
   - network/event listener churn

## Notes for This Repo

- Workspace scope only: `src/app/(dashboard)/my-organization/_components/workspace-board/**`
- Do not modify global left app sidebar for this work.
- Keep runlog entries separated by pass.
