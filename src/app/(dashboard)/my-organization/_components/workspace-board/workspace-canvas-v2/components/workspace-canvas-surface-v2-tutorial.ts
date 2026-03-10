import { useCallback, useEffect, useMemo, useState } from "react"

import {
  type WorkspaceCanvasTutorialNodeData,
  clampWorkspaceCanvasTutorialStepIndex,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceBoardState } from "../../workspace-board-types"
import { WORKSPACE_CARD_IDS, type WorkspaceCardId } from "../../workspace-board-types"
import { useWorkspaceCanvasTutorialVisibility } from "./workspace-canvas-surface-v2-hooks"
import {
  WORKSPACE_CANVAS_TUTORIAL_NODE_ID,
  resolveWorkspaceCanvasTutorialPositionOverrideForScene,
  resolveWorkspaceCanvasTutorialSceneSignature,
  resolveWorkspaceCanvasTutorialRuntime,
  type WorkspaceCanvasTutorialPositionOverride,
} from "./workspace-canvas-surface-v2-tutorial-runtime"

export function useWorkspaceCanvasTutorialScene({
  boardState,
  allowEditing,
  onPrevious,
  onNext,
}: {
  boardState: WorkspaceBoardState
  allowEditing: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  const [tutorialNodePositionOverride, setTutorialNodePositionOverride] =
    useState<WorkspaceCanvasTutorialPositionOverride | null>(null)
  const {
    tutorialActive,
    tutorialSelectedCardId,
    emptyStateMessage,
  } = useWorkspaceCanvasTutorialVisibility({
    boardState,
  })
  const tutorialStepIndex = clampWorkspaceCanvasTutorialStepIndex(
    boardState.onboardingFlow.tutorialStepIndex,
  )
  const tutorialSceneSignature = useMemo(
    () =>
      resolveWorkspaceCanvasTutorialSceneSignature({
        tutorialActive,
        tutorialStepIndex,
        openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
      }),
    [
      boardState.onboardingFlow.openedTutorialStepIds,
      tutorialActive,
      tutorialStepIndex,
    ],
  )
  const tutorialRuntime = useMemo(
    () =>
      tutorialActive
        ? resolveWorkspaceCanvasTutorialRuntime({
            tutorialStepIndex,
            openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
            visibleCardIds: WORKSPACE_CARD_IDS.filter(
              (cardId) => !boardState.hiddenCardIds.includes(cardId),
            ) as WorkspaceCardId[],
            existingNodes: boardState.nodes,
            tutorialNodePositionOverride:
              resolveWorkspaceCanvasTutorialPositionOverrideForScene(
                tutorialNodePositionOverride,
                tutorialSceneSignature,
              ),
          })
        : null,
    [
      boardState.hiddenCardIds,
      boardState.nodes,
      boardState.onboardingFlow.openedTutorialStepIds,
      tutorialActive,
      tutorialSceneSignature,
      tutorialNodePositionOverride,
      tutorialStepIndex,
    ],
  )

  useEffect(() => {
    if (!tutorialActive) {
      setTutorialNodePositionOverride(null)
      return
    }

    setTutorialNodePositionOverride((previous) =>
      previous?.sceneSignature === tutorialSceneSignature ? previous : null,
    )
  }, [tutorialActive, tutorialSceneSignature])

  const tutorialNodeData = useMemo(() => {
    if (!tutorialActive || !tutorialRuntime) return null

    const data: WorkspaceCanvasTutorialNodeData = {
      stepIndex: tutorialStepIndex,
      openedStepIds: boardState.onboardingFlow.openedTutorialStepIds,
      onPrevious,
      onNext,
    }

    return {
      id: WORKSPACE_CANVAS_TUTORIAL_NODE_ID,
      type: "workspace-tutorial" as const,
      position: tutorialRuntime.tutorialNodePosition,
      draggable: allowEditing,
      selectable: false,
      dragHandle: ".workspace-tutorial-card-drag-handle",
      className: "select-none",
      style: tutorialRuntime.tutorialNodeStyle,
      data,
    }
  }, [
    allowEditing,
    boardState.onboardingFlow.openedTutorialStepIds,
    onNext,
    onPrevious,
    tutorialActive,
    tutorialRuntime,
    tutorialStepIndex,
  ])

  const handleTutorialNodeDragStop = useCallback(
    (x: number, y: number) => {
      if (!tutorialSceneSignature) {
        return
      }

      setTutorialNodePositionOverride((previous) => {
        if (
          previous?.x === x &&
          previous?.y === y &&
          previous.sceneSignature === tutorialSceneSignature
        ) {
          return previous
        }
        return {
          x,
          y,
          sceneSignature: tutorialSceneSignature,
        }
      })
    },
    [tutorialSceneSignature],
  )

  return {
    tutorialActive,
    tutorialSelectedCardId,
    tutorialNodeData,
    tutorialEdgeTargetId: tutorialRuntime?.tutorialEdgeTargetCardId ?? null,
    tutorialSceneFitPadding: tutorialRuntime?.fitPadding ?? null,
    emptyStateMessage,
    handleTutorialNodeDragStop,
  }
}
