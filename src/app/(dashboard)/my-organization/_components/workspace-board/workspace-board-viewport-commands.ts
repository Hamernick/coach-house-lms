"use client"

import { useEffect, type MutableRefObject } from "react"
import type { ReactFlowInstance } from "reactflow"

import { logWorkspaceBoardDebug } from "./workspace-board-debug"

type WorkspaceBoardFitViewOptions = {
  padding: number
  maxZoom: number
  minZoom: number
  duration: number
}

function resolveIntersectionAreaRatio({
  nodeRect,
  viewportRect,
}: {
  nodeRect: DOMRect
  viewportRect: DOMRect
}) {
  const intersectWidth = Math.max(
    0,
    Math.min(nodeRect.right, viewportRect.right) -
      Math.max(nodeRect.left, viewportRect.left),
  )
  const intersectHeight = Math.max(
    0,
    Math.min(nodeRect.bottom, viewportRect.bottom) -
      Math.max(nodeRect.top, viewportRect.top),
  )
  const intersectArea = intersectWidth * intersectHeight
  const nodeArea = Math.max(1, nodeRect.width * nodeRect.height)
  return intersectArea / nodeArea
}

function resolveCenterInViewportWithMargin({
  nodeRect,
  viewportRect,
  marginPx,
}: {
  nodeRect: DOMRect
  viewportRect: DOMRect
  marginPx: number
}) {
  const centerX = nodeRect.left + nodeRect.width / 2
  const centerY = nodeRect.top + nodeRect.height / 2

  return (
    centerX >= viewportRect.left + marginPx &&
    centerX <= viewportRect.right - marginPx &&
    centerY >= viewportRect.top + marginPx &&
    centerY <= viewportRect.bottom - marginPx
  )
}

export function maybeFitAcceleratorIfOffscreen({
  flowInstance,
  layoutFitViewOptions,
  minimumVisibleRatio = 0.4,
  marginPx = 24,
}: {
  flowInstance: ReactFlowInstance
  layoutFitViewOptions: WorkspaceBoardFitViewOptions
  minimumVisibleRatio?: number
  marginPx?: number
}) {
  const acceleratorElement = document.querySelector<HTMLElement>(
    '.react-flow__node[data-id="accelerator"]',
  )
  const viewportElement = document.querySelector<HTMLElement>(
    ".workspace-layout-surface",
  )

  if (!acceleratorElement || !viewportElement) {
    void flowInstance.fitView({
      nodes: flowInstance.getNodes().filter((node) => node.id === "accelerator"),
      padding: layoutFitViewOptions.padding,
      maxZoom: layoutFitViewOptions.maxZoom,
      minZoom: layoutFitViewOptions.minZoom,
      duration: Math.max(160, layoutFitViewOptions.duration),
    })
    return {
      fitExecuted: true,
      reason: "missing-dom-node",
      visibleRatio: null as number | null,
    }
  }

  const nodeRect = acceleratorElement.getBoundingClientRect()
  const viewportRect = viewportElement.getBoundingClientRect()
  const visibleRatio = resolveIntersectionAreaRatio({
    nodeRect,
    viewportRect,
  })
  const centerInViewport = resolveCenterInViewportWithMargin({
    nodeRect,
    viewportRect,
    marginPx,
  })
  const shouldFit = visibleRatio < minimumVisibleRatio || !centerInViewport
  if (shouldFit) {
    void flowInstance.fitView({
      nodes: flowInstance.getNodes().filter((node) => node.id === "accelerator"),
      padding: layoutFitViewOptions.padding,
      maxZoom: layoutFitViewOptions.maxZoom,
      minZoom: layoutFitViewOptions.minZoom,
      duration: Math.max(160, layoutFitViewOptions.duration),
    })
  }

  return {
    fitExecuted: shouldFit,
    reason: shouldFit ? "accelerator-offscreen" : "already-visible",
    visibleRatio: Math.round(visibleRatio * 1000) / 1000,
  }
}

export function useWorkspaceBoardAcceleratorViewportCommand({
  acceleratorFocusRequestKey,
  flowInstanceRef,
  isFlowReady,
  isCanvasFullscreen,
  layoutFitViewOptions,
}: {
  acceleratorFocusRequestKey: number
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  isFlowReady: boolean
  isCanvasFullscreen: boolean
  layoutFitViewOptions: WorkspaceBoardFitViewOptions
}) {
  useEffect(() => {
    if (acceleratorFocusRequestKey <= 0) return
    if (!isFlowReady) return
    if (isCanvasFullscreen) return
    const instance = flowInstanceRef.current
    if (!instance) return

    let frameA = 0
    let frameB = 0
    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        const result = maybeFitAcceleratorIfOffscreen({
          flowInstance: instance,
          layoutFitViewOptions,
        })
        logWorkspaceBoardDebug("viewport_fit_command", {
          targetCardId: "accelerator",
          requestKey: acceleratorFocusRequestKey,
          ...result,
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(frameA)
      window.cancelAnimationFrame(frameB)
    }
  }, [
    acceleratorFocusRequestKey,
    flowInstanceRef,
    isCanvasFullscreen,
    isFlowReady,
    layoutFitViewOptions,
  ])
}

