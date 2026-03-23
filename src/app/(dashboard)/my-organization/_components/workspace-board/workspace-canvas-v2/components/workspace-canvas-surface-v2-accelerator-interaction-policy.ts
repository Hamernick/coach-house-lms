"use client"

import {
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"
import type {
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "@/features/workspace-accelerator-card"
import {
  WORKSPACE_ACCELERATOR_TUTORIAL_BLOCKED_MESSAGE,
  WORKSPACE_ACCELERATOR_TUTORIAL_BLOCKED_MESSAGE_DURATION_MS,
} from "@/features/workspace-accelerator-card"

const WORKSPACE_ACCELERATOR_TUTORIAL_POLICY_STEP_IDS = new Set<
  WorkspaceAcceleratorTutorialInteractionPolicy["stepId"]
>([
  "accelerator",
  "accelerator-picker",
  "accelerator-first-module",
  "accelerator-close-module",
])

function isWorkspaceAcceleratorTutorialPolicyStep(
  stepId: WorkspaceCanvasTutorialStepId,
): stepId is WorkspaceAcceleratorTutorialInteractionPolicy["stepId"] {
  return WORKSPACE_ACCELERATOR_TUTORIAL_POLICY_STEP_IDS.has(
    stepId as WorkspaceAcceleratorTutorialInteractionPolicy["stepId"],
  )
}

function resolvePinnedClassGroupKey(
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null,
) {
  const lessonGroupOptions = acceleratorRuntimeSnapshot?.lessonGroupOptions ?? []
  const formationOption = lessonGroupOptions.find(
    (option) => option.key === "formation",
  )

  if (formationOption) {
    return formationOption.key
  }

  return (
    acceleratorRuntimeSnapshot?.selectedLessonGroupKey ??
    lessonGroupOptions[0]?.key ??
    "formation"
  )
}

function buildBasePolicy({
  stepId,
  acceleratorRuntimeSnapshot,
}: {
  stepId: WorkspaceAcceleratorTutorialInteractionPolicy["stepId"]
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
}): WorkspaceAcceleratorTutorialInteractionPolicy {
  return {
    stepId,
    allowedClassGroupKey: resolvePinnedClassGroupKey(acceleratorRuntimeSnapshot),
    allowClassDropdownOpen: true,
    allowClassSelection: false,
    allowAccordionToggle: true,
    allowedModuleId: null,
    allowedStepId: null,
    allowPreviewPlayback: false,
    allowPreviewNavigation: false,
    allowPreviewClose: false,
    allowPreviewLinks: false,
    allowPreviewSubmit: false,
    blockedMessage: WORKSPACE_ACCELERATOR_TUTORIAL_BLOCKED_MESSAGE,
    blockedMessageDurationMs:
      WORKSPACE_ACCELERATOR_TUTORIAL_BLOCKED_MESSAGE_DURATION_MS,
  }
}

function resolveWorkspaceAcceleratorModuleIdFromStepId(
  stepId: string | null | undefined,
) {
  if (!stepId) {
    return null
  }

  const separatorIndex = stepId.lastIndexOf(":")
  if (separatorIndex <= 0) {
    return null
  }

  return stepId.slice(0, separatorIndex) || null
}

export function resolveWorkspaceAcceleratorTutorialInteractionPolicy({
  tutorialActive,
  tutorialStepIndex,
  acceleratorRuntimeSnapshot,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
}): WorkspaceAcceleratorTutorialInteractionPolicy | null {
  if (!tutorialActive) {
    return null
  }

  const stepId = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex).id
  if (!isWorkspaceAcceleratorTutorialPolicyStep(stepId)) {
    return null
  }

  const basePolicy = buildBasePolicy({
    stepId,
    acceleratorRuntimeSnapshot,
  })

  if (stepId === "accelerator" || stepId === "accelerator-picker") {
    return basePolicy
  }

  if (stepId === "accelerator-first-module") {
    const allowedStepId =
      acceleratorRuntimeSnapshot?.firstVisibleChecklistStepId ??
      acceleratorRuntimeSnapshot?.currentStep?.id ??
      null

    return {
      ...basePolicy,
      allowedModuleId:
        resolveWorkspaceAcceleratorModuleIdFromStepId(allowedStepId) ??
        acceleratorRuntimeSnapshot?.currentStep?.moduleId ??
        acceleratorRuntimeSnapshot?.openModuleId ??
        null,
      allowedStepId,
    }
  }

  return {
    ...basePolicy,
    allowedModuleId:
      acceleratorRuntimeSnapshot?.currentStep?.moduleId ??
      acceleratorRuntimeSnapshot?.openModuleId ??
      null,
    allowedStepId: acceleratorRuntimeSnapshot?.currentStep?.id ?? null,
    allowPreviewPlayback: true,
  }
}
