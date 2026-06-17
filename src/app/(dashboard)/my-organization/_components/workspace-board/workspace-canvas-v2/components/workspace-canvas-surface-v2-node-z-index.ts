"use client"

import type { WorkspaceCardId } from "../../workspace-board-types"

export function resolveWorkspaceCanvasV2CardNodeZIndex({
  cardId,
  tutorialDraggable,
}: {
  cardId: WorkspaceCardId
  tutorialDraggable: boolean
}) {
  if (tutorialDraggable) return 30
  if (cardId === "fiscal-sponsorship") return 10
  return 0
}
