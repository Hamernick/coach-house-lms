"use client"

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react"

import {
  resolveWorkspaceCanvasTutorialStepCount,
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialSelectedCardId,
  resolveWorkspaceCanvasTutorialVisibleCardIds,
} from "@/features/workspace-canvas-tutorial"

import {
  completeWorkspaceCanvasTutorialAction,
  saveWorkspaceBoardStateAction,
} from "../../_lib/workspace-actions"
import {
  type WorkspaceCanvasCardFocusRequest,
  type WorkspaceCanvasTutorialCompletionExitRequest,
} from "./workspace-canvas-v2/runtime/workspace-canvas-viewport-command"
import { buildAutoLayoutNodesForMode } from "./workspace-board-auto-layout-modes"
import {
  beginWorkspaceBoardInteraction,
  clearWorkspaceBoardInteraction,
  logWorkspaceBoardDebug,
  logWorkspaceBoardPhase,
  summarizeWorkspaceBoardVisibility,
  type WorkspaceBoardToggleContext,
} from "./workspace-board-debug"
import type {
  WorkspaceAutoLayoutMode,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceJourneyGuideState,
} from "./workspace-board-types"
import { isWorkspaceRestVisibleCardId } from "@/lib/workspace-card-policy"
import { reduceWorkspaceBoardVisibility } from "./workspace-board-visibility-reducer"
import { buildCompletedWorkspaceTutorialBoardState } from "./workspace-board-onboarding-flow"

export type WorkspaceCardFocusRequest = WorkspaceCanvasCardFocusRequest
export type WorkspaceTutorialCompletionExitRequest =
  WorkspaceCanvasTutorialCompletionExitRequest

export function isBoardStateContentEqual(
  left: WorkspaceBoardState,
  right: WorkspaceBoardState,
) {
  return (
    left.version === right.version &&
    left.preset === right.preset &&
    left.autoLayoutMode === right.autoLayoutMode &&
    left.nodes === right.nodes &&
    left.connections === right.connections &&
    left.communications === right.communications &&
    left.tracker === right.tracker &&
    left.accelerator === right.accelerator &&
    left.onboardingFlow === right.onboardingFlow &&
    left.hiddenCardIds === right.hiddenCardIds &&
    left.visibility === right.visibility
  )
}

export function areOrderedStringListsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function ensureWorkspaceConnection({
  connections,
  source,
  target,
}: {
  connections: WorkspaceBoardState["connections"]
  source: WorkspaceCardId
  target: WorkspaceCardId
}) {
  const hasConnection = connections.some(
    (connection) => connection.source === source && connection.target === target,
  )
  if (hasConnection) return connections

  return [
    ...connections,
    {
      id: `edge-${source}-to-${target}`,
      source,
      target,
    },
  ]
}

function areOrderedCardListsEqual(
  left: WorkspaceCardId[],
  right: WorkspaceCardId[],
) {
  if (left.length !== right.length) return false
  return left.every((cardId, index) => cardId === right[index])
}

