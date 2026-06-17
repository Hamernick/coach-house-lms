"use client"

import { useState } from "react"

import { useWorkspaceCanvasAcceleratorRuntime } from "./workspace-canvas-surface-v2-accelerator-runtime"
import { useWorkspaceAcceleratorTutorialActionComplete } from "./workspace-canvas-surface-v2-accelerator-tutorial"
import { useResetAcceleratorStepNodePositionOverride } from "./workspace-canvas-surface-v2-hooks"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import {
  useWorkspaceAcceleratorStepNodeData,
  useWorkspaceAcceleratorTutorialCallout,
  useWorkspaceAcceleratorTutorialInteractionPolicy,
} from "./workspace-canvas-surface-v2-support"
import type { WorkspaceBoardState } from "../../workspace-board-types"

export function useWorkspaceCanvasSurfaceAcceleratorState({
  boardState,
  allowEditing,
  presentationMode,
  tutorialActive,
  acceleratorWorkspaceNode,
  acceleratorStepNodeVisible,
  onInitialOnboardingSubmit,
  onOpenAcceleratorStepNode,
  onCloseAcceleratorStepNode,
  onTutorialNext,
  onTutorialShortcutOpened,
}: {
  boardState: WorkspaceBoardState
  allowEditing: boolean
  presentationMode: boolean
  tutorialActive: boolean
  acceleratorWorkspaceNode: WorkspaceBoardState["nodes"][number] | null
  acceleratorStepNodeVisible: boolean
  onInitialOnboardingSubmit: WorkspaceCanvasSurfaceV2Props["onInitialOnboardingSubmit"]
  onOpenAcceleratorStepNode: WorkspaceCanvasSurfaceV2Props["onOpenAcceleratorStepNode"]
  onCloseAcceleratorStepNode: WorkspaceCanvasSurfaceV2Props["onCloseAcceleratorStepNode"]
  onTutorialNext: WorkspaceCanvasSurfaceV2Props["onTutorialNext"]
  onTutorialShortcutOpened: WorkspaceCanvasSurfaceV2Props["onTutorialShortcutOpened"]
}) {
  const [
    acceleratorStepNodePositionOverride,
    setAcceleratorStepNodePositionOverride,
  ] = useState<{ x: number; y: number } | null>(null)
  const acceleratorTutorialCallout = useWorkspaceAcceleratorTutorialCallout({
    tutorialActive: boardState.onboardingFlow.active,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
  })
  const {
    acceleratorRuntimeSnapshot,
    handleAcceleratorRuntimeChange,
    handleAcceleratorRuntimeActionsChange,
    handleOpenStepNode,
    handleHideStepNode,
    handlePreviousStep,
    handleNextStep,
    handleCompleteStep,
  } = useWorkspaceCanvasAcceleratorRuntime({
    activeStepId: boardState.accelerator.activeStepId,
    onOpenAcceleratorStepNode,
    onCloseAcceleratorStepNode,
    tutorialCallout: acceleratorTutorialCallout,
    onTutorialActionComplete: onTutorialShortcutOpened,
  })
  const handleAcceleratorTutorialActionComplete =
    useWorkspaceAcceleratorTutorialActionComplete({
      onTutorialNext,
      onTutorialShortcutOpened,
    })
  const acceleratorTutorialInteractionPolicy =
    useWorkspaceAcceleratorTutorialInteractionPolicy({
      tutorialActive,
      tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
      acceleratorRuntimeSnapshot,
    })

  useResetAcceleratorStepNodePositionOverride({
    acceleratorCardVisible: !boardState.hiddenCardIds.includes("accelerator"),
    acceleratorStepNodeVisible,
    setAcceleratorStepNodePositionOverride,
  })

  const acceleratorStepNodeData = useWorkspaceAcceleratorStepNodeData({
    acceleratorRuntimeSnapshot,
    acceleratorStepNodePositionOverride,
    acceleratorStepNodeVisible,
    autoLayoutMode: boardState.autoLayoutMode,
    allowEditing,
    tutorialActive,
    acceleratorWorkspaceNode,
    presentationMode,
    onPrevious: handlePreviousStep,
    onNext: handleNextStep,
    onComplete: handleCompleteStep,
    onClose: handleHideStepNode,
    onWorkspaceOnboardingSubmit: onInitialOnboardingSubmit,
  })

  return {
    acceleratorRuntimeSnapshot,
    acceleratorStepNodeData,
    acceleratorTutorialCallout,
    acceleratorTutorialInteractionPolicy,
    handleAcceleratorRuntimeActionsChange,
    handleAcceleratorRuntimeChange,
    handleAcceleratorTutorialActionComplete,
    handleHideStepNode,
    handleOpenStepNode,
    setAcceleratorStepNodePositionOverride,
  }
}
