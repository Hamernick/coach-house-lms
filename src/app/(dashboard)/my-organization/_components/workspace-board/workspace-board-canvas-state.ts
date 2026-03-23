"use client"

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
} from "react"

import {
  clampWorkspaceCanvasTutorialStepIndex,
  isWorkspaceCanvasTutorialFinalStep,
  resolveWorkspaceCanvasTutorialStep,
} from "@/features/workspace-canvas-tutorial"

import {
  resetWorkspaceCanvasTutorialAction,
  saveWorkspaceBoardStateAction,
} from "../../_lib/workspace-actions"
import {
  isBoardStateContentEqual,
  type WorkspaceCardFocusRequest,
} from "./workspace-board-canvas-helpers"
import { logWorkspaceBoardDebug, summarizeWorkspaceBoardVisibility } from "./workspace-board-debug"
import {
  applyWorkspaceTutorialSnapshot,
  buildRestartedWorkspaceTutorialBoardState,
} from "./workspace-board-onboarding-flow"
import { resolveWorkspaceJourneyGuideState } from "./workspace-board-journey"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceBoardState,
  WorkspaceCollaborationInvite,
  WorkspaceSeedData,
} from "./workspace-board-types"

export function useWorkspaceBoardJourneyGuideState({
  seed,
  acceleratorState,
  acceleratorStepNodeVisible,
}: {
  seed: WorkspaceSeedData
  acceleratorState: WorkspaceBoardAcceleratorState
  acceleratorStepNodeVisible: boolean
}) {
  return useMemo(
    () =>
      resolveWorkspaceJourneyGuideState({
        seed,
        acceleratorState,
        acceleratorStepNodeVisible,
      }),
    [acceleratorState, acceleratorStepNodeVisible, seed],
  )
}

export function useWorkspaceRightRailCurrentUser(seed: WorkspaceSeedData) {
  return useMemo(
    () => ({
      id: seed.viewerId,
      name: seed.viewerName,
      avatarUrl: seed.viewerAvatarUrl,
    }),
    [seed.viewerAvatarUrl, seed.viewerId, seed.viewerName],
  )
}

export function buildPreviousWorkspaceTutorialFlowState(
  flowState: WorkspaceBoardState["onboardingFlow"],
) {
  const tutorialStepIndex = clampWorkspaceCanvasTutorialStepIndex(
    flowState.tutorialStepIndex - 1,
  )
  const tutorialStep = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const openedTutorialStepIds =
    tutorialStep.continueMode === "shortcut"
      ? flowState.openedTutorialStepIds.filter(
          (stepId) => stepId !== tutorialStep.id,
        )
      : flowState.openedTutorialStepIds

  return {
    ...flowState,
    active: true,
    tutorialStepIndex,
    openedTutorialStepIds,
    updatedAt: new Date().toISOString(),
  }
}

export function buildOpenedWorkspaceTutorialFlowState(
  flowState: WorkspaceBoardState["onboardingFlow"],
) {
  const tutorialStepIndex = clampWorkspaceCanvasTutorialStepIndex(
    flowState.tutorialStepIndex,
  )
  const currentStepId = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex).id
  const openedTutorialStepIds = flowState.openedTutorialStepIds.includes(currentStepId)
    ? flowState.openedTutorialStepIds
    : [...flowState.openedTutorialStepIds, currentStepId]
  const acknowledgedTutorialStepIds =
    flowState.acknowledgedTutorialStepIds.includes(currentStepId)
      ? flowState.acknowledgedTutorialStepIds
      : [...flowState.acknowledgedTutorialStepIds, currentStepId]

  return {
    ...flowState,
    active: true,
    tutorialStepIndex,
    openedTutorialStepIds,
    acknowledgedTutorialStepIds,
    updatedAt: new Date().toISOString(),
  }
}

