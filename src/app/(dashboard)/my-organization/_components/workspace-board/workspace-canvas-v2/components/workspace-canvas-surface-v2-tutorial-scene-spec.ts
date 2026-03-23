import {
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import { resolveWorkspaceTutorialStageFamily } from "./workspace-canvas-surface-v2-tutorial-presentation-state"

export type WorkspaceTutorialTransitionKind =
  | "same-family"
  | "family-change"
  | "accelerator-entry"
  | "welcome-handoff"
  | "accelerator-preview-exit"

export function resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen({
  tutorialStepIndex,
  acceleratorModuleViewerOpen,
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
}) {
  const step = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)

  if (step.sceneId === "accelerator-module") {
    return true
  }

  return step.id === "accelerator-first-module" && acceleratorModuleViewerOpen === true
}

export function resolveWorkspaceTutorialTransitionKind({
  previousStepIndex,
  nextStepIndex,
  openedTutorialStepIds,
}: {
  previousStepIndex: number | null
  nextStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
}): WorkspaceTutorialTransitionKind {
  const nextStep = resolveWorkspaceCanvasTutorialStep(nextStepIndex)

  if (previousStepIndex === null) {
    return "family-change"
  }

  const previousStep = resolveWorkspaceCanvasTutorialStep(previousStepIndex)

  if (previousStep.id === "welcome" && nextStep.id === "organization") {
    return "welcome-handoff"
  }

  if (
    previousStep.id === "accelerator-close-module" &&
    nextStep.id === "calendar"
  ) {
    return "accelerator-preview-exit"
  }

  const previousFamily = resolveWorkspaceTutorialStageFamily({
    tutorialStepIndex: previousStepIndex,
    openedStepIds: openedTutorialStepIds,
  })
  const nextFamily = resolveWorkspaceTutorialStageFamily({
    tutorialStepIndex: nextStepIndex,
    openedStepIds: openedTutorialStepIds,
  })

  if (previousFamily !== "accelerator" && nextFamily === "accelerator") {
    return "accelerator-entry"
  }

  return previousFamily === nextFamily ? "same-family" : "family-change"
}