export function buildToggleCardVisibilityHandler({
  setBoardState,
  setAcceleratorFocusRequestKey,
}: {
  setBoardState: Dispatch<SetStateAction<WorkspaceBoardState>>
  setAcceleratorFocusRequestKey: Dispatch<SetStateAction<number>>
}) {
  return (cardId: WorkspaceCardId, context?: WorkspaceBoardToggleContext) => {
    const interaction =
      context?.interactionId
        ? {
            id: context.interactionId,
            source: context.source,
            cardId,
          }
        : beginWorkspaceBoardInteraction({
            source: context?.source ?? "unknown",
            cardId,
          })
    let acceleratorVisibleAfterToggle = false
    let shouldRequestAcceleratorFocus = false
    const actionType: "context_hide_card" | "dock_toggle_card" =
      context?.source === "context-menu" ? "context_hide_card" : "dock_toggle_card"

    setBoardState((previous) => {
      const next = reduceWorkspaceBoardVisibility(previous, {
        type: actionType,
        cardId,
      })
      const nextNodes = buildAutoLayoutNodesForMode({
        mode: next.autoLayoutMode,
        existingNodes: previous.nodes,
        hiddenCardIds: next.hiddenCardIds,
        connections: previous.connections,
      })
      const before = summarizeWorkspaceBoardVisibility(previous)
      const after = summarizeWorkspaceBoardVisibility({
        ...next,
        nodes: nextNodes,
      })
      const beforeHiddenWithoutTarget = before.hiddenCardIds.filter((id) => id !== cardId)
      const afterHiddenWithoutTarget = after.hiddenCardIds.filter((id) => id !== cardId)
      const nonTargetHiddenChanged = !areOrderedCardListsEqual(
        beforeHiddenWithoutTarget,
        afterHiddenWithoutTarget,
      )
      const visibleCountDelta = after.visibleCount - before.visibleCount

      logWorkspaceBoardDebug("toggle_card_visibility", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        interactionCardId: interaction.cardId,
        before,
        after,
        nonTargetHiddenChanged,
        visibleCountDelta,
      })
      logWorkspaceBoardPhase("toggle_reduced", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        nonTargetHiddenChanged,
        visibleCountDelta,
      })

      logWorkspaceBoardDebug("toggle_card_visibility_tree_reflow", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        beforeHiddenWithoutTarget,
        afterHiddenWithoutTarget,
      })
      if (cardId === "accelerator") {
        const acceleratorVisibleBeforeToggle = !before.hiddenCardIds.includes("accelerator")
        acceleratorVisibleAfterToggle = !after.hiddenCardIds.includes("accelerator")
        shouldRequestAcceleratorFocus =
          actionType === "dock_toggle_card" &&
          !acceleratorVisibleBeforeToggle &&
          acceleratorVisibleAfterToggle
      }

      return {
        ...next,
        nodes: nextNodes,
      }
    })
    if (cardId === "accelerator") {
      logWorkspaceBoardDebug("layout_fit_requested_after_accelerator_toggle", {
        cardId,
        interactionId: interaction.id,
        interactionSource: interaction.source,
        acceleratorVisibleAfterToggle,
      })
      if (shouldRequestAcceleratorFocus) {
        setAcceleratorFocusRequestKey((previous) => previous + 1)
      }
    }
    clearWorkspaceBoardInteraction(interaction.id)
  }
}

export function useWorkspaceTutorialAutoFocus({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  setFocusCardRequest,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  setFocusCardRequest: Dispatch<SetStateAction<WorkspaceCardFocusRequest>>
}) {
  useEffect(() => {
    if (!tutorialActive) return
    if (
      resolveWorkspaceCanvasTutorialContinueMode(
        tutorialStepIndex,
        openedTutorialStepIds,
      ) === "shortcut"
    ) {
      return
    }
    const tutorialTargetCardId =
      resolveWorkspaceCanvasTutorialSelectedCardId(
        tutorialStepIndex,
        openedTutorialStepIds,
      )
    if (!tutorialTargetCardId) return
    const visibleCardIds = resolveWorkspaceCanvasTutorialVisibleCardIds(
      tutorialStepIndex,
      openedTutorialStepIds,
    )
    if (!visibleCardIds.includes(tutorialTargetCardId)) return

    setFocusCardRequest((previous) => ({
      cardId: tutorialTargetCardId,
      requestKey: (previous?.requestKey ?? 0) + 1,
    }))
  }, [
    openedTutorialStepIds,
    setFocusCardRequest,
    tutorialActive,
    tutorialStepIndex,
  ])
}

