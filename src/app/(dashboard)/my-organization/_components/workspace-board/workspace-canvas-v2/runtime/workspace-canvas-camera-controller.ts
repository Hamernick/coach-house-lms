"use client"

import { useEffect, useRef, type MutableRefObject } from "react"
import type { ReactFlowInstance } from "reactflow"

import { ACCELERATOR_STEP_NODE_ID } from "../../workspace-board-flow-surface-accelerator-graph-composition"
import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import { logWorkspaceCanvasEvent } from "./workspace-canvas-logger"

type WorkspaceCanvasCameraFitOptions = {
  padding: number
  minZoom: number
  maxZoom: number
  duration: number
}

type WorkspaceCanvasCardFocusRequest = {
  cardId: string
  requestKey: number
} | null

type WorkspaceCanvasSceneFitRequest = {
  nodeIds: string[]
  requestKey: number
} | null

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

function resolveVisibleFlowNodes(
  flowInstance: ReactFlowInstance,
  visibleNodeIds: string[],
) {
  const visibleNodeIdSet = new Set(visibleNodeIds)
  return flowInstance
    .getNodes()
    .filter((node) => visibleNodeIdSet.has(node.id))
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

export function useWorkspaceCanvasCameraController({
  flowInstanceRef,
  isFlowReady,
  visibleNodeIds,
  layoutFitRequestKey,
  acceleratorFocusRequestKey,
  focusCardRequest,
  sceneFitRequest,
  layoutFitOptions,
  sceneFitOptions,
  acceleratorFocusOptions,
  focusCardOptions,
}: {
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  isFlowReady: boolean
  visibleNodeIds: string[]
  layoutFitRequestKey: number
  acceleratorFocusRequestKey: number
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  sceneFitRequest: WorkspaceCanvasSceneFitRequest
  layoutFitOptions: WorkspaceCanvasCameraFitOptions
  sceneFitOptions: WorkspaceCanvasCameraFitOptions
  acceleratorFocusOptions: WorkspaceCanvasCameraFitOptions
  focusCardOptions: WorkspaceCanvasCameraFitOptions
}) {
  const didInitialFitRef = useRef(false)
  const handledLayoutFitRequestKeyRef = useRef(0)
  const handledAcceleratorFocusRequestKeyRef = useRef(0)
  const handledFocusCardRequestKeyRef = useRef(0)
  const handledSceneFitRequestKeyRef = useRef(0)
  const previousVisibleNodeCountRef = useRef(visibleNodeIds.length)

  useEffect(() => {
    if (!isFlowReady) return
    if (didInitialFitRef.current) return
    if (visibleNodeIds.length === 0) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return

    didInitialFitRef.current = true
    return scheduleDoubleFrame(() => {
      const nodes = resolveVisibleFlowNodes(flowInstance, visibleNodeIds)
      if (nodes.length === 0) return
      void flowInstance.fitView({
        nodes,
        ...layoutFitOptions,
        duration: 0,
      })
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_INITIAL_FIT, {
        nodeCount: nodes.length,
      })
    })
  }, [flowInstanceRef, isFlowReady, layoutFitOptions, visibleNodeIds])

  useEffect(() => {
    const previousCount = previousVisibleNodeCountRef.current
    const nextCount = visibleNodeIds.length
    previousVisibleNodeCountRef.current = nextCount

    if (!isFlowReady) return
    if (previousCount !== 0 || nextCount <= 0) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return

    return scheduleDoubleFrame(() => {
      const nodes = resolveVisibleFlowNodes(flowInstance, visibleNodeIds)
      if (nodes.length === 0) return
      void flowInstance.fitView({
        nodes,
        ...layoutFitOptions,
        duration: Math.max(160, layoutFitOptions.duration),
      })
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_INITIAL_FIT, {
        nodeCount: nodes.length,
        reason: "visible_nodes_recovered",
      })
    })
  }, [flowInstanceRef, isFlowReady, layoutFitOptions, visibleNodeIds])

  useEffect(() => {
    if (layoutFitRequestKey <= 0) return
    if (layoutFitRequestKey <= handledLayoutFitRequestKeyRef.current) return
    if (!isFlowReady) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    if (visibleNodeIds.length === 0) return

    handledLayoutFitRequestKeyRef.current = layoutFitRequestKey
    return scheduleDoubleFrame(() => {
      const nodes = resolveVisibleFlowNodes(flowInstance, visibleNodeIds)
      if (nodes.length === 0) return
      void flowInstance.fitView({
        nodes,
        ...layoutFitOptions,
      })
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST, {
        requestKey: layoutFitRequestKey,
        nodeCount: nodes.length,
      })
    })
  }, [
    flowInstanceRef,
    isFlowReady,
    layoutFitOptions,
    layoutFitRequestKey,
    visibleNodeIds,
  ])

  useEffect(() => {
    if (!sceneFitRequest) return
    if (sceneFitRequest.requestKey <= 0) return
    if (sceneFitRequest.requestKey <= handledSceneFitRequestKeyRef.current) return
    if (!isFlowReady) return
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    if (sceneFitRequest.nodeIds.length === 0) return

    const visibleNodeIdSet = new Set(visibleNodeIds)
    const allNodesVisible = sceneFitRequest.nodeIds.every((nodeId) =>
      visibleNodeIdSet.has(nodeId),
    )
    if (!allNodesVisible) return

    let cancelled = false
    let cancelPendingFrame: (() => void) | null = null
    const sceneNodeIdSet = new Set(sceneFitRequest.nodeIds)

    const attemptSceneFit = (remainingAttempts: number) => {
      cancelPendingFrame = scheduleDoubleFrame(() => {
        if (cancelled) return
        const nodes = flowInstance
          .getNodes()
          .filter((node) => sceneNodeIdSet.has(node.id))
        if (nodes.length !== sceneFitRequest.nodeIds.length) {
          if (remainingAttempts > 0) {
            attemptSceneFit(remainingAttempts - 1)
          }
          return
        }
        if (!nodes.every(hasRenderableNodeBounds)) {
          if (remainingAttempts > 0) {
            attemptSceneFit(remainingAttempts - 1)
          }
          return
        }

        handledSceneFitRequestKeyRef.current = sceneFitRequest.requestKey
        void flowInstance.fitView({
          nodes,
          ...sceneFitOptions,
        })
        logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST, {
          requestKey: sceneFitRequest.requestKey,
          nodeCount: nodes.length,
          reason: "scene_fit",
        })
      })
    }

    attemptSceneFit(8)

    return () => {
      cancelled = true
      cancelPendingFrame?.()
    }
  }, [
    flowInstanceRef,
    isFlowReady,
    sceneFitOptions,
    sceneFitRequest,
    visibleNodeIds,
  ])

  useEffect(() => {
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
      const nodes = flowInstance
        .getNodes()
        .filter(
          (node) => node.id === "accelerator" || node.id === ACCELERATOR_STEP_NODE_ID,
        )
      if (nodes.length === 0) return
      void flowInstance.fitView({
        nodes,
        ...acceleratorFocusOptions,
      })
      logWorkspaceCanvasEvent(
        WORKSPACE_CANVAS_EVENTS.CAMERA_ACCELERATOR_FOCUS_REQUEST,
        {
          requestKey: acceleratorFocusRequestKey,
          nodeCount: nodes.length,
        },
      )
    })
  }, [
    acceleratorFocusOptions,
    acceleratorFocusRequestKey,
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
  ])

  useEffect(() => {
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
      const nodes = flowInstance
        .getNodes()
        .filter((node) => node.id === focusCardRequest.cardId)
      if (nodes.length === 0) return
      void flowInstance.fitView({
        nodes,
        ...focusCardOptions,
      })
      logWorkspaceCanvasEvent(
        WORKSPACE_CANVAS_EVENTS.CAMERA_LAYOUT_FIT_REQUEST,
        {
          requestKey: focusCardRequest.requestKey,
          cardId: focusCardRequest.cardId,
          nodeCount: nodes.length,
          reason: "focus_card",
        },
      )
    })
  }, [
    focusCardOptions,
    focusCardRequest,
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
  ])
}
