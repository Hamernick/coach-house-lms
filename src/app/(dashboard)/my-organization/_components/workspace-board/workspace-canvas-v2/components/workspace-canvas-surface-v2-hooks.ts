import { useMemo } from "react"

import {
  resolveWorkspaceCanvasTutorialCallout,
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialHighlightShortcutButtons,
  resolveWorkspaceCanvasTutorialSelectedCardId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceBoardToggleContext } from "../../workspace-board-debug"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceSeedData,
} from "../../workspace-board-types"
import { buildWorkspaceCardShortcutItemModels } from "../shortcuts/workspace-card-shortcut-model"
import { resolveWorkspaceCanvasCardReadinessMap } from "../runtime/workspace-canvas-card-readiness"

export function useWorkspaceCardShortcutItems({
  hiddenCardIds,
  visibleCardIds,
  selectedCardId,
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  onToggleCardVisibility,
  onFocusCard,
  onTutorialAdvance,
}: {
  hiddenCardIds: WorkspaceBoardState["hiddenCardIds"]
  visibleCardIds?: WorkspaceCardId[] | null
  selectedCardId: WorkspaceCardId | null
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  onToggleCardVisibility: (
    cardId: WorkspaceCardId,
    context?: WorkspaceBoardToggleContext,
  ) => void
  onFocusCard: (cardId: WorkspaceCardId) => void
  onTutorialAdvance?: (() => void) | null
}) {
  return useMemo(
    () => {
      const tutorialContinueMode = resolveWorkspaceCanvasTutorialContinueMode(
        tutorialStepIndex,
        openedTutorialStepIds,
      )
      const tutorialCallout =
        tutorialActive && tutorialContinueMode === "shortcut"
          ? resolveWorkspaceCanvasTutorialCallout(
              tutorialStepIndex,
              openedTutorialStepIds,
            )
          : null

      return buildWorkspaceCardShortcutItemModels({
        hiddenCardIds,
        visibleCardIds,
        selectedCardId,
        onToggle: onToggleCardVisibility,
        onFocusCard,
        tutorialTargetCardId:
          tutorialCallout?.kind === "shortcut-button"
            ? tutorialCallout.cardId
            : null,
        tutorialInstruction:
          tutorialCallout?.kind === "shortcut-button"
            ? tutorialCallout.instruction
            : null,
        tutorialHighlightAll:
          tutorialActive &&
          resolveWorkspaceCanvasTutorialHighlightShortcutButtons(
            tutorialStepIndex,
          ),
        onTutorialAdvance:
          tutorialActive && tutorialContinueMode === "shortcut"
            ? onTutorialAdvance
            : null,
      })
    },
    [
      hiddenCardIds,
      onFocusCard,
      onToggleCardVisibility,
      onTutorialAdvance,
      openedTutorialStepIds,
      selectedCardId,
      tutorialActive,
      tutorialStepIndex,
      visibleCardIds,
    ],
  )
}

export function useWorkspaceCardReadinessMap({
  seed,
  boardState,
}: {
  seed: WorkspaceSeedData
  boardState: WorkspaceBoardState
}) {
  return useMemo(
    () =>
      resolveWorkspaceCanvasCardReadinessMap({
        seed,
        boardState,
      }),
    [boardState, seed],
  )
}

export function useWorkspaceCanvasTutorialVisibility({
  boardState,
}: {
  boardState: WorkspaceBoardState
}) {
  return useMemo(() => {
    const tutorialActive = boardState.onboardingFlow.active
    const tutorialSelectedCardId = tutorialActive
      ? resolveWorkspaceCanvasTutorialSelectedCardId(
          boardState.onboardingFlow.tutorialStepIndex,
          boardState.onboardingFlow.openedTutorialStepIds,
        )
      : null

    return {
      tutorialActive,
      tutorialSelectedCardId,
      emptyStateMessage: tutorialActive
        ? null
        : "No cards visible. Use the Organization shortcuts to show a card.",
    }
  }, [
    boardState.onboardingFlow.active,
    boardState.onboardingFlow.openedTutorialStepIds,
    boardState.onboardingFlow.tutorialStepIndex,
  ])
}
