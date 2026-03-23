"use client"

import { useEffect, useRef, type MutableRefObject } from "react"
import type { ReactFlowInstance } from "reactflow"

import { ACCELERATOR_STEP_NODE_ID } from "../../workspace-board-flow-surface-accelerator-graph-composition"
import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import { logWorkspaceCanvasEvent } from "./workspace-canvas-logger"
import { useWorkspaceCanvasTutorialCompletionExitEffects } from "./workspace-canvas-tutorial-completion-exit-effect"
import {
  executeWorkspaceCanvasViewportCommand,
  resolveFlowNodesForIds,
  type WorkspaceCanvasCameraFitOptions,
  type WorkspaceCanvasCardFocusRequest,
  type WorkspaceCanvasSceneFitRequest,
  type WorkspaceCanvasTutorialCompletionExitRequest,
} from "./workspace-canvas-viewport-command"

function scheduleDoubleFrame(callback: () => void) {
  let frameA = 0
  let frameB = 0
  frameA = window.requestAnimationFrame(() => {
    frameB = window.requestAnimationFrame(() => {
      callback()
    })
  })
  return () => {
    window.cancelAnimationFrame(frameA)
    window.cancelAnimationFrame(frameB)
  }
}

function resolveNodeMeasuredDimension(
  value: unknown,
): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null
}

function hasRenderableNodeBounds(
  node: ReturnType<ReactFlowInstance["getNodes"]>[number],
) {
  const measured = (node as {
    measured?: {
      width?: number
      height?: number
    }
  }).measured
  const width =
    resolveNodeMeasuredDimension(measured?.width) ??
    resolveNodeMeasuredDimension(node.width)
  const height =
    resolveNodeMeasuredDimension(measured?.height) ??
    resolveNodeMeasuredDimension(node.height)
  return width !== null && height !== null
}

function useWorkspaceCanvasFitEffects({
  flowInstanceRef,
  isFlowReady,
  visibleNodeIds,
  tutorialSceneFitActive,
  didInitialFitRef,
  previousVisibleNodeCountRef,
  handledLayoutFitRequestKeyRef,
  layoutFitRequestKey,
  layoutFitOptions,
  sceneFitOptions,
  acceleratorFocusOptions,
  focusCardOptions,
}: {
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  isFlowReady: boolean
  visibleNodeIds: string[]
  tutorialSceneFitActive: boolean
  didInitialFitRef: MutableRefObject<boolean>
  previousVisibleNodeCountRef: MutableRefObject<number>
  handledLayoutFitRequestKeyRef: MutableRefObject<number>
  layoutFitRequestKey: number
  layoutFitOptions: WorkspaceCanvasCameraFitOptions
  sceneFitOptions: WorkspaceCanvasCameraFitOptions
  acceleratorFocusOptions: WorkspaceCanvasCameraFitOptions
  focusCardOptions: WorkspaceCanvasCameraFitOptions
}) {
  useEffect(() => {
    if (tutorialSceneFitActive) return
    if (!isFlowReady) return
    if (didInitialFitRef.current) return
    if (visibleNodeIds.length === 0) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return

    didInitialFitRef.current = true
    return scheduleDoubleFrame(() => {
      const result = executeWorkspaceCanvasViewportCommand({
        flowInstance,
        command: {
          kind: "fit-visible",
          nodeIds: visibleNodeIds,
        },
        layoutFitOptions: {
          ...layoutFitOptions,
          duration: 0,
        },
        sceneFitOptions,
        focusCardOptions,
        acceleratorFocusOptions,
      })
      if (!result.executed) return
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_INITIAL_FIT, {
        nodeCount: result.nodeCount,
      })
    })
  }, [
    acceleratorFocusOptions,
    didInitialFitRef,
    flowInstanceRef,
    focusCardOptions,
    isFlowReady,
    layoutFitOptions,
    sceneFitOptions,
    tutorialSceneFitActive,
    visibleNodeIds,
  ])

  useEffect(() => {
    const previousCount = previousVisibleNodeCountRef.current
    const nextCount = visibleNodeIds.length
    previousVisibleNodeCountRef.current = nextCount

    if (tutorialSceneFitActive) return
    if (!isFlowReady) return
    if (previousCount !== 0 || nextCount <= 0) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return

    return scheduleDoubleFrame(() => {
      const result = executeWorkspaceCanvasViewportCommand({
        flowInstance,
        command: {
          kind: "fit-visible",
          nodeIds: visibleNodeIds,
        },
        layoutFitOptions: {
          ...layoutFitOptions,
          duration: Math.max(160, layoutFitOptions.duration),
        },
        sceneFitOptions,
        focusCardOptions,
        acceleratorFocusOptions,
      })
      if (!result.executed) return
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_INITIAL_FIT, {
        nodeCount: result.nodeCount,
        reason: "visible_nodes_recovered",
      })
    })
  }, [
    acceleratorFocusOptions,
    flowInstanceRef,
    focusCardOptions,
    isFlowReady,
    layoutFitOptions,
    previousVisibleNodeCountRef,
    sceneFitOptions,
    tutorialSceneFitActive,
    visibleNodeIds,
  ])

  useEffect(() => {
    if (tutorialSceneFitActive) return
    if (layoutFitRequestKey <= 0) return
    if (layoutFitRequestKey <= handledLayoutFitRequestKeyRef.current) return
    if (!isFlowReady) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    if (visibleNodeIds.length === 0) return

    handledLayoutFitRequestKeyRef.current = layoutFitRequestKey
    return scheduleDoubleFrame(() => {
      const result = executeWorkspaceCanvasViewportCommand({
        flowInstance,
        command: {
          kind: "fit-visible",
          nodeIds: visibleNodeIds,
        },
        layoutFitOptions,
        sceneFitOptions,
        focusCardOptions,
        acceleratorFocusOptions,
      })
      if (!result.executed) return
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST, {
        requestKey: layoutFitRequestKey,
        nodeCount: result.nodeCount,
      })
    })
  }, [
    acceleratorFocusOptions,
    flowInstanceRef,
    focusCardOptions,
    handledLayoutFitRequestKeyRef,
    isFlowReady,
    layoutFitOptions,
    layoutFitRequestKey,
    sceneFitOptions,
    tutorialSceneFitActive,
    visibleNodeIds,
  ])
}

