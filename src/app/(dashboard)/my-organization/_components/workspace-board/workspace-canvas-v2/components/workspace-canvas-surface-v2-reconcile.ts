"use client"

import type { Node } from "reactflow"

import type { WorkspaceCanvasTutorialNodeData } from "@/features/workspace-canvas-tutorial"

import { resolveWorkspaceCardNodeStyle } from "../../workspace-board-layout"
import { ACCELERATOR_STEP_NODE_ID } from "../../workspace-board-flow-surface-accelerator-graph-composition"
import type {
  WorkspaceBoardAcceleratorStepNodeData,
  WorkspaceBoardNodeData,
} from "../../workspace-board-node"
import { workspaceBoardCardPropsEqual } from "../../workspace-board-node-card-compare"
import { workspaceNodeClassName } from "../../workspace-board-node-class-name"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "../../workspace-board-types"
import { type WorkspaceCanvasV2CardId } from "../contracts/workspace-card-contract"
import { resolveWorkspaceCanvasV2DefaultPosition } from "./workspace-canvas-surface-v2-positioning"
import { WORKSPACE_CANVAS_TUTORIAL_NODE_ID } from "./workspace-canvas-surface-v2-tutorial-runtime"

type WorkspaceCanvasNodeData =
  | WorkspaceBoardNodeData
  | WorkspaceBoardAcceleratorStepNodeData
  | WorkspaceCanvasTutorialNodeData
type WorkspaceCanvasNode = Node<WorkspaceCanvasNodeData>

function isWorkspaceCardDataSemanticallyEqual(
  left: WorkspaceBoardNodeData,
  right: WorkspaceBoardNodeData,
) {
  return workspaceBoardCardPropsEqual(
    { data: left },
    { data: right },
  )
}

function buildWorkspaceCanvasV2CardNode({
  cardId,
  position,
  data,
  allowEditing,
  tutorialDraggable = false,
}: {
  cardId: WorkspaceCardId
  position: { x: number; y: number }
  data: WorkspaceBoardNodeData
  allowEditing: boolean
  tutorialDraggable?: boolean
}): WorkspaceCanvasNode {
  const zIndex = tutorialDraggable ? 30 : 0
  return {
    id: cardId,
    type: "workspace",
    position,
    zIndex,
    draggable: allowEditing || tutorialDraggable,
    selectable: false,
    dragHandle: ".workspace-card-drag-handle",
    className: workspaceNodeClassName(data.size, cardId),
    style: resolveWorkspaceCardNodeStyle(data.size, cardId),
    data,
  }
}

function reconcileWorkspaceCardNode({
  currentWorkspaceNode,
  cardId,
  boardNode,
  orgNodePositionFromBoard,
  cardData,
  allowEditing,
  tutorialDraggableCardIds,
  tutorialCardPositionOverrides,
}: {
  currentWorkspaceNode?: WorkspaceCanvasNode
  cardId: WorkspaceCanvasV2CardId
  boardNode?: WorkspaceBoardState["nodes"][number]
  orgNodePositionFromBoard: { x: number; y: number }
  cardData: WorkspaceBoardNodeData
  allowEditing: boolean
  tutorialDraggableCardIds: WorkspaceCanvasV2CardId[]
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
}) {
  const fallbackPosition =
    cardId === "organization-overview"
      ? orgNodePositionFromBoard
      : resolveWorkspaceCanvasV2DefaultPosition(cardId)
  const nextPosition =
    (currentWorkspaceNode?.dragging ? currentWorkspaceNode.position : undefined) ??
    tutorialCardPositionOverrides?.[cardId] ??
    (boardNode
      ? { x: boardNode.x, y: boardNode.y }
      : currentWorkspaceNode?.position ?? fallbackPosition)

  if (!currentWorkspaceNode) {
    return buildWorkspaceCanvasV2CardNode({
      cardId,
      position: nextPosition,
      data: cardData,
      allowEditing,
      tutorialDraggable: tutorialDraggableCardIds.includes(cardId),
    })
  }

  const nodeStyle = resolveWorkspaceCardNodeStyle(cardData.size, cardId)
  const samePosition =
    currentWorkspaceNode.position.x === nextPosition.x &&
    currentWorkspaceNode.position.y === nextPosition.y
  const sameWidth = currentWorkspaceNode.style?.width === nodeStyle.width
  const sameHeight =
    currentWorkspaceNode.style?.height === nodeStyle.height &&
    currentWorkspaceNode.style?.minHeight === nodeStyle.minHeight
  const sameData = isWorkspaceCardDataSemanticallyEqual(
    currentWorkspaceNode.data as WorkspaceBoardNodeData,
    cardData,
  )
  const nextDraggable = allowEditing || tutorialDraggableCardIds.includes(cardId)
  const sameDraggable = currentWorkspaceNode.draggable === nextDraggable
  const nextZIndex = tutorialDraggableCardIds.includes(cardId) ? 30 : 0
  const sameZIndex = currentWorkspaceNode.zIndex === nextZIndex
  const nextClassName = workspaceNodeClassName(cardData.size, cardId)
  const sameClassName = currentWorkspaceNode.className === nextClassName
  if (samePosition && sameWidth && sameHeight && sameData && sameDraggable && sameClassName && sameZIndex) {
    return currentWorkspaceNode
  }

  return {
    ...currentWorkspaceNode,
    className: sameClassName ? currentWorkspaceNode.className : nextClassName,
    zIndex: nextZIndex,
    draggable: nextDraggable,
    position: samePosition ? currentWorkspaceNode.position : nextPosition,
    style:
      sameWidth && sameHeight
        ? currentWorkspaceNode.style
        : {
            ...currentWorkspaceNode.style,
            width: nodeStyle.width,
            height: nodeStyle.height,
            minHeight: nodeStyle.minHeight,
          },
    data: cardData,
  }
}

