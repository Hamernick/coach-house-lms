# Workspace Accelerator Card Design Brief

Date: 2026-03-01  
Status: In implementation  
Owner: Workspace + Accelerator

## Goal

Build a dedicated **Accelerator card** for the workspace canvas that lets a user move through the full accelerator sequence without leaving the board.

Core UX:
1. Top-right chevron navigation (`previous` / `next`).
2. One current lesson/module shown at a time.
3. Compact but complete lesson payload: title, sequence position, status, mini video, resources, assignment signal, and open-module CTA.
4. Card automatically adapts between `sm` and `md` based on current lesson payload density.

## Scope (This Pass)

- Replace the current `formation-status` card rendering with the new accelerator card UI (keep card id stable for persisted workspace state).
- Add normalized accelerator timeline data to `WorkspaceSeedData` (client-ready and render-safe).
- Wire card navigation state and adaptive sizing in a feature-local hook.
- Keep existing objectives data model untouched in this pass.

Out of scope in this pass:
- In-card editing of assignments/forms/notes.
- Embedded full module stepper parity with full accelerator page.
- New DB tables.

## Data Contract

Introduce feature type `WorkspaceAcceleratorCardStep`:
- `id`
- `moduleId`
- `title`
- `description`
- `href`
- `status` (`not_started | in_progress | completed`)
- `sequenceIndex`, `sequenceTotal`
- `groupTitle` (class/group)
- `videoUrl`
- `durationMinutes`
- `resources[]` (`id`, `title`, `url`, `kind`)
- `hasAssignment`
- `hasDeck`

Seed field:
- `WorkspaceSeedData.acceleratorTimeline?: WorkspaceAcceleratorCardStep[]`

Server shaping rules:
- Source base sequence from `fetchAcceleratorProgressSummary` modules (already progress-aware).
- Enrich with `module_content` (`video_url`, `resources`), `module_assignments`, and `modules` (`duration_minutes`, `deck_path`, fallback `video_url`).
- Keep parsing defensive (invalid/missing arrays become empty).

## UI/UX Behavior

Card layout:
- Header copy uses existing workspace card frame title.
- Internal top row: sequence chip + top-right chevron nav buttons.
- Body: lesson title/description, mini video (if available), resource list (first 3 + overflow count), assignment/deck metadata chips.
- Footer: status + `Open lesson` link.

Adaptive sizing:
- Rule-based target size per current step:
  - `md` if step has video OR resources count > 2 OR description length > threshold.
  - else `sm`.
- Apply via existing `onSizeChange(cardId, size)` callback only when size changes.

Accessibility:
- Chevron buttons are `button` with explicit labels and keyboard support.
- Video has controls + fallback text.
- Resource links are semantic anchors.

## File Plan

Feature module:
- `src/features/workspace-accelerator-card/types.ts`
- `src/features/workspace-accelerator-card/lib/index.ts`
- `src/features/workspace-accelerator-card/hooks/use-workspace-accelerator-card-controller.ts`
- `src/features/workspace-accelerator-card/components/workspace-accelerator-card-panel.tsx`
- `src/features/workspace-accelerator-card/components/index.ts`
- `src/features/workspace-accelerator-card/index.ts`

Workspace integration:
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types.ts`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-node.tsx`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-copy.ts`
- `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-docks.tsx`
- `src/app/(dashboard)/my-organization/_lib/my-organization-page-content.tsx`
- `src/app/(dashboard)/my-organization/_lib/workspace-view.ts`

## Acceptance Criteria

1. `formation-status` slot renders Accelerator card UI with chevron navigation.
2. Card displays current lesson sequence index (`x / n`) and status.
3. Mini video renders when source exists.
4. Resource list renders with working links.
5. Card auto-resizes between `sm`/`md` as lesson changes.
6. No regression in workspace board state persistence and node alignment.

## Validation Plan

- `pnpm exec eslint` on touched feature + workspace files.
- `pnpm build`.
- Add/adjust acceptance test for timeline shaping and controller behavior.