function useWorkspaceCanvasFocusRequestEffects({
  flowInstanceRef,
  isFlowReady,
  visibleNodeIds,
  tutorialSceneFitActive,
  acceleratorFocusRequestKey,
  handledAcceleratorFocusRequestKeyRef,
  focusCardRequest,
  handledFocusCardRequestKeyRef,
  layoutFitOptions,
  sceneFitOptions,
  acceleratorFocusOptions,
  focusCardOptions,
}: {
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  isFlowReady: boolean
  visibleNodeIds: string[]
  tutorialSceneFitActive: boolean
  acceleratorFocusRequestKey: number
  handledAcceleratorFocusRequestKeyRef: MutableRefObject<number>
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  handledFocusCardRequestKeyRef: MutableRefObject<number>
  layoutFitOptions: WorkspaceCanvasCameraFitOptions
  sceneFitOptions: WorkspaceCanvasCameraFitOptions
  acceleratorFocusOptions: WorkspaceCanvasCameraFitOptions
  focusCardOptions: WorkspaceCanvasCameraFitOptions
}) {
  useEffect(() => {
    if (tutorialSceneFitActive) return
    if (acceleratorFocusRequestKey <= 0) return
    if (acceleratorFocusRequestKey <= handledAcceleratorFocusRequestKeyRef.current) {
      return
    }
    if (!isFlowReady) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    if (!visibleNodeIds.includes("accelerator")) return

    handledAcceleratorFocusRequestKeyRef.current = acceleratorFocusRequestKey
    return scheduleDoubleFrame(() => {
      const result = executeWorkspaceCanvasViewportCommand({
        flowInstance,
        command: {
          kind: "fit-nodes",
          nodeIds: ["accelerator", ACCELERATOR_STEP_NODE_ID],
          options: "accelerator-focus",
        },
        layoutFitOptions,
        sceneFitOptions,
        focusCardOptions,
        acceleratorFocusOptions,
      })
      if (!result.executed) return
      logWorkspaceCanvasEvent(
        WORKSPACE_CANVAS_EVENTS.CAMERA_ACCELERATOR_FOCUS_REQUEST,
        {
          requestKey: acceleratorFocusRequestKey,
          nodeCount: result.nodeCount,
        },
      )
    })
  }, [
    acceleratorFocusOptions,
    acceleratorFocusRequestKey,
    flowInstanceRef,
    focusCardOptions,
    handledAcceleratorFocusRequestKeyRef,
    isFlowReady,
    layoutFitOptions,
    sceneFitOptions,
    tutorialSceneFitActive,
    visibleNodeIds,
  ])

  useEffect(() => {
    if (tutorialSceneFitActive) return
    if (!focusCardRequest) return
    if (focusCardRequest.requestKey <= 0) return
    if (focusCardRequest.requestKey <= handledFocusCardRequestKeyRef.current) {
      return
    }
    if (!isFlowReady) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    if (!visibleNodeIds.includes(focusCardRequest.cardId)) return

    handledFocusCardRequestKeyRef.current = focusCardRequest.requestKey
    return scheduleDoubleFrame(() => {
      const result = executeWorkspaceCanvasViewportCommand({
        flowInstance,
        command: {
          kind: "focus-card",
          cardId: focusCardRequest.cardId,
        },
        layoutFitOptions,
        sceneFitOptions,
        focusCardOptions,
        acceleratorFocusOptions,
      })
      if (!result.executed) return
      logWorkspaceCanvasEvent(
        WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST,
        {
          requestKey: focusCardRequest.requestKey,
          cardId: focusCardRequest.cardId,
          nodeCount: result.nodeCount,
          reason: "focus_card",
        },
      )
    })
  }, [
    acceleratorFocusOptions,
    focusCardOptions,
    focusCardRequest,
    flowInstanceRef,
    handledFocusCardRequestKeyRef,
    isFlowReady,
    layoutFitOptions,
    sceneFitOptions,
    tutorialSceneFitActive,
    visibleNodeIds,
  ])
}

