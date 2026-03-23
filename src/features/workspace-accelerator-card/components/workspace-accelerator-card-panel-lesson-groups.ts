"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupKey,
  buildWorkspaceAcceleratorLessonGroupOptions,
} from "../lib"
import { useWorkspaceAcceleratorCardController } from "../hooks/use-workspace-accelerator-card-controller"
import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import { shouldWorkspaceAcceleratorTutorialBlockClassSelection } from "./workspace-accelerator-card-tutorial-guards"

export function useWorkspaceAcceleratorLessonGroupState({
  controller,
  currentStep,
  tutorialInteractionPolicy,
  setOpenModuleId,
}: {
  controller: ReturnType<typeof useWorkspaceAcceleratorCardController>
  currentStep: WorkspaceAcceleratorCardStep | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  setOpenModuleId: (next: string | null) => void
}) {
  const [lessonGroupFilter, setLessonGroupFilter] = useState("")
  const lessonGroupOptions = useMemo(
    () => buildWorkspaceAcceleratorLessonGroupOptions(controller.steps),
    [controller.steps],
  )
  const currentLessonGroupKey = currentStep
    ? buildWorkspaceAcceleratorLessonGroupKey(currentStep.groupTitle)
    : ""

  useEffect(() => {
    if (lessonGroupOptions.length === 0) {
      if (lessonGroupFilter !== "") {
        setLessonGroupFilter("")
      }
      return
    }

    const preferredGroupKey =
      lessonGroupOptions.find((option) => option.key === currentLessonGroupKey)?.key ??
      lessonGroupOptions[0]?.key ??
      ""
    if (preferredGroupKey && preferredGroupKey !== lessonGroupFilter) {
      setLessonGroupFilter(preferredGroupKey)
    }
  }, [currentLessonGroupKey, lessonGroupFilter, lessonGroupOptions])

  const selectedLessonGroupKey =
    tutorialInteractionPolicy?.allowedClassGroupKey ||
    lessonGroupFilter ||
    currentLessonGroupKey ||
    lessonGroupOptions[0]?.key ||
    ""

  useEffect(() => {
    const allowedClassGroupKey =
      tutorialInteractionPolicy?.allowedClassGroupKey ?? null
    if (!allowedClassGroupKey) return
    setLessonGroupFilter((previous) =>
      previous === allowedClassGroupKey ? previous : allowedClassGroupKey,
    )
  }, [tutorialInteractionPolicy?.allowedClassGroupKey])

  const selectedLessonGroup =
    lessonGroupOptions.find((option) => option.key === selectedLessonGroupKey) ?? null
  const handleLessonGroupChange = useCallback(
    (nextValue: string) => {
      if (
        shouldWorkspaceAcceleratorTutorialBlockClassSelection({
          tutorialInteractionPolicy,
          lessonGroupKey: nextValue,
        })
      ) {
        return
      }

      setLessonGroupFilter(nextValue)
      const nextGroup = lessonGroupOptions.find((option) => option.key === nextValue)
      const nextModuleId = nextGroup?.moduleIds[0] ?? null
      const nextStep = controller.steps.find((step) => step.moduleId === nextModuleId)
      if (!nextStep) return
      setOpenModuleId(nextModuleId)
      controller.goToStep(nextStep.id)
    },
    [controller, lessonGroupOptions, setOpenModuleId, tutorialInteractionPolicy],
  )
  const checklistModules = useMemo(
    () =>
      buildWorkspaceAcceleratorChecklistModules({
        steps: controller.steps,
        completedStepIds: controller.completedStepIds,
        selectedGroupKey: selectedLessonGroupKey,
        currentStepId: currentStep?.id ?? null,
      }),
    [
      controller.completedStepIds,
      controller.steps,
      currentStep?.id,
      selectedLessonGroupKey,
    ],
  )
  const filteredSteps = useMemo(
    () => checklistModules.flatMap((module) => module.steps),
    [checklistModules],
  )
  const filteredCompletedCount = useMemo(
    () =>
      checklistModules.reduce(
        (sum, module) => sum + module.completedStepCount,
        0,
      ),
    [checklistModules],
  )
  const filteredProgressPercent =
    filteredSteps.length === 0
      ? 0
      : Math.min(
          100,
          Math.round((filteredCompletedCount / filteredSteps.length) * 100),
        )
  const lessonGroupSummaries = useMemo(
    () =>
      lessonGroupOptions.map((option) => ({ key: option.key, label: option.label })),
    [lessonGroupOptions],
  )

  return {
    selectedLessonGroup,
    selectedLessonGroupKey,
    lessonGroupSummaries,
    checklistModules,
    filteredSteps,
    filteredProgressPercent,
    firstVisibleChecklistStepId: filteredSteps[0]?.id ?? null,
    handleLessonGroupChange,
  }
}
