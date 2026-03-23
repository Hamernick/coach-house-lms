"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { resolveWorkspaceCanvasTutorialCallout } from "@/features/workspace-canvas-tutorial"

import { buildAcceleratorStepNodeData } from "../../workspace-board-flow-surface-accelerator-graph-composition"
import type { WorkspaceBoardState, WorkspaceCardId } from "../../workspace-board-types"
import { useWorkspaceCanvasAcceleratorRuntime } from "./workspace-canvas-surface-v2-accelerator-runtime"
import { resolveWorkspaceAcceleratorTutorialInteractionPolicy } from "./workspace-canvas-surface-v2-accelerator-interaction-policy"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import type {
  WorkspaceCanvasNode,
  WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import { resolveAcceleratorTutorialCallout } from "./workspace-canvas-surface-v2-accelerator-tutorial"

export function useWorkspaceTutorialCardPositionOverrides({
  tutorialActive,
  tutorialSceneSignature,
}: {
  tutorialActive: boolean
  tutorialSceneSignature: string | null
}) {
  const [tutorialCardPositionOverrides, setTutorialCardPositionOverrides] =
    useState<Partial<Record<WorkspaceCanvasV2CardId, { x: number; y: number }>>>({})

  useEffect(() => {
    if (!tutorialActive) {
      setTutorialCardPositionOverrides({})
    }
  }, [tutorialActive])

  useEffect(() => {
    setTutorialCardPositionOverrides({})
  }, [tutorialSceneSignature])

  return {
    tutorialCardPositionOverrides,
    setTutorialCardPositionOverrides,
  }
}

export function useWorkspaceTutorialDockingState({
  tutorialActive,
  tutorialSceneSignature,
  tutorialCardPositionOverrides,
  tutorialSceneCardPositionOverrides,
  tutorialDockTargets,
}: {
  tutorialActive: boolean
  tutorialSceneSignature: string | null
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  >
  tutorialSceneCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
  tutorialDockTargets: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number; snapRadius: number }>
  >
}) {
  const [tutorialUndockedCardIds, setTutorialUndockedCardIds] = useState<
    WorkspaceCanvasV2CardId[]
  >([])

  useEffect(() => {
    if (!tutorialActive) {
      setTutorialUndockedCardIds([])
    }
  }, [tutorialActive])

  useEffect(() => {
    setTutorialUndockedCardIds([])
  }, [tutorialSceneSignature])

  const resolvedTutorialCardPositionOverrides = useMemo(() => {
    const dockedTutorialCardPositionOverrides = (
      Object.keys(tutorialDockTargets) as WorkspaceCanvasV2CardId[]
    ).reduce<
      Partial<Record<WorkspaceCanvasV2CardId, { x: number; y: number }>>
    >((accumulator, cardId) => {
      if (tutorialUndockedCardIds.includes(cardId)) {
        return accumulator
      }

      const dockTarget = tutorialDockTargets[cardId]
      if (!dockTarget) {
        return accumulator
      }

      accumulator[cardId] = {
        x: dockTarget.x,
        y: dockTarget.y,
      }

      return accumulator
    }, {})

    if (
      !tutorialSceneCardPositionOverrides &&
      Object.keys(dockedTutorialCardPositionOverrides).length === 0 &&
      Object.keys(tutorialCardPositionOverrides).length === 0
    ) {
      return null
    }

    return {
      ...(tutorialSceneCardPositionOverrides ?? {}),
      ...dockedTutorialCardPositionOverrides,
      ...tutorialCardPositionOverrides,
    }
  }, [
    tutorialCardPositionOverrides,
    tutorialDockTargets,
    tutorialSceneCardPositionOverrides,
    tutorialUndockedCardIds,
  ])

  return {
    resolvedTutorialCardPositionOverrides,
    setTutorialUndockedCardIds,
  }
}

export function useWorkspaceAcceleratorTutorialCallout({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
}) {
  return useMemo(
    () =>
      resolveAcceleratorTutorialCallout({
        tutorialActive,
        tutorialStepIndex,
        openedTutorialStepIds,
      }),
    [openedTutorialStepIds, tutorialActive, tutorialStepIndex],
  )
}

