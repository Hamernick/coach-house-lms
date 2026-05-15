"use client"

import type {
  WorkspaceCanvasTutorialNodeData,
} from "@/features/workspace-canvas-tutorial"

import { resolveWorkspaceCardNodeStyle } from "../../workspace-board-layout"
import type {
  WorkspaceBoardNodeData,
} from "../../workspace-board-node"
import { workspaceNodeClassName } from "../../workspace-board-node-class-name"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "../../workspace-board-types"
import type {
  WorkspaceCanvasNode,
} from "./workspace-canvas-surface-v2-helpers"
import { reconcileWorkspaceCanvasV2Nodes } from "./workspace-canvas-surface-v2-reconcile"
import type {
  WorkspaceCanvasV2CardId,
} from "../contracts/workspace-card-contract"

export function buildWorkspaceCanvasV2CardNode({
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

export function resolveWorkspaceCanvasRenderNodes({
  nodes,
  visibleCardIds,
  boardNodeLookup,
  cardDataLookup,
  orgNodePositionFromBoard,
  allowEditing,
  acceleratorStepNodeData,
  tutorialNodeData,
  tutorialCardPositionOverrides,
  tutorialDraggableCardIds,
}: {
  nodes: WorkspaceCanvasNode[]
  visibleCardIds: WorkspaceCanvasV2CardId[]
  boardNodeLookup: Map<WorkspaceCardId, WorkspaceBoardState["nodes"][number]>
  cardDataLookup: Record<WorkspaceCardId, WorkspaceBoardNodeData>
  orgNodePositionFromBoard: { x: number; y: number }
  allowEditing: boolean
  acceleratorStepNodeData: WorkspaceCanvasNode | null
  tutorialNodeData: WorkspaceCanvasNode | null
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
  tutorialDraggableCardIds: WorkspaceCanvasV2CardId[]
}) {
  const nextNodes = reconcileWorkspaceCanvasV2Nodes({
    previous: nodes,
    visibleCardIds,
    boardNodeLookup,
    cardDataLookup,
    orgNodePositionFromBoard,
    allowEditing,
    acceleratorStepNodeData,
    tutorialNodeData,
    tutorialDraggableCardIds,
    tutorialCardPositionOverrides,
  })
  const tutorialNodeState =
    tutorialNodeData?.type === "workspace-tutorial"
      ? (tutorialNodeData.data as WorkspaceCanvasTutorialNodeData)
      : null
  const suppressedNodeIdSet = new Set(
    tutorialNodeState?.suppressedNodeIds ?? [],
  )

  return suppressedNodeIdSet.size === 0
    ? nextNodes
    : nextNodes.filter(
        (node) =>
          node.id === "workspace-canvas-tutorial" ||
          !suppressedNodeIdSet.has(node.id),
      )
}
