import {
  resolveWorkspaceCanvasTutorialContinueMode,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceCardId } from "../../workspace-board-types"
import {
  resolveWorkspaceCanvasTransitionTiming,
  type WorkspaceCanvasTransitionTiming,
} from "./workspace-canvas-motion-grammar"
import {
  resolveWorkspaceCanvasTutorialAutofocusTarget,
  resolveWorkspaceCanvasTutorialShellMode,
  type WorkspaceCanvasShellMode,
} from "./workspace-canvas-focus-policy"
import {
  resolveWorkspaceTutorialTransitionKind,
  type WorkspaceTutorialTransitionKind,
} from "../components/workspace-canvas-surface-v2-tutorial-scene-spec"

export type WorkspaceCanvasPresentationPlan = WorkspaceCanvasTransitionTiming & {
  shellMode: WorkspaceCanvasShellMode
  autofocusTarget: WorkspaceCardId | null
}

export function resolveWorkspaceCanvasPresentationPlan({
  tutorialActive,
  previousStepIndex,
  tutorialStepIndex,
  openedTutorialStepIds,
  prefersReducedMotion,
  tutorialNodeAttached,
  tutorialSelectedCardId,
  visibleCardIds,
}: {
  tutorialActive: boolean
  previousStepIndex: number | null
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
  prefersReducedMotion: boolean
  tutorialNodeAttached: boolean
  tutorialSelectedCardId: WorkspaceCardId | null
  visibleCardIds: WorkspaceCardId[]
}): WorkspaceCanvasPresentationPlan {
  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedTutorialStepIds,
  )
  const transitionKind: WorkspaceTutorialTransitionKind =
    previousStepIndex === null
      ? "family-change"
      : resolveWorkspaceTutorialTransitionKind({
          previousStepIndex,
          nextStepIndex: tutorialStepIndex,
          openedTutorialStepIds,
        })
  const timing = resolveWorkspaceCanvasTransitionTiming({
    transitionKind,
    prefersReducedMotion,
    initialScene: previousStepIndex === null,
  })

  return {
    ...timing,
    shellMode: tutorialActive
      ? resolveWorkspaceCanvasTutorialShellMode({
          continueMode,
          tutorialNodeAttached,
        })
      : "live-canvas-only",
    autofocusTarget: resolveWorkspaceCanvasTutorialAutofocusTarget({
      tutorialActive,
      tutorialStepIndex,
      openedTutorialStepIds,
      visibleCardIds,
      tutorialSelectedCardId,
    }),
  }
}
