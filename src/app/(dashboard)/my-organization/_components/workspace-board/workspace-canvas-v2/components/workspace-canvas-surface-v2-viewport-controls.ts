"use client"

import { useCallback, type MutableRefObject } from "react"
import type { ReactFlowInstance } from "reactflow"

import {
  WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
  WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
} from "./workspace-canvas-surface-v2-config"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import {
  executeWorkspaceCanvasViewportCommand,
  resolveWorkspaceCanvasViewportCommand,
  type WorkspaceCanvasSceneFitRequest,
} from "../runtime/workspace-canvas-viewport-command"

export function useWorkspaceCanvasViewportControls({
  flowInstanceRef,
  tutorialActive,
  tutorialSceneFitRequest,
  tutorialCompletionExitRequest,
  focusCardRequest,
  journeyGuideState,
  visibleNodeIds,
}: {
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  tutorialActive: boolean
  tutorialSceneFitRequest: WorkspaceCanvasSceneFitRequest
  tutorialCompletionExitRequest: WorkspaceCanvasSurfaceV2Props["tutorialCompletionExitRequest"]
  focusCardRequest: WorkspaceCanvasSurfaceV2Props["focusCardRequest"]
  journeyGuideState: WorkspaceCanvasSurfaceV2Props["journeyGuideState"]
  visibleNodeIds: string[]
}) {
  const handleZoomIn = useCallback(() => {
    void flowInstanceRef.current?.zoomIn({ duration: 180 })
  }, [flowInstanceRef])

  const handleZoomOut = useCallback(() => {
    void flowInstanceRef.current?.zoomOut({ duration: 180 })
  }, [flowInstanceRef])

  const handleRecenterView = useCallback(() => {
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    const command = resolveWorkspaceCanvasViewportCommand({
      tutorialSceneFitRequest: tutorialActive ? tutorialSceneFitRequest : null,
      tutorialCompletionExitRequest,
      focusCardRequest,
      journeyGuideTargetCardId: journeyGuideState.targetCardId,
      visibleNodeIds,
    })
    if (!command) return

    executeWorkspaceCanvasViewportCommand({
      flowInstance,
      command,
      layoutFitOptions: WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
      sceneFitOptions: WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
      focusCardOptions: WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
    })
  }, [
    flowInstanceRef,
    focusCardRequest,
    journeyGuideState.targetCardId,
    tutorialActive,
    tutorialCompletionExitRequest,
    tutorialSceneFitRequest,
    visibleNodeIds,
  ])

  const handleResetView = useCallback(() => {
    const flowInstance = flowInstanceRef.current
    if (!flowInstance) return
    const command = resolveWorkspaceCanvasViewportCommand({
      tutorialSceneFitRequest: null,
      tutorialCompletionExitRequest: null,
      focusCardRequest: null,
      journeyGuideTargetCardId: null,
      visibleNodeIds,
    })
    if (!command || command.kind !== "fit-visible") return

    executeWorkspaceCanvasViewportCommand({
      flowInstance,
      command,
      layoutFitOptions: WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
      sceneFitOptions: WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
      focusCardOptions: WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
    })
  }, [flowInstanceRef, visibleNodeIds])

  return {
    handleZoomIn,
    handleZoomOut,
    handleRecenterView,
    handleResetView,
  }
}
