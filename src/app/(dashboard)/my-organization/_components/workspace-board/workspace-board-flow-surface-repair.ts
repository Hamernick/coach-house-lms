"use client"

import { useCallback, useEffect, type MutableRefObject } from "react"
import type { ReactFlowInstance } from "reactflow"

import type { WorkspaceBoardNodeData } from "./workspace-board-node"

type UseWorkspaceBoardCanvasRepairArgs = {
  flowInstanceRef: MutableRefObject<ReactFlowInstance<WorkspaceBoardNodeData> | null>
  layoutFitViewOptions: {
    padding: number
    maxZoom: number
    minZoom: number
    duration: number
  }
  presentationMode: boolean
  isCanvasFullscreen: boolean
  isFlowReady: boolean
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  if (tagName === "input" || tagName === "textarea" || tagName === "select") return true
  return target.isContentEditable
}

export function useWorkspaceBoardCanvasRepair({
  flowInstanceRef,
  layoutFitViewOptions,
  presentationMode,
  isCanvasFullscreen,
  isFlowReady,
}: UseWorkspaceBoardCanvasRepairArgs) {
  const repairCanvasAlignment = useCallback(
    (fitToView = true) => {
      const instance = flowInstanceRef.current
      if (!instance) return
      // Force React Flow to recompute node bounds without relying on instance internals.
      instance.setNodes((previous) => previous.map((node) => ({ ...node })))
      if (fitToView) {
        instance.fitView(layoutFitViewOptions)
      }
    },
    [flowInstanceRef, layoutFitViewOptions],
  )

  useEffect(() => {
    if (presentationMode || isCanvasFullscreen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "r" || !event.shiftKey) return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      repairCanvasAlignment(true)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCanvasFullscreen, presentationMode, repairCanvasAlignment])

  useEffect(() => {
    if (!isFlowReady || isCanvasFullscreen) return
    const rafId = window.requestAnimationFrame(() => {
      repairCanvasAlignment(false)
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [isCanvasFullscreen, isFlowReady, repairCanvasAlignment])

  return {
    repairCanvasAlignment,
  }
}
