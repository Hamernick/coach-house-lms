"use client"

import type { WorkspaceCanvasV2CardId } from "./workspace-canvas-surface-v2-helpers"

export type WorkspaceTutorialDockMask = {
  cardId: WorkspaceCanvasV2CardId
  cardWidth: number
  cardHeight: number
  frameWidth: number
  frameHeight: number
  cardInset: number
  slotTopOffset: number
  snapRadius: number
}

export type WorkspaceTutorialDockTarget = {
  cardId: WorkspaceCanvasV2CardId
  x: number
  y: number
  snapRadius: number
}

export function resolveWorkspaceTutorialDockTarget({
  tutorialNodePosition,
  tutorialShellWidth,
  dockMask,
}: {
  tutorialNodePosition: { x: number; y: number }
  tutorialShellWidth: number
  dockMask: WorkspaceTutorialDockMask
}): WorkspaceTutorialDockTarget {
  return {
    cardId: dockMask.cardId,
    x: Math.round(
      tutorialNodePosition.x +
        Math.max(0, (tutorialShellWidth - dockMask.frameWidth) / 2) +
        dockMask.cardInset,
    ),
    y: Math.round(
      tutorialNodePosition.y + dockMask.slotTopOffset + dockMask.cardInset,
    ),
    snapRadius: dockMask.snapRadius,
  }
}

export function shouldWorkspaceTutorialCardSnapToDock({
  position,
  dockTarget,
}: {
  position: { x: number; y: number }
  dockTarget: Pick<WorkspaceTutorialDockTarget, "x" | "y" | "snapRadius">
}) {
  const distance = Math.hypot(position.x - dockTarget.x, position.y - dockTarget.y)
  return distance <= dockTarget.snapRadius
}