function reconcileAcceleratorStepNode({
  existingStepNode,
  acceleratorStepNodeData,
}: {
  existingStepNode?: WorkspaceCanvasNode
  acceleratorStepNodeData: WorkspaceCanvasNode
}) {
  if (existingStepNode && existingStepNode.type === "accelerator-step") {
    const samePosition =
      existingStepNode.position.x === acceleratorStepNodeData.position.x &&
      existingStepNode.position.y === acceleratorStepNodeData.position.y
    const sameWidth =
      existingStepNode.style?.width === acceleratorStepNodeData.style?.width
    const sameHeight =
      existingStepNode.style?.height === acceleratorStepNodeData.style?.height &&
      existingStepNode.style?.minHeight === acceleratorStepNodeData.style?.minHeight
    const sameDraggable =
      existingStepNode.draggable === acceleratorStepNodeData.draggable
    const sameData = existingStepNode.data === acceleratorStepNodeData.data

    if (samePosition && sameWidth && sameHeight && sameDraggable && sameData) {
      return existingStepNode
    }

    return {
      ...existingStepNode,
      ...acceleratorStepNodeData,
      position: samePosition
        ? existingStepNode.position
        : acceleratorStepNodeData.position,
      style:
        sameWidth && sameHeight
          ? existingStepNode.style
          : acceleratorStepNodeData.style,
      data: acceleratorStepNodeData.data,
    }
  }

  return acceleratorStepNodeData
}

function reconcileTutorialNode({
  existingTutorialNode,
  tutorialNodeData,
}: {
  existingTutorialNode?: WorkspaceCanvasNode
  tutorialNodeData: WorkspaceCanvasNode
}) {
  if (existingTutorialNode && existingTutorialNode.type === "workspace-tutorial") {
    const samePosition =
      existingTutorialNode.position.x === tutorialNodeData.position.x &&
      existingTutorialNode.position.y === tutorialNodeData.position.y
    const sameWidth =
      existingTutorialNode.style?.width === tutorialNodeData.style?.width
    const sameHeight =
      existingTutorialNode.style?.height === tutorialNodeData.style?.height &&
      existingTutorialNode.style?.minHeight === tutorialNodeData.style?.minHeight
    const sameData = existingTutorialNode.data === tutorialNodeData.data
    const sameDraggable = existingTutorialNode.draggable === tutorialNodeData.draggable
    const sameZIndex = existingTutorialNode.zIndex === tutorialNodeData.zIndex

    if (samePosition && sameWidth && sameHeight && sameData && sameDraggable && sameZIndex) {
      return existingTutorialNode
    }

    return {
      ...existingTutorialNode,
      ...tutorialNodeData,
      position: samePosition
        ? existingTutorialNode.position
        : existingTutorialNode.dragging
          ? existingTutorialNode.position
          : tutorialNodeData.position,
      style:
        sameWidth && sameHeight
          ? existingTutorialNode.style
          : tutorialNodeData.style,
      data: tutorialNodeData.data,
    }
  }

  return tutorialNodeData
}

export function reconcileWorkspaceCanvasV2Nodes({
  previous,
  visibleCardIds,
  boardNodeLookup,
  cardDataLookup,
  orgNodePositionFromBoard,
  allowEditing,
  acceleratorStepNodeData,
  tutorialNodeData,
  tutorialDraggableCardIds,
  tutorialCardPositionOverrides,
}: {
  previous: WorkspaceCanvasNode[]
  visibleCardIds: WorkspaceCanvasV2CardId[]
  boardNodeLookup: Map<WorkspaceCardId, WorkspaceBoardState["nodes"][number]>
  cardDataLookup: Record<WorkspaceCardId, WorkspaceBoardNodeData>
  orgNodePositionFromBoard: { x: number; y: number }
  allowEditing: boolean
  acceleratorStepNodeData: WorkspaceCanvasNode | null
  tutorialNodeData: WorkspaceCanvasNode | null
  tutorialDraggableCardIds: WorkspaceCanvasV2CardId[]
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
}): WorkspaceCanvasNode[] {
  const previousById = new Map(previous.map((node) => [node.id, node]))
  const next: WorkspaceCanvasNode[] = visibleCardIds.map((cardId) =>
    reconcileWorkspaceCardNode({
      currentWorkspaceNode:
        previousById.get(cardId)?.type === "workspace"
          ? previousById.get(cardId)
          : undefined,
      cardId,
      boardNode: boardNodeLookup.get(cardId),
      orgNodePositionFromBoard,
      cardData: cardDataLookup[cardId],
      allowEditing,
      tutorialDraggableCardIds,
      tutorialCardPositionOverrides,
    }),
  )

  if (acceleratorStepNodeData) {
    next.push(
      reconcileAcceleratorStepNode({
        existingStepNode: previousById.get(ACCELERATOR_STEP_NODE_ID),
        acceleratorStepNodeData,
      }),
    )
  }

  if (tutorialNodeData) {
    next.push(
      reconcileTutorialNode({
        existingTutorialNode: previousById.get(WORKSPACE_CANVAS_TUTORIAL_NODE_ID),
        tutorialNodeData,
      }),
    )
  }

  if (
    previous.length === next.length &&
    previous.every((node, index) => node === next[index])
  ) {
    return previous
  }

  return next
}
