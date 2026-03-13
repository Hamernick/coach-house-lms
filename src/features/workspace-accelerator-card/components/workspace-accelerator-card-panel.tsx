"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupKey,
  buildWorkspaceAcceleratorLessonGroupOptions,
  buildWorkspaceAcceleratorRuntimeActionsSignature,
  resolveWorkspaceAcceleratorOpenModuleId,
} from "../lib"
import { useWorkspaceAcceleratorCardController } from "../hooks/use-workspace-accelerator-card-controller"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
} from "../types"
import {
  WorkspaceAcceleratorCardEmptyState,
  WorkspaceAcceleratorCardNavControls,
  WorkspaceAcceleratorCardSidebar,
  useModuleViewerSizeSync,
} from "./workspace-accelerator-card-panel-support"
import { WorkspaceAcceleratorStepNodeCard } from "./workspace-accelerator-step-node-card"

type WorkspaceAcceleratorCardPanelProps = {
  input: WorkspaceAcceleratorCardInput
  onRuntimeChange?: (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => void
  onRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions
  ) => void
  tutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  onTutorialActionComplete?: (
    mode?: "complete" | "complete-and-advance",
  ) => void
}

function buildAcceleratorRuntimeSnapshot(
  args: {
    controller: ReturnType<typeof useWorkspaceAcceleratorCardController>
    runtimeStep: WorkspaceAcceleratorCardRuntimeSnapshot["currentStep"]
    selectedLessonGroupKey: string
    selectedLessonGroupLabel: string | null
    lessonGroupOptions: WorkspaceAcceleratorCardRuntimeSnapshot["lessonGroupOptions"]
    firstVisibleChecklistStepId: string | null
    isModuleViewerOpen: boolean
    openModuleId: string | null
    readinessSummary: WorkspaceAcceleratorCardInput["readinessSummary"]
  },
): WorkspaceAcceleratorCardRuntimeSnapshot {
  const {
    controller,
    runtimeStep,
    selectedLessonGroupKey,
    selectedLessonGroupLabel,
    lessonGroupOptions,
    firstVisibleChecklistStepId,
    isModuleViewerOpen,
    openModuleId,
    readinessSummary,
  } = args

  return {
    currentStep: runtimeStep,
    currentIndex: controller.currentIndex,
    totalSteps: controller.steps.length,
    canGoPrevious: controller.canGoPrevious,
    canGoNext: controller.canGoNext,
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
    readinessSummary: readinessSummary ?? null,
  }
}

function buildAcceleratorRuntimeSnapshotSignature(
  runtimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot,
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
    lessonGroupOptions: runtimeSnapshot.lessonGroupOptions?.map((option) => option.key) ?? [],
    firstVisibleChecklistStepId: runtimeSnapshot.firstVisibleChecklistStepId,
    isModuleViewerOpen: runtimeSnapshot.isModuleViewerOpen ?? false,
    openModuleId: runtimeSnapshot.openModuleId ?? null,
    readinessScore: runtimeSnapshot.readinessSummary?.score ?? null,
  })
}

