"use client"

import { useEffect, useRef, useState, type MutableRefObject } from "react"
import type { ReactFlowInstance } from "reactflow"

import type { WorkspaceBoardNodeData } from "./workspace-board-node"

type FlowFitOptions = {
  padding: number
  maxZoom: number
  minZoom: number
  duration: number
}

export function useWorkspaceBoardFlowFitting({
  flowInstanceRef,
  isFlowReady,
  isCanvasFullscreen,
  composedNodeCount,
  layoutFitRequestKey,
  layoutFitViewOptions,
}: {
  flowInstanceRef: MutableRefObject<ReactFlowInstance<WorkspaceBoardNodeData> | null>
  isFlowReady: boolean
  isCanvasFullscreen: boolean
  composedNodeCount: number
  layoutFitRequestKey: number
  layoutFitViewOptions: FlowFitOptions
}) {
  const didInitialFitRef = useRef(false)
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false)

  useEffect(() => {
    if (!isFlowReady) return
    if (didInitialFitRef.current) return
    if (isCanvasFullscreen) return
    if (composedNodeCount === 0) return
    const instance = flowInstanceRef.current
    if (!instance) return

    let frameA = 0
    let frameB = 0

    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        didInitialFitRef.current = true
        void instance.fitView({
          padding: layoutFitViewOptions.padding,
          maxZoom: layoutFitViewOptions.maxZoom,
          minZoom: layoutFitViewOptions.minZoom,
          duration: 0,
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(frameA)
      window.cancelAnimationFrame(frameB)
    }
  }, [composedNodeCount, flowInstanceRef, isCanvasFullscreen, isFlowReady, layoutFitViewOptions])

  useEffect(() => {
    if (layoutFitRequestKey <= 0) return
    setIsLayoutAnimating(true)
    const timer = window.setTimeout(() => setIsLayoutAnimating(false), 320)
    return () => window.clearTimeout(timer)
  }, [layoutFitRequestKey])

  useEffect(() => {
    if (layoutFitRequestKey <= 0) return
    if (isCanvasFullscreen) return
    const instance = flowInstanceRef.current
    if (!instance) return

    let frameA = 0
    let frameB = 0

    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        void instance.fitView(layoutFitViewOptions)
      })
    })

    return () => {
      window.cancelAnimationFrame(frameA)
      window.cancelAnimationFrame(frameB)
    }
  }, [flowInstanceRef, isCanvasFullscreen, layoutFitRequestKey, layoutFitViewOptions])

  return { isLayoutAnimating }
}
