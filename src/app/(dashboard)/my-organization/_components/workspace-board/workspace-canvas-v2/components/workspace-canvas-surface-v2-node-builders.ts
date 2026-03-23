import type { MutableRefObject } from "react"

import type { WorkspaceBoardState, WorkspaceCardId } from "../../workspace-board-types"

import {
  buildWorkspaceCanvasV2CardDataLookup,
  buildWorkspaceCanvasV2CardNode,
  type WorkspaceCanvasNode,
  type WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"

export function buildInitialWorkspaceCanvasNodes({
  visibleCardIds,
  boardNodeLookup,
  initialPositionLookupRef,
  cardDataLookup,
  allowEditing,
  acceleratorStepNodeData,
  tutorialNodeData,
  tutorialDraggableCardIds = [],
  tutorialCardPositionOverrides = null,
}: {
  visibleCardIds: WorkspaceCanvasV2CardId[]
  boardNodeLookup: Map<WorkspaceCardId, WorkspaceBoardState["nodes"][number]>
  initialPositionLookupRef: MutableRefObject<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  >
  cardDataLookup: ReturnType<typeof buildWorkspaceCanvasV2CardDataLookup>
  allowEditing: boolean
  acceleratorStepNodeData: WorkspaceCanvasNode | null
  tutorialNodeData: WorkspaceCanvasNode | null
  tutorialDraggableCardIds?: WorkspaceCanvasV2CardId[]
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
}) {
  const next: WorkspaceCanvasNode[] = []
  for (const cardId of visibleCardIds) {
    const boardNode = boardNodeLookup.get(cardId)
    const fallback = initialPositionLookupRef.current[cardId]
    const position =
      tutorialCardPositionOverrides?.[cardId] ??
      (boardNode ? { x: boardNode.x, y: boardNode.y } : fallback)
    next.push(
      buildWorkspaceCanvasV2CardNode({
        cardId,
        position,
        data: cardDataLookup[cardId],
        allowEditing,
        tutorialDraggable: tutorialDraggableCardIds.includes(cardId),
      }),
    )
  }
  if (acceleratorStepNodeData) next.push(acceleratorStepNodeData)
  if (tutorialNodeData) next.push(tutorialNodeData)
  return next
}
