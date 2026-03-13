import type { WorkspaceAcceleratorCardRuntimeSnapshot } from "@/features/workspace-accelerator-card"

export function buildRuntimeStepSignature(
  step: WorkspaceAcceleratorCardRuntimeSnapshot["currentStep"],
) {
  if (!step) return "null"
  return JSON.stringify({
    id: step.id,
    moduleId: step.moduleId,
    stepKind: step.stepKind,
    stepTitle: step.stepTitle,
    status: step.status,
    href: step.href,
    stepSequenceIndex: step.stepSequenceIndex,
    stepSequenceTotal: step.stepSequenceTotal,
    moduleSequenceIndex: step.moduleSequenceIndex,
    moduleSequenceTotal: step.moduleSequenceTotal,
  })
}

export function areRuntimeSnapshotsEqual(
  left: WorkspaceAcceleratorCardRuntimeSnapshot | null,
  right: WorkspaceAcceleratorCardRuntimeSnapshot | null,
) {
  if (!left && !right) return true
  if (!left || !right) return false
  return (
    left.currentIndex === right.currentIndex &&
    left.totalSteps === right.totalSteps &&
    left.canGoPrevious === right.canGoPrevious &&
    left.canGoNext === right.canGoNext &&
    left.currentModuleStepIndex === right.currentModuleStepIndex &&
    left.currentModuleStepTotal === right.currentModuleStepTotal &&
    left.currentModuleCompletedCount === right.currentModuleCompletedCount &&
    left.isCurrentModuleCompleted === right.isCurrentModuleCompleted &&
    left.isCurrentStepCompleted === right.isCurrentStepCompleted &&
    left.selectedLessonGroupKey === right.selectedLessonGroupKey &&
    left.selectedLessonGroupLabel === right.selectedLessonGroupLabel &&
    JSON.stringify(left.lessonGroupOptions ?? []) ===
      JSON.stringify(right.lessonGroupOptions ?? []) &&
    left.firstVisibleChecklistStepId === right.firstVisibleChecklistStepId &&
    Boolean(left.isModuleViewerOpen) === Boolean(right.isModuleViewerOpen) &&
    (left.openModuleId ?? null) === (right.openModuleId ?? null) &&
    left.readinessSummary?.score === right.readinessSummary?.score &&
    buildRuntimeStepSignature(left.currentStep) === buildRuntimeStepSignature(right.currentStep)
  )
}
