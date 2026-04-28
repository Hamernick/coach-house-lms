"use client"

import type {
  WorkspaceAcceleratorTutorialBlockedAction,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"

export function isWorkspaceAcceleratorTutorialPinnedClassGroup({
  tutorialInteractionPolicy,
  lessonGroupKey,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  lessonGroupKey: string
}) {
  if (!tutorialInteractionPolicy) {
    return false
  }

  return tutorialInteractionPolicy.allowedClassGroupKey === lessonGroupKey
}

export function shouldWorkspaceAcceleratorTutorialBlockClassSelection({
  tutorialInteractionPolicy,
  lessonGroupKey,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  lessonGroupKey: string
}) {
  if (!tutorialInteractionPolicy) {
    return false
  }

  if (tutorialInteractionPolicy.allowClassSelection) {
    return false
  }

  return !isWorkspaceAcceleratorTutorialPinnedClassGroup({
    tutorialInteractionPolicy,
    lessonGroupKey,
  })
}

export function shouldWorkspaceAcceleratorTutorialBlockClassDropdownOpen({
  tutorialInteractionPolicy,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
}) {
  return tutorialInteractionPolicy?.allowClassDropdownOpen === false
}

export function canWorkspaceAcceleratorTutorialToggleModule({
  tutorialInteractionPolicy,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  moduleId: string
}) {
  return tutorialInteractionPolicy?.allowAccordionToggle ?? true
}

export function canWorkspaceAcceleratorTutorialActivateStep({
  tutorialInteractionPolicy,
  stepId,
  moduleId,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  stepId: string
  moduleId: string
}) {
  if (!tutorialInteractionPolicy) {
    return true
  }

  if (tutorialInteractionPolicy.stepId === "accelerator-first-module") {
    if (tutorialInteractionPolicy.allowedStepId !== null) {
      return tutorialInteractionPolicy.allowedStepId === stepId
    }

    return (
      tutorialInteractionPolicy.allowedModuleId !== null &&
      tutorialInteractionPolicy.allowedModuleId === moduleId
    )
  }

  return false
}

export function canWorkspaceAcceleratorTutorialPerformPreviewAction({
  tutorialInteractionPolicy,
  action,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  action: Extract<
    WorkspaceAcceleratorTutorialBlockedAction,
    | "preview-navigation"
    | "preview-close"
    | "preview-link"
    | "preview-submit"
  >
}) {
  if (!tutorialInteractionPolicy) {
    return true
  }

  if (action === "preview-navigation") {
    return tutorialInteractionPolicy.allowPreviewNavigation
  }

  if (action === "preview-close") {
    return tutorialInteractionPolicy.allowPreviewClose
  }

  if (action === "preview-link") {
    return tutorialInteractionPolicy.allowPreviewLinks
  }

  return tutorialInteractionPolicy.allowPreviewSubmit
}

export function isWorkspaceAcceleratorTutorialPreviewLocked({
  tutorialInteractionPolicy,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
}) {
  return tutorialInteractionPolicy?.stepId === "accelerator-close-module"
}