export function useWorkspaceBoardTutorialNavigation({
  currentTutorialStepIndex,
  setBoardState,
  onCompleteTutorial,
  onRestart,
}: {
  currentTutorialStepIndex: number
  setBoardState: Dispatch<SetStateAction<WorkspaceBoardState>>
  onCompleteTutorial: () => void
  onRestart?: () => void
}) {
  const handleTutorialPrevious = useCallback(() => {
    setBoardState((previous) =>
      applyWorkspaceTutorialSnapshot(previous, {
        ...buildPreviousWorkspaceTutorialFlowState(previous.onboardingFlow),
      }),
    )
  }, [setBoardState])

  const handleTutorialNext = useCallback(() => {
    if (isWorkspaceCanvasTutorialFinalStep(currentTutorialStepIndex)) {
      onCompleteTutorial()
      return
    }

    setBoardState((previous) => {
      const stepIndex = clampWorkspaceCanvasTutorialStepIndex(
        previous.onboardingFlow.tutorialStepIndex,
      )
      const currentStepId = resolveWorkspaceCanvasTutorialStep(stepIndex).id
      const acknowledgedTutorialStepIds =
        previous.onboardingFlow.acknowledgedTutorialStepIds.includes(currentStepId)
          ? previous.onboardingFlow.acknowledgedTutorialStepIds
          : [
              ...previous.onboardingFlow.acknowledgedTutorialStepIds,
              currentStepId,
            ]

      return applyWorkspaceTutorialSnapshot(previous, {
        ...previous.onboardingFlow,
        active: true,
        tutorialStepIndex: clampWorkspaceCanvasTutorialStepIndex(stepIndex + 1),
        acknowledgedTutorialStepIds,
        updatedAt: new Date().toISOString(),
      })
    })
  }, [currentTutorialStepIndex, onCompleteTutorial, setBoardState])

  const handleTutorialShortcutOpened = useCallback(() => {
    setBoardState((previous) => {
      const stepIndex = clampWorkspaceCanvasTutorialStepIndex(
        previous.onboardingFlow.tutorialStepIndex,
      )
      const currentStepId = resolveWorkspaceCanvasTutorialStep(stepIndex).id

      if (previous.onboardingFlow.openedTutorialStepIds.includes(currentStepId)) {
        return previous
      }

      return applyWorkspaceTutorialSnapshot(previous, {
        ...buildOpenedWorkspaceTutorialFlowState(previous.onboardingFlow),
      })
    })
  }, [setBoardState])

  const handleTutorialRestart = useCallback(() => {
    let restartedBoardState: WorkspaceBoardState | null = null
    setBoardState((previous) => {
      restartedBoardState = buildRestartedWorkspaceTutorialBoardState(previous)
      return restartedBoardState
    })
    onRestart?.()
    if (restartedBoardState) {
      void saveWorkspaceBoardStateAction(restartedBoardState)
    }
    void resetWorkspaceCanvasTutorialAction()
  }, [onRestart, setBoardState])

  return {
    handleTutorialPrevious,
    handleTutorialNext,
    handleTutorialShortcutOpened,
    handleTutorialRestart,
  }
}

export function usePersistWorkspaceBoardState({
  allowEditing,
  boardState,
  lastPersistedBoardContentRef,
  persistRequestIdRef,
  setBoardState,
}: {
  allowEditing: boolean
  boardState: WorkspaceBoardState
  lastPersistedBoardContentRef: MutableRefObject<WorkspaceBoardState>
  persistRequestIdRef: MutableRefObject<number>
  setBoardState: Dispatch<SetStateAction<WorkspaceBoardState>>
}) {
  useEffect(() => {
    if (!allowEditing) return
    if (isBoardStateContentEqual(boardState, lastPersistedBoardContentRef.current)) return

    const requestId = persistRequestIdRef.current + 1
    persistRequestIdRef.current = requestId
    logWorkspaceBoardDebug("persist_board_state_scheduled", {
      requestId,
      ...summarizeWorkspaceBoardVisibility(boardState),
    })
    const timer = window.setTimeout(() => {
      void (async () => {
        logWorkspaceBoardDebug("persist_board_state_start", {
          requestId,
          ...summarizeWorkspaceBoardVisibility(boardState),
        })
        const response = await saveWorkspaceBoardStateAction(boardState)
        if (!("ok" in response)) {
          logWorkspaceBoardDebug("persist_board_state_error", {
            requestId,
            error: response.error,
          })
          console.error("[workspace-board] Unable to persist board state.", response.error)
          return
        }
        if (persistRequestIdRef.current !== requestId) return
        logWorkspaceBoardDebug("persist_board_state_success", {
          requestId,
          responseUpdatedAt: response.boardState.updatedAt,
          ...summarizeWorkspaceBoardVisibility(response.boardState),
        })
        lastPersistedBoardContentRef.current = boardState
        setBoardState((previous) =>
          previous.updatedAt === response.boardState.updatedAt
            ? previous
            : {
                ...previous,
                updatedAt: response.boardState.updatedAt,
              },
        )
      })()
    }, 550)

    return () => window.clearTimeout(timer)
  }, [
    allowEditing,
    boardState,
    lastPersistedBoardContentRef,
    persistRequestIdRef,
    setBoardState,
  ])
}

export type WorkspaceRightRailCurrentUser = ReturnType<typeof useWorkspaceRightRailCurrentUser>
export type WorkspaceBoardInvitesState = WorkspaceCollaborationInvite[]
export type WorkspaceBoardFocusRequest = WorkspaceCardFocusRequest