export function useWorkspaceTutorialActionHandlers({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  hiddenCardIds,
  onTutorialNext,
  onTutorialShortcutOpened,
  onConnectCards,
  onToggleCardVisibility,
  onFocusCard,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  hiddenCardIds: WorkspaceCardId[]
  onTutorialNext: () => void
  onTutorialShortcutOpened: () => void
  onConnectCards: (source: WorkspaceCardId, target: WorkspaceCardId) => void
  onToggleCardVisibility: WorkspaceCanvasSurfaceV2Props["onToggleCardVisibility"]
  onFocusCard: (cardId: WorkspaceCardId) => void
}) {
  const tutorialCallout = useMemo(
    () =>
      tutorialActive
        ? resolveWorkspaceCanvasTutorialCallout(
            tutorialStepIndex,
            openedTutorialStepIds,
          )
        : null,
    [openedTutorialStepIds, tutorialActive, tutorialStepIndex],
  )

  const handleTutorialActionComplete = useCallback(
    (mode: "complete" | "complete-and-advance" = "complete") => {
      onTutorialShortcutOpened()
      if (mode === "complete-and-advance") {
        onTutorialNext()
      }
    },
    [onTutorialNext, onTutorialShortcutOpened],
  )

  const handleOpenCard = useCallback(
    (cardId: WorkspaceCardId) => {
      if (cardId === "atlas") {
        onConnectCards("organization-overview", "atlas")
      }

      if (hiddenCardIds.includes(cardId)) {
        onToggleCardVisibility(cardId, { source: "dock" })
      }

      onFocusCard(cardId)
    },
    [hiddenCardIds, onConnectCards, onFocusCard, onToggleCardVisibility],
  )

  return {
    tutorialCallout,
    handleTutorialActionComplete,
    handleOpenCard,
  }
}

export function useWorkspaceAcceleratorTutorialInteractionPolicy({
  tutorialActive,
  tutorialStepIndex,
  acceleratorRuntimeSnapshot,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  acceleratorRuntimeSnapshot: ReturnType<
    typeof useWorkspaceCanvasAcceleratorRuntime
  >["acceleratorRuntimeSnapshot"]
}) {
  return useMemo(
    () =>
      resolveWorkspaceAcceleratorTutorialInteractionPolicy({
        tutorialActive,
        tutorialStepIndex,
        acceleratorRuntimeSnapshot,
      }),
    [acceleratorRuntimeSnapshot, tutorialActive, tutorialStepIndex],
  )
}

export function useWorkspaceAcceleratorStepNodeData({
  acceleratorRuntimeSnapshot,
  acceleratorStepNodePositionOverride,
  acceleratorStepNodeVisible,
  autoLayoutMode,
  allowEditing,
  tutorialActive,
  acceleratorWorkspaceNode,
  presentationMode,
  onPrevious,
  onNext,
  onComplete,
  onClose,
  onWorkspaceOnboardingSubmit,
}: {
  acceleratorRuntimeSnapshot: ReturnType<
    typeof useWorkspaceCanvasAcceleratorRuntime
  >["acceleratorRuntimeSnapshot"]
  acceleratorStepNodePositionOverride: { x: number; y: number } | null
  acceleratorStepNodeVisible: boolean
  autoLayoutMode: WorkspaceBoardState["autoLayoutMode"]
  allowEditing: boolean
  tutorialActive: boolean
  acceleratorWorkspaceNode: WorkspaceBoardState["nodes"][number] | null
  presentationMode: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  onClose: () => void
  onWorkspaceOnboardingSubmit: (form: FormData) => Promise<void>
}) {
  return useMemo<WorkspaceCanvasNode | null>(() => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot,
      acceleratorStepNodePositionOverride,
      acceleratorStepNodeVisible,
      autoLayoutMode,
      allowEditing: allowEditing && !tutorialActive,
      acceleratorWorkspaceNode,
      isCanvasFullscreen: false,
      presentationMode,
      onPrevious,
      onNext,
      onComplete,
      onClose,
      tutorialCallout: null,
      onWorkspaceOnboardingSubmit,
    })
    return node as WorkspaceCanvasNode | null
  }, [
    acceleratorRuntimeSnapshot,
    acceleratorStepNodePositionOverride,
    acceleratorStepNodeVisible,
    autoLayoutMode,
    allowEditing,
    tutorialActive,
    acceleratorWorkspaceNode,
    presentationMode,
    onPrevious,
    onNext,
    onComplete,
    onClose,
    onWorkspaceOnboardingSubmit,
  ])
}
