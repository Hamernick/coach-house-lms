import { useCallback, useRef, useState } from "react"

import type {
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"

import { areRuntimeSnapshotsEqual } from "./workspace-canvas-runtime-snapshot"

export function useWorkspaceCanvasAcceleratorRuntime({
  activeStepId,
  onOpenAcceleratorStepNode,
  onCloseAcceleratorStepNode,
}: {
  activeStepId: string | null
  onOpenAcceleratorStepNode: (stepId: string | null) => void
  onCloseAcceleratorStepNode: (source?: "dock" | "card" | "unknown") => void
}) {
  const acceleratorRuntimeActionsRef =
    useRef<WorkspaceAcceleratorCardRuntimeActions | null>(null)
  const [acceleratorRuntimeSnapshot, setAcceleratorRuntimeSnapshot] =
    useState<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)

  const handleAcceleratorRuntimeChange = useCallback(
    (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => {
      setAcceleratorRuntimeSnapshot((previous) =>
        areRuntimeSnapshotsEqual(previous, snapshot) ? previous : snapshot,
      )
    },
    [],
  )

  const handleAcceleratorRuntimeActionsChange = useCallback(
    (actions: WorkspaceAcceleratorCardRuntimeActions) => {
      acceleratorRuntimeActionsRef.current = actions
    },
    [],
  )

  const handleOpenStepNode = useCallback((stepId?: string | null) => {
    onOpenAcceleratorStepNode(
      stepId ?? acceleratorRuntimeSnapshot?.currentStep?.id ?? activeStepId ?? null,
    )
  }, [acceleratorRuntimeSnapshot?.currentStep?.id, activeStepId, onOpenAcceleratorStepNode])

  const handleHideStepNode = useCallback(() => {
    onCloseAcceleratorStepNode("card")
  }, [onCloseAcceleratorStepNode])

  const handlePreviousStep = useCallback(() => {
    acceleratorRuntimeActionsRef.current?.goPrevious()
  }, [])

  const handleNextStep = useCallback(() => {
    acceleratorRuntimeActionsRef.current?.goNext()
  }, [])

  const handleCompleteStep = useCallback(() => {
    const actions = acceleratorRuntimeActionsRef.current
    if (!actions) return
    actions.markCurrentStepComplete()
    actions.goNext()
    onCloseAcceleratorStepNode("card")
  }, [onCloseAcceleratorStepNode])

  return {
    acceleratorRuntimeSnapshot,
    handleAcceleratorRuntimeChange,
    handleAcceleratorRuntimeActionsChange,
    handleOpenStepNode,
    handleHideStepNode,
    handlePreviousStep,
    handleNextStep,
    handleCompleteStep,
  }
}