export function useWorkspaceCanvasCameraController({
  flowInstanceRef,
  isFlowReady,
  visibleNodeIds,
  layoutFitRequestKey,
  acceleratorFocusRequestKey,
  focusCardRequest,
  tutorialCompletionExitRequest,
  sceneFitRequest,
  layoutFitOptions,
  sceneFitOptions,
  acceleratorFocusOptions,
  focusCardOptions,
  onTutorialCompletionExitHandled,
}: {
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  isFlowReady: boolean
  visibleNodeIds: string[]
  layoutFitRequestKey: number
  acceleratorFocusRequestKey: number
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  tutorialCompletionExitRequest: WorkspaceCanvasTutorialCompletionExitRequest
  sceneFitRequest: WorkspaceCanvasSceneFitRequest
  layoutFitOptions: WorkspaceCanvasCameraFitOptions
  sceneFitOptions: WorkspaceCanvasCameraFitOptions
  acceleratorFocusOptions: WorkspaceCanvasCameraFitOptions
  focusCardOptions: WorkspaceCanvasCameraFitOptions
  onTutorialCompletionExitHandled: () => void
}) {
  const didInitialFitRef = useRef(false)
  const handledLayoutFitRequestKeyRef = useRef(0)
  const handledAcceleratorFocusRequestKeyRef = useRef(0)
  const handledFocusCardRequestKeyRef = useRef(0)
  const handledTutorialCompletionExitRequestKeyRef = useRef(0)
  const pendingTutorialCompletionExitRequestKeyRef = useRef(0)
  const handledSceneFitRequestRef = useRef<{
    requestKey: number
    signature: string | null
  }>({
    requestKey: 0,
    signature: null,
  })
  const pendingSceneFitRequestRef = useRef<string | null>(null)
  const previousVisibleNodeCountRef = useRef(visibleNodeIds.length)
  const tutorialSceneFitActive =
    sceneFitRequest !== null && sceneFitRequest.requestKey > 0

  useWorkspaceCanvasFitEffects({
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
    tutorialSceneFitActive,
    didInitialFitRef,
    previousVisibleNodeCountRef,
    handledLayoutFitRequestKeyRef,
    layoutFitRequestKey,
    layoutFitOptions,
    sceneFitOptions,
    acceleratorFocusOptions,
    focusCardOptions,
  })

  useEffect(() => {
    if (!sceneFitRequest) return
    if (sceneFitRequest.requestKey <= 0) return
    const pendingSceneFitRequestSignature = pendingSceneFitRequestRef.current
    const handledSceneFitRequest = handledSceneFitRequestRef.current
    if (sceneFitRequest.signature === handledSceneFitRequest.signature) {
      return
    }
    if (pendingSceneFitRequestSignature === sceneFitRequest.signature) {
      return
    }
    if (!isFlowReady) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return

    let cancelled = false
    let cancelPendingFrame: (() => void) | null = null
    let delayTimer = 0
    pendingSceneFitRequestRef.current = sceneFitRequest.signature
    const hasAuthoredViewport =
      typeof sceneFitRequest.x === "number" &&
      Number.isFinite(sceneFitRequest.x) &&
      typeof sceneFitRequest.y === "number" &&
      Number.isFinite(sceneFitRequest.y) &&
      typeof sceneFitRequest.zoom === "number" &&
      Number.isFinite(sceneFitRequest.zoom)

    const markSceneFitHandled = () => {
      handledSceneFitRequestRef.current = {
        requestKey: sceneFitRequest.requestKey,
        signature: sceneFitRequest.signature,
      }
      pendingSceneFitRequestRef.current = null
    }

    if (hasAuthoredViewport) {
      const applySceneCenter = () => {
        if (cancelled) return
        const result = executeWorkspaceCanvasViewportCommand({
          flowInstance,
          command: {
            kind: "scene-fit",
            sceneFitRequest,
          },
          layoutFitOptions,
          sceneFitOptions,
          focusCardOptions,
          acceleratorFocusOptions,
        })
        if (!result.executed) return
        markSceneFitHandled()
        logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST, {
          requestKey: sceneFitRequest.requestKey,
          nodeCount: result.nodeCount,
          reason: "scene_fit",
        })
      }

      if ((sceneFitRequest.delayMs ?? 0) > 0) {
        delayTimer = window.setTimeout(
          applySceneCenter,
          sceneFitRequest.delayMs,
        )
      } else {
        applySceneCenter()
      }

      return () => {
        cancelled = true
        pendingSceneFitRequestRef.current = null
        window.clearTimeout(delayTimer)
      }
    }

    if (sceneFitRequest.nodeIds.length === 0) {
      pendingSceneFitRequestRef.current = null
      return
    }

    const visibleNodeIdSet = new Set(visibleNodeIds)
    const allNodesVisible = sceneFitRequest.nodeIds.every((nodeId) =>
      visibleNodeIdSet.has(nodeId),
    )
    if (!allNodesVisible) {
      pendingSceneFitRequestRef.current = null
      return
    }

    const sceneNodeIdSet = new Set(sceneFitRequest.nodeIds)

    const attemptSceneFit = (remainingAttempts: number) => {
      cancelPendingFrame = scheduleDoubleFrame(() => {
        if (cancelled) return
        const nodes = resolveFlowNodesForIds(
          flowInstance,
          sceneFitRequest.nodeIds,
        )
        if (nodes.length !== sceneFitRequest.nodeIds.length) {
          if (remainingAttempts > 0) {
            attemptSceneFit(remainingAttempts - 1)
          } else {
            pendingSceneFitRequestRef.current = null
          }
          return
        }
        if (!nodes.every(hasRenderableNodeBounds)) {
          if (remainingAttempts > 0) {
            attemptSceneFit(remainingAttempts - 1)
          } else {
            pendingSceneFitRequestRef.current = null
          }
          return
        }

        markSceneFitHandled()
        const result = executeWorkspaceCanvasViewportCommand({
          flowInstance,
          command: {
            kind: "scene-fit",
            sceneFitRequest,
          },
          layoutFitOptions,
          sceneFitOptions,
          focusCardOptions,
          acceleratorFocusOptions,
        })
        if (!result.executed) return
        logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST, {
          requestKey: sceneFitRequest.requestKey,
          nodeCount: result.nodeCount,
          reason: "scene_fit",
        })
      })
    }

    attemptSceneFit(8)

    return () => {
      cancelled = true
      pendingSceneFitRequestRef.current = null
      cancelPendingFrame?.()
      window.clearTimeout(delayTimer)
    }
  }, [
    acceleratorFocusOptions,
    flowInstanceRef,
    focusCardOptions,
    isFlowReady,
    layoutFitOptions,
    sceneFitOptions,
    sceneFitRequest,
    visibleNodeIds,
  ])

  useWorkspaceCanvasTutorialCompletionExitEffects({
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
    tutorialSceneFitActive,
    tutorialCompletionExitRequest,
    handledTutorialCompletionExitRequestKeyRef,
    pendingTutorialCompletionExitRequestKeyRef,
    layoutFitOptions,
    sceneFitOptions,
    acceleratorFocusOptions,
    focusCardOptions,
    onTutorialCompletionExitHandled,
  })

  useWorkspaceCanvasFocusRequestEffects({
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
    tutorialSceneFitActive,
    acceleratorFocusRequestKey,
    handledAcceleratorFocusRequestKeyRef,
    focusCardRequest,
    handledFocusCardRequestKeyRef,
    layoutFitOptions,
    sceneFitOptions,
    acceleratorFocusOptions,
    focusCardOptions,
  })
}