export function WorkspaceAcceleratorCardPanel({
  input,
  onRuntimeChange,
  onRuntimeActionsChange,
  tutorialCallout = null,
  onTutorialActionComplete,
}: WorkspaceAcceleratorCardPanelProps) {
  const router = useRouter()
  const controllerInput = useMemo<WorkspaceAcceleratorCardInput>(() => {
    const visibleSteps = input.steps.filter(
      (step) => step.stepKind !== "lesson" && step.stepKind !== "complete",
    )
    if (visibleSteps.length === input.steps.length) {
      return input
    }
    const visibleStepIds = new Set(visibleSteps.map((step) => step.id))
    const nextInitialCurrentStepId =
      input.initialCurrentStepId && visibleStepIds.has(input.initialCurrentStepId)
        ? input.initialCurrentStepId
        : visibleSteps[0]?.id ?? null

    return {
      ...input,
      steps: visibleSteps,
      initialCurrentStepId: nextInitialCurrentStepId,
      initialCompletedStepIds: (input.initialCompletedStepIds ?? []).filter((stepId) =>
        visibleStepIds.has(stepId),
      ),
    }
  }, [input])
  const controller = useWorkspaceAcceleratorCardController(controllerInput)
  const lastRuntimeSnapshotSignatureRef = useRef<string | null>(null)
  const lastRuntimeActionsSignatureRef = useRef<string | null>(null)
  const runtimeActionsRef = useRef<WorkspaceAcceleratorCardRuntimeActions | null>(null)
  const currentStep = controller.currentStep
  const stepHrefOverride = typeof controllerInput.linkHrefOverride === "string" && controllerInput.linkHrefOverride.trim().length > 0 ? controllerInput.linkHrefOverride : null
  const fallbackAcceleratorHref = stepHrefOverride ?? "/accelerator"
  const runtimeStep = useMemo(
    () =>
      currentStep
        ? {
            ...currentStep,
            href: stepHrefOverride ?? currentStep.href,
          }
        : null,
    [currentStep, stepHrefOverride],
  )

  useEffect(() => {
    if (fallbackAcceleratorHref.startsWith("/")) {
      router.prefetch(fallbackAcceleratorHref)
    }
  }, [fallbackAcceleratorHref, router])

  useEffect(() => {
    if (!runtimeStep?.href || !runtimeStep.href.startsWith("/")) return
    router.prefetch(runtimeStep.href)
  }, [router, runtimeStep?.href])

  const [lessonGroupFilter, setLessonGroupFilter] = useState<string>("")
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const [isModuleViewerOpen, setIsModuleViewerOpen] = useState(false)
  const previousCurrentModuleIdRef = useRef<string | null>(null)
  const lessonGroupOptions = useMemo(
    () => buildWorkspaceAcceleratorLessonGroupOptions(controller.steps),
    [controller.steps],
  )
  const currentLessonGroupKey = currentStep
    ? buildWorkspaceAcceleratorLessonGroupKey(currentStep.groupTitle)
    : ""

  useEffect(() => {
    if (lessonGroupOptions.length === 0) {
      if (lessonGroupFilter === "") return
      setLessonGroupFilter("")
      return
    }
    const preferredGroupKey =
      lessonGroupOptions.find((option) => option.key === currentLessonGroupKey)?.key ??
      lessonGroupOptions[0]?.key ??
      ""
    if (!preferredGroupKey || preferredGroupKey === lessonGroupFilter) return
    setLessonGroupFilter(preferredGroupKey)
  }, [currentLessonGroupKey, lessonGroupFilter, lessonGroupOptions])

  const selectedLessonGroupKey =
    lessonGroupFilter ||
    currentLessonGroupKey ||
    lessonGroupOptions[0]?.key ||
    ""
  const selectedLessonGroup =
    lessonGroupOptions.find((option) => option.key === selectedLessonGroupKey) ?? null
  const handleLessonGroupChange = useCallback(
    (nextValue: string) => {
      setLessonGroupFilter(nextValue)
      const nextGroup = lessonGroupOptions.find((option) => option.key === nextValue)
      const nextModuleId = nextGroup?.moduleIds[0]
      const nextStep = controller.steps.find((step) => step.moduleId === nextModuleId)
      if (!nextStep) return
      setOpenModuleId(nextModuleId ?? null)
      controller.goToStep(nextStep.id)
    },
    [controller, lessonGroupOptions],
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
  const firstVisibleChecklistStepId = filteredSteps[0]?.id ?? null
  const lessonGroupSummaries = useMemo(
    () =>
      lessonGroupOptions.map((option) => ({
        key: option.key,
        label: option.label,
      })),
    [lessonGroupOptions],
  )
  const runtimeActions = useMemo<WorkspaceAcceleratorCardRuntimeActions>(
    () => ({
      goPrevious: controller.goPrevious,
      goNext: controller.goNext,
      markCurrentStepComplete: controller.markCurrentStepComplete,
      selectLessonGroup: handleLessonGroupChange,
    }),
    [
      handleLessonGroupChange,
      controller.goNext,
      controller.goPrevious,
      controller.markCurrentStepComplete,
    ],
  )
  runtimeActionsRef.current = runtimeActions
  const runtimeSnapshot = useMemo<WorkspaceAcceleratorCardRuntimeSnapshot>(
    () =>
      buildAcceleratorRuntimeSnapshot({
        controller,
        runtimeStep,
        selectedLessonGroupKey,
        selectedLessonGroupLabel: selectedLessonGroup?.label ?? null,
        lessonGroupOptions: lessonGroupSummaries,
        firstVisibleChecklistStepId,
        isModuleViewerOpen,
        openModuleId,
        readinessSummary: controllerInput.readinessSummary,
      }),
    [
      controller,
      controllerInput.readinessSummary,
      firstVisibleChecklistStepId,
      isModuleViewerOpen,
      lessonGroupSummaries,
      openModuleId,
      runtimeStep,
      selectedLessonGroup?.label,
      selectedLessonGroupKey,
    ],
  )
  const runtimeSnapshotSignature = useMemo(
    () => buildAcceleratorRuntimeSnapshotSignature(runtimeSnapshot),
    [runtimeSnapshot],
  )
  const runtimeActionsSignature = useMemo(
    () =>
      buildWorkspaceAcceleratorRuntimeActionsSignature({
        currentStepId: runtimeSnapshot.currentStep?.id ?? null,
        canGoPrevious: runtimeSnapshot.canGoPrevious,
        canGoNext: runtimeSnapshot.canGoNext,
        isCurrentStepCompleted: runtimeSnapshot.isCurrentStepCompleted,
        totalSteps: runtimeSnapshot.totalSteps,
        selectedLessonGroupKey,
        lessonGroupCount: lessonGroupSummaries.length,
      }),
    [
      runtimeSnapshot.canGoNext,
      runtimeSnapshot.canGoPrevious,
      runtimeSnapshot.currentStep?.id,
      runtimeSnapshot.isCurrentStepCompleted,
      runtimeSnapshot.totalSteps,
      lessonGroupSummaries.length,
      selectedLessonGroupKey,
    ],
  )
  const moduleCount = checklistModules.length
  const checklistModuleIds = useMemo(
    () => checklistModules.map((module) => module.id),
    [checklistModules],
  )
  const checklistModuleIdsSignature = useMemo(() => checklistModuleIds.join("|"), [checklistModuleIds])
  const { onSizeChange, size, readinessSummary } = controllerInput

  useModuleViewerSizeSync({
    size,
    onSizeChange,
    isModuleViewerOpen,
  })

  useEffect(() => {
    const currentModuleId = currentStep?.moduleId ?? null
    const previousCurrentModuleId = previousCurrentModuleIdRef.current
    previousCurrentModuleIdRef.current = currentModuleId

    if (checklistModuleIds.length === 0) {
      setOpenModuleId((previous) => (previous === null ? previous : null))
      return
    }

    const hasCurrentModuleChanged =
      previousCurrentModuleId !== null &&
      previousCurrentModuleId !== currentModuleId
    const shouldForceCurrentModuleOpen =
      previousCurrentModuleId === null || hasCurrentModuleChanged

    setOpenModuleId((previous) => {
      const next = resolveWorkspaceAcceleratorOpenModuleId({
        previousOpenModuleId: previous,
        visibleModuleIds: checklistModuleIds,
        currentModuleId,
        forceCurrentModuleOpen: shouldForceCurrentModuleOpen,
      })
      return previous === next ? previous : next
    })
  }, [checklistModuleIds, checklistModuleIdsSignature, currentStep?.moduleId])

  useEffect(() => {
    if (tutorialCallout?.focus !== "first-module") return
    const nextModuleId = checklistModules[0]?.id ?? null
    if (!nextModuleId) return
    setOpenModuleId((previous) => (previous === nextModuleId ? previous : nextModuleId))
  }, [checklistModules, tutorialCallout?.focus])

  useEffect(() => {
    if (lastRuntimeSnapshotSignatureRef.current === runtimeSnapshotSignature) return
    lastRuntimeSnapshotSignatureRef.current = runtimeSnapshotSignature
    onRuntimeChange?.(runtimeSnapshot)
  }, [onRuntimeChange, runtimeSnapshot, runtimeSnapshotSignature])

  useEffect(() => {
    if (lastRuntimeActionsSignatureRef.current === runtimeActionsSignature) return
    lastRuntimeActionsSignatureRef.current = runtimeActionsSignature
    if (!runtimeActionsRef.current) return
    onRuntimeActionsChange?.(runtimeActionsRef.current)
  }, [onRuntimeActionsChange, runtimeActionsSignature])

  const handleCloseModuleViewer = () => {
    setIsModuleViewerOpen(false)
    if (tutorialCallout?.focus === "close-module") {
      onTutorialActionComplete?.()
    }
  }

  const handleCompleteModuleStep = () => {
    controller.markCurrentStepComplete()
    if (controller.canGoNext) {
      controller.goNext()
    }
    handleCloseModuleViewer()
  }

  const handleStepSelect = (step: WorkspaceAcceleratorCardStep) => {
    controller.goToStep(step.id)
    setOpenModuleId(step.moduleId)
    setIsModuleViewerOpen(true)
    if (
      tutorialCallout?.focus === "first-module" &&
      step.id === firstVisibleChecklistStepId
    ) {
      onTutorialActionComplete?.("complete-and-advance")
    }
  }

  if (!currentStep) {
    return <WorkspaceAcceleratorCardEmptyState href={fallbackAcceleratorHref} />
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3",
          isModuleViewerOpen
            ? "grid-cols-[minmax(250px,290px)_minmax(0,1fr)]"
            : "grid-cols-1",
        )}
      >
        <div className="flex min-h-0 flex-col gap-2">
          <WorkspaceAcceleratorCardSidebar
            selectedLessonGroup={selectedLessonGroup}
            tutorialCallout={tutorialCallout}
            moduleCount={moduleCount}
            filteredSteps={filteredSteps}
            filteredProgressPercent={filteredProgressPercent}
            readinessSummary={readinessSummary}
            checklistModules={checklistModules}
            currentStepId={currentStep.id}
            completedStepIds={controller.completedStepIds}
            openModuleId={openModuleId}
            onOpenModuleIdChange={setOpenModuleId}
            onStepSelect={handleStepSelect}
            tutorialTargetStepId={
              tutorialCallout?.focus === "first-module"
                ? firstVisibleChecklistStepId
                : null
            }
            headerControls={
              <WorkspaceAcceleratorCardNavControls
                runtimeActions={runtimeActions}
                runtimeSnapshot={runtimeSnapshot}
                tutorialCallout={tutorialCallout?.focus === "nav" ? tutorialCallout : null}
              />
            }
          />
        </div>

        {isModuleViewerOpen ? (
          <WorkspaceAcceleratorStepNodeCard
            variant="embedded"
            step={currentStep}
            stepIndex={controller.currentModuleStepIndex}
            stepTotal={Math.max(controller.currentModuleSteps.length, 1)}
            canGoPrevious={controller.canGoPrevious}
            canGoNext={controller.canGoNext}
            completed={controller.isCurrentStepCompleted}
            moduleCompleted={controller.isCurrentModuleCompleted}
            onPrevious={controller.goPrevious}
            onNext={controller.goNext}
            onComplete={handleCompleteModuleStep}
            onClose={handleCloseModuleViewer}
            tutorialCallout={
              tutorialCallout?.focus === "close-module" ? tutorialCallout : null
            }
          />
        ) : null}
      </div>
    </div>
  )
}
