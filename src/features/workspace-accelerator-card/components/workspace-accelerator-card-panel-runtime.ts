"use client"

import { useEffect, useRef } from "react"

import { useWorkspaceAcceleratorCardController } from "../hooks/use-workspace-accelerator-card-controller"
import { areWorkspaceAcceleratorRuntimeSnapshotsEqual } from "../lib"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
} from "../types"

export function buildAcceleratorRuntimeSnapshot(args: {
  controller: ReturnType<typeof useWorkspaceAcceleratorCardController>
  runtimeStep: WorkspaceAcceleratorCardRuntimeSnapshot["currentStep"]
  selectedLessonGroupKey: string
  selectedLessonGroupLabel: string | null
  lessonGroupOptions: WorkspaceAcceleratorCardRuntimeSnapshot["lessonGroupOptions"]
  firstVisibleChecklistStepId: string | null
  isModuleViewerOpen: boolean
  openModuleId: string | null
  placeholderVideoUrl: string | null
  readinessSummary: WorkspaceAcceleratorCardInput["readinessSummary"]
  checklistModuleCount: number
  filteredStepCount: number
  filteredProgressPercent: number
  canGoPrevious: boolean
  canGoNext: boolean
}): WorkspaceAcceleratorCardRuntimeSnapshot {
  const {
    controller,
    runtimeStep,
    selectedLessonGroupKey,
    selectedLessonGroupLabel,
    lessonGroupOptions,
    firstVisibleChecklistStepId,
    isModuleViewerOpen,
    openModuleId,
    placeholderVideoUrl,
    readinessSummary,
    checklistModuleCount,
    filteredStepCount,
    filteredProgressPercent,
    canGoPrevious,
    canGoNext,
  } = args

  return {
    currentStep: runtimeStep,
    currentIndex: controller.currentIndex,
    totalSteps: controller.steps.length,
    canGoPrevious,
    canGoNext,
    currentModuleStepIndex: controller.currentModuleStepIndex,
    currentModuleStepTotal: Math.max(controller.currentModuleSteps.length, 1),
    currentModuleCompletedCount: controller.currentModuleCompletedCount,
    isCurrentModuleCompleted: controller.isCurrentModuleCompleted,
    isCurrentStepCompleted: controller.isCurrentStepCompleted,
    selectedLessonGroupKey: selectedLessonGroupKey || null,
    selectedLessonGroupLabel,
    lessonGroupOptions,
    firstVisibleChecklistStepId,
    isModuleViewerOpen,
    openModuleId,
    placeholderVideoUrl,
    readinessSummary: readinessSummary ?? null,
    checklistModuleCount,
    filteredStepCount,
    filteredProgressPercent,
  }
}

export function buildAcceleratorRuntimeSnapshotSignature(
  runtimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot
) {
  return JSON.stringify({
    currentStepId: runtimeSnapshot.currentStep?.id ?? null,
    currentStepHref: runtimeSnapshot.currentStep?.href ?? null,
    currentStepStatus: runtimeSnapshot.currentStep?.status ?? null,
    currentStepKind: runtimeSnapshot.currentStep?.stepKind ?? null,
    currentIndex: runtimeSnapshot.currentIndex,
    totalSteps: runtimeSnapshot.totalSteps,
    canGoPrevious: runtimeSnapshot.canGoPrevious,
    canGoNext: runtimeSnapshot.canGoNext,
    currentModuleStepIndex: runtimeSnapshot.currentModuleStepIndex,
    currentModuleStepTotal: runtimeSnapshot.currentModuleStepTotal,
    currentModuleCompletedCount: runtimeSnapshot.currentModuleCompletedCount,
    isCurrentModuleCompleted: runtimeSnapshot.isCurrentModuleCompleted,
    isCurrentStepCompleted: runtimeSnapshot.isCurrentStepCompleted,
    selectedLessonGroupKey: runtimeSnapshot.selectedLessonGroupKey,
    selectedLessonGroupLabel: runtimeSnapshot.selectedLessonGroupLabel,
    lessonGroupOptions:
      runtimeSnapshot.lessonGroupOptions?.map((option) => option.key) ?? [],
    firstVisibleChecklistStepId: runtimeSnapshot.firstVisibleChecklistStepId,
    isModuleViewerOpen: runtimeSnapshot.isModuleViewerOpen ?? false,
    openModuleId: runtimeSnapshot.openModuleId ?? null,
    placeholderVideoUrl: runtimeSnapshot.placeholderVideoUrl ?? null,
    readinessScore: runtimeSnapshot.readinessSummary?.score ?? null,
    checklistModuleCount: runtimeSnapshot.checklistModuleCount ?? 0,
    filteredStepCount: runtimeSnapshot.filteredStepCount ?? 0,
    filteredProgressPercent: runtimeSnapshot.filteredProgressPercent ?? null,
  })
}

export function buildWorkspaceAcceleratorControllerInput(
  input: WorkspaceAcceleratorCardInput
): WorkspaceAcceleratorCardInput {
  const visibleSteps = input.steps.filter(
    (step) =>
      (step.stepKind !== "lesson" ||
        Boolean(step.moduleContext?.workspaceOnboarding)) &&
      step.stepKind !== "complete"
  )
  if (visibleSteps.length === input.steps.length) return input
  const visibleStepIds = new Set(visibleSteps.map((step) => step.id))
  const nextInitialCurrentStepId =
    input.initialCurrentStepId && visibleStepIds.has(input.initialCurrentStepId)
      ? input.initialCurrentStepId
      : (visibleSteps[0]?.id ?? null)

  return {
    ...input,
    steps: visibleSteps,
    initialCurrentStepId: nextInitialCurrentStepId,
    initialCompletedStepIds: (input.initialCompletedStepIds ?? []).filter(
      (stepId) => visibleStepIds.has(stepId)
    ),
  }
}

export function useWorkspaceAcceleratorRuntimeSync({
  runtimeSnapshot,
  runtimeSnapshotSignature,
  runtimeActions,
  runtimeActionsSignature,
  onRuntimeChange,
  onRuntimeActionsChange,
}: {
  runtimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot
  runtimeSnapshotSignature: string
  runtimeActions: WorkspaceAcceleratorCardRuntimeActions
  runtimeActionsSignature: string
  onRuntimeChange?: (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => void
  onRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions
  ) => void
}) {
  const lastRuntimeSnapshotRef =
    useRef<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const lastRuntimeSnapshotSignatureRef = useRef<string | null>(null)
  const lastRuntimeActionsSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      areWorkspaceAcceleratorRuntimeSnapshotsEqual(
        lastRuntimeSnapshotRef.current,
        runtimeSnapshot
      )
    ) {
      return
    }
    if (lastRuntimeSnapshotSignatureRef.current === runtimeSnapshotSignature)
      return
    lastRuntimeSnapshotRef.current = runtimeSnapshot
    lastRuntimeSnapshotSignatureRef.current = runtimeSnapshotSignature
    onRuntimeChange?.(runtimeSnapshot)
  }, [onRuntimeChange, runtimeSnapshot, runtimeSnapshotSignature])

  useEffect(() => {
    if (lastRuntimeActionsSignatureRef.current === runtimeActionsSignature)
      return
    lastRuntimeActionsSignatureRef.current = runtimeActionsSignature
    onRuntimeActionsChange?.(runtimeActions)
  }, [onRuntimeActionsChange, runtimeActions, runtimeActionsSignature])
}
