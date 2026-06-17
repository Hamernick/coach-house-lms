import type { MutableRefObject } from "react"

import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "../../workspace-board-types"

import {
  buildWorkspaceCanvasV2CardDataLookup,
  buildWorkspaceCanvasV2CardNode,
  type WorkspaceCanvasNode,
  type WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import {
  buildWorkspaceCanvasPersonNode,
  type WorkspaceCanvasPersonPlacement,
} from "./workspace-canvas-person-node-model"

export function buildInitialWorkspaceCanvasNodes({
  visibleCardIds,
  boardNodeLookup,
  initialPositionLookupRef,
  cardDataLookup,
  allowEditing,
  allowPeopleCanvasInteraction,
  acceleratorStepNodeData,
  tutorialNodeData,
  workspacePersonPlacements,
  workspacePersonById,
  onRemoveWorkspacePerson,
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
  allowPeopleCanvasInteraction: boolean
  acceleratorStepNodeData: WorkspaceCanvasNode | null
  tutorialNodeData: WorkspaceCanvasNode | null
  workspacePersonPlacements: WorkspaceCanvasPersonPlacement[]
  workspacePersonById: ReadonlyMap<string, OrgPersonWithImage>
  onRemoveWorkspacePerson: (personId: string) => void
  tutorialDraggableCardIds?: WorkspaceCanvasV2CardId[]
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
}) {
  const next: WorkspaceCanvasNode[] = []
  const safeWorkspacePersonPlacements = Array.isArray(workspacePersonPlacements)
    ? workspacePersonPlacements
    : []
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
      })
    )
  }
  for (const placement of safeWorkspacePersonPlacements) {
    const person = workspacePersonById.get(placement.personId)
    if (!person) continue
    next.push(
      buildWorkspaceCanvasPersonNode({
        placement,
        person,
        canEdit: allowPeopleCanvasInteraction,
        onRemove: onRemoveWorkspacePerson,
      })
    )
  }
  if (acceleratorStepNodeData) next.push(acceleratorStepNodeData)
  if (tutorialNodeData) next.push(tutorialNodeData)
  return next
}
