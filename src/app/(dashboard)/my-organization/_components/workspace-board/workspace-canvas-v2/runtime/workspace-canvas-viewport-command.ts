import type { ReactFlowInstance } from "reactflow"

import type { WorkspaceCardId } from "../../workspace-board-types"
import { resolveWorkspaceCanvasFallbackFocusTarget } from "./workspace-canvas-focus-policy"

export type WorkspaceCanvasCameraFitOptions = {
  padding: number
  minZoom: number
  maxZoom: number
  duration: number
}

export type WorkspaceCanvasCardFocusRequest = {
  cardId: WorkspaceCardId
  requestKey: number
} | null

export type WorkspaceCanvasTutorialCompletionExitRequest =
  | {
      kind: "fit-visible"
      requestKey: number
    }
  | {
      kind: "focus-card"
      cardId: WorkspaceCardId
      requestKey: number
    }
  | null

export type WorkspaceCanvasSceneFitRequest = {
  nodeIds: string[]
  requestKey: number
  signature: string
  layoutKey: string
  x?: number
  y?: number
  zoom?: number
  duration?: number
  delayMs?: number
} | null

export type WorkspaceCanvasViewportCommand =
  | {
      kind: "scene-fit"
      sceneFitRequest: NonNullable<WorkspaceCanvasSceneFitRequest>
    }
  | {
      kind: "focus-card"
      cardId: string
    }
  | {
      kind: "fit-visible"
      nodeIds: string[]
    }
  | {
      kind: "fit-nodes"
      nodeIds: string[]
      options: "layout" | "accelerator-focus"
    }

export type WorkspaceCanvasViewportExecutionResult = {
  executed: boolean
  kind: WorkspaceCanvasViewportCommand["kind"]
  nodeCount: number
}

function clampSceneZoom(
  value: number,
  options: WorkspaceCanvasCameraFitOptions,
) {
  return Math.min(
    Math.max(value, options.minZoom),
    options.maxZoom,
  )
}

export function resolveFlowNodesForIds(
  flowInstance: ReactFlowInstance,
  nodeIds: string[],
) {
  const nodeIdSet = new Set(nodeIds)
  return flowInstance.getNodes().filter((node) => nodeIdSet.has(node.id))
}

export function resolveVisibleFlowNodes(
  flowInstance: ReactFlowInstance,
  visibleNodeIds: string[],
) {
  return resolveFlowNodesForIds(flowInstance, visibleNodeIds)
}

export function resolveWorkspaceCanvasViewportCommand({
  tutorialSceneFitRequest,
  tutorialCompletionExitRequest,
  focusCardRequest,
  journeyGuideTargetCardId,
  visibleNodeIds,
}: {
  tutorialSceneFitRequest: WorkspaceCanvasSceneFitRequest
  tutorialCompletionExitRequest: WorkspaceCanvasTutorialCompletionExitRequest
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  journeyGuideTargetCardId: string | null
  visibleNodeIds: string[]
}): WorkspaceCanvasViewportCommand | null {
  if (
    tutorialSceneFitRequest?.requestKey &&
    tutorialSceneFitRequest.requestKey > 0
  ) {
    return {
      kind: "scene-fit",
      sceneFitRequest: tutorialSceneFitRequest,
    }
  }

  if (
    tutorialCompletionExitRequest?.requestKey &&
    tutorialCompletionExitRequest.requestKey > 0
  ) {
    if (
      tutorialCompletionExitRequest.kind === "focus-card" &&
      visibleNodeIds.includes(tutorialCompletionExitRequest.cardId)
    ) {
      return {
        kind: "focus-card",
        cardId: tutorialCompletionExitRequest.cardId,
      }
    }

    if (visibleNodeIds.length > 0) {
      return {
        kind: "fit-visible",
        nodeIds: visibleNodeIds,
      }
    }
  }

  const focusTargetId = resolveWorkspaceCanvasFallbackFocusTarget({
    focusCardId: focusCardRequest?.cardId ?? null,
    journeyGuideTargetCardId,
    visibleNodeIds,
  })
  if (focusTargetId) {
    return {
      kind: "focus-card",
      cardId: focusTargetId,
    }
  }

  if (visibleNodeIds.length === 0) {
    return null
  }

  return {
    kind: "fit-visible",
    nodeIds: visibleNodeIds,
  }
}

export function executeWorkspaceCanvasViewportCommand({
  flowInstance,
  command,
  layoutFitOptions,
  sceneFitOptions,
  focusCardOptions,
  acceleratorFocusOptions,
}: {
  flowInstance: ReactFlowInstance
  command: WorkspaceCanvasViewportCommand
  layoutFitOptions: WorkspaceCanvasCameraFitOptions
  sceneFitOptions: WorkspaceCanvasCameraFitOptions
  focusCardOptions: WorkspaceCanvasCameraFitOptions
  acceleratorFocusOptions?: WorkspaceCanvasCameraFitOptions
}): WorkspaceCanvasViewportExecutionResult {
  if (command.kind === "scene-fit") {
    const { sceneFitRequest } = command
    const hasAuthoredViewport =
      typeof sceneFitRequest.x === "number" &&
      Number.isFinite(sceneFitRequest.x) &&
      typeof sceneFitRequest.y === "number" &&
      Number.isFinite(sceneFitRequest.y) &&
      typeof sceneFitRequest.zoom === "number" &&
      Number.isFinite(sceneFitRequest.zoom)

    if (hasAuthoredViewport) {
      void flowInstance.setCenter(sceneFitRequest.x!, sceneFitRequest.y!, {
        zoom: clampSceneZoom(sceneFitRequest.zoom!, sceneFitOptions),
        duration: sceneFitRequest.duration ?? sceneFitOptions.duration,
      })
      return {
        executed: true,
        kind: command.kind,
        nodeCount: sceneFitRequest.nodeIds.length,
      }
    }

    const sceneNodes = resolveFlowNodesForIds(flowInstance, sceneFitRequest.nodeIds)
    if (sceneNodes.length !== sceneFitRequest.nodeIds.length) {
      return {
        executed: false,
        kind: command.kind,
        nodeCount: sceneNodes.length,
      }
    }

    void flowInstance.fitView({
      nodes: sceneNodes,
      ...sceneFitOptions,
    })
    return {
      executed: true,
      kind: command.kind,
      nodeCount: sceneNodes.length,
    }
  }

  if (command.kind === "focus-card") {
    const focusedNodes = resolveFlowNodesForIds(flowInstance, [command.cardId])
    if (focusedNodes.length === 0) {
      return {
        executed: false,
        kind: command.kind,
        nodeCount: 0,
      }
    }

    void flowInstance.fitView({
      nodes: focusedNodes,
      ...focusCardOptions,
    })
    return {
      executed: true,
      kind: command.kind,
      nodeCount: focusedNodes.length,
    }
  }

  const fitNodes = resolveFlowNodesForIds(flowInstance, command.nodeIds)
  if (fitNodes.length === 0) {
    return {
      executed: false,
      kind: command.kind,
      nodeCount: 0,
    }
  }

  const fitViewOptions =
    command.kind === "fit-nodes" && command.options === "accelerator-focus"
      ? acceleratorFocusOptions
      : layoutFitOptions
  if (!fitViewOptions) {
    return {
      executed: false,
      kind: command.kind,
      nodeCount: fitNodes.length,
    }
  }

  void flowInstance.fitView({
    nodes: fitNodes,
    ...fitViewOptions,
  })
  return {
    executed: true,
    kind: command.kind,
    nodeCount: fitNodes.length,
  }
}