export function useWorkspaceTutorialCompletion({
  allowEditing,
  boardState,
  journeyGuideState,
  setBoardState,
  setTutorialCompletionExitRequest,
}: {
  allowEditing: boolean
  boardState: WorkspaceBoardState
  journeyGuideState: WorkspaceJourneyGuideState
  setBoardState: Dispatch<SetStateAction<WorkspaceBoardState>>
  setTutorialCompletionExitRequest: Dispatch<
    SetStateAction<WorkspaceTutorialCompletionExitRequest>
  >
}) {
  return useCallback(() => {
    const nextBoardState = buildCompletedWorkspaceTutorialBoardState(boardState)
    setBoardState(nextBoardState)
    setTutorialCompletionExitRequest((previous) => {
      const requestKey = (previous?.requestKey ?? 0) + 1
      return resolveWorkspaceTutorialCompletionExitRequest({
        boardState: nextBoardState,
        targetCardId: journeyGuideState.targetCardId,
        requestKey,
      })
    })
    void (async () => {
      if (allowEditing) {
        const persistResult = await saveWorkspaceBoardStateAction(nextBoardState)
        if ("error" in persistResult) {
          console.error(
            "[workspace-board] Unable to persist completed tutorial state.",
            persistResult.error,
          )
        }
      }

      const completionResult = await completeWorkspaceCanvasTutorialAction()
      if ("error" in completionResult) {
        console.error(
          "[workspace-board] Unable to mark workspace tutorial complete.",
          completionResult.error,
        )
      }
    })()
  }, [
    allowEditing,
    boardState,
    journeyGuideState.targetCardId,
    setBoardState,
    setTutorialCompletionExitRequest,
  ])
}

export function resolveWorkspaceTutorialCompletionExitRequest({
  boardState,
  targetCardId,
  requestKey,
}: {
  boardState: WorkspaceBoardState
  targetCardId: WorkspaceCardId
  requestKey: number
}): NonNullable<WorkspaceTutorialCompletionExitRequest> {
  if (
    boardState.autoLayoutMode === "timeline" &&
    isWorkspaceRestVisibleCardId(targetCardId) &&
    !boardState.hiddenCardIds.includes(targetCardId)
  ) {
    return {
      kind: "focus-card",
      cardId: targetCardId,
      requestKey,
    }
  }

  return {
    kind: "fit-visible",
    requestKey,
  }
}

export function useWorkspaceTutorialLayoutFit({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  setLayoutFitRequestKey,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  setLayoutFitRequestKey: Dispatch<SetStateAction<number>>
}) {
  const tutorialLayoutFitKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!tutorialActive) {
      tutorialLayoutFitKeyRef.current = null
      return
    }

    const nextKey = `tutorial:${tutorialStepIndex}:${openedTutorialStepIds.join(",")}`
    if (tutorialLayoutFitKeyRef.current === nextKey) return
    tutorialLayoutFitKeyRef.current = nextKey
    setLayoutFitRequestKey((previous) => previous + 1)
  }, [
    openedTutorialStepIds,
    setLayoutFitRequestKey,
    tutorialActive,
    tutorialStepIndex,
  ])
}

export function useWorkspaceJourneyAutoFocus({
  autoLayoutMode,
  journeyGuideState,
  setFocusCardRequest,
  disabled = false,
  preserveFocusKeyWhenDisabled = false,
}: {
  autoLayoutMode: WorkspaceAutoLayoutMode
  journeyGuideState: WorkspaceJourneyGuideState
  setFocusCardRequest: Dispatch<SetStateAction<WorkspaceCardFocusRequest>>
  disabled?: boolean
  preserveFocusKeyWhenDisabled?: boolean
}) {
  const lastJourneyFocusKeyRef = useRef<string | null>(null)
  const nextFocusKey = `${autoLayoutMode}:${journeyGuideState.stage}:${journeyGuideState.targetCardId}`

  useEffect(() => {
    if (disabled) {
      if (preserveFocusKeyWhenDisabled && autoLayoutMode === "timeline") {
        lastJourneyFocusKeyRef.current = nextFocusKey
      } else {
        lastJourneyFocusKeyRef.current = null
      }
      return
    }
    if (autoLayoutMode !== "timeline") {
      lastJourneyFocusKeyRef.current = null
      return
    }
    if (lastJourneyFocusKeyRef.current === nextFocusKey) return
    lastJourneyFocusKeyRef.current = nextFocusKey
    setFocusCardRequest((previous) => ({
        cardId: journeyGuideState.targetCardId,
        requestKey: (previous?.requestKey ?? 0) + 1,
      }))
  }, [
    autoLayoutMode,
    disabled,
    journeyGuideState.stage,
    journeyGuideState.targetCardId,
    nextFocusKey,
    preserveFocusKeyWhenDisabled,
    setFocusCardRequest,
  ])
}
