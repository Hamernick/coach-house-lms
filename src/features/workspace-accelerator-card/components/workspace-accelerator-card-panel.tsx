"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react"
import { cn } from "@/lib/utils"
import type { RoadmapSection } from "@/lib/roadmap"

import {
  areWorkspaceAcceleratorRuntimeSnapshotsEqual,
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
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import {
  completeWorkspaceAcceleratorTutorialPreview,
  shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen,
  shouldWorkspaceAcceleratorSyncModuleViewerSize,
  shouldWorkspaceAcceleratorTutorialAdvanceFromFooterContinue,
  useWorkspaceAcceleratorTutorialViewerState,
  WorkspaceAcceleratorCardEmptyState,
  WorkspaceAcceleratorCardFullscreenRail,
  WorkspaceAcceleratorCardSidebar,
  useModuleViewerSizeSync,
} from "./workspace-accelerator-card-panel-support"
import { canWorkspaceAcceleratorTutorialActivateStep } from "./workspace-accelerator-card-tutorial-guards"
import { useWorkspaceAcceleratorLessonGroupState } from "./workspace-accelerator-card-panel-lesson-groups"
import {
  resolveWorkspaceAcceleratorModuleStepNavigation,
  resolveWorkspaceAcceleratorPlaceholderVideoUrl,
} from "./workspace-accelerator-module-navigation"
import { WorkspaceAcceleratorStepNodeCard } from "./workspace-accelerator-step-node-card"

type WorkspaceAcceleratorCardPanelProps = {
  input: WorkspaceAcceleratorCardInput
  roadmapSections?: RoadmapSection[]
  roadmapBasePath?: string
  presentationMode?: "embedded" | "fullscreen-route"
  initialModuleViewerOpen?: boolean
  initialOpenModuleId?: string | null
  onRuntimeChange?: (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => void
  onRuntimeActionsChange?: (actions: WorkspaceAcceleratorCardRuntimeActions) => void
  onRequestOpenStep?: (args: {
    step: WorkspaceAcceleratorCardStep
    selectedLessonGroupKey: string | null
  }) => boolean | void
  onModuleViewerClose?: () => void
  tutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  tutorialMode?: "module-preview" | null
  onTutorialActionComplete?: (mode?: "complete" | "complete-and-advance") => void
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
    placeholderVideoUrl: string | null
    readinessSummary: WorkspaceAcceleratorCardInput["readinessSummary"]
    checklistModuleCount: number
    filteredStepCount: number
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
    placeholderVideoUrl,
    readinessSummary,
    checklistModuleCount,
    filteredStepCount,
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
    placeholderVideoUrl,
    readinessSummary: readinessSummary ?? null,
    checklistModuleCount,
    filteredStepCount,
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
    placeholderVideoUrl: runtimeSnapshot.placeholderVideoUrl ?? null,
    readinessScore: runtimeSnapshot.readinessSummary?.score ?? null,
    checklistModuleCount: runtimeSnapshot.checklistModuleCount ?? 0,
    filteredStepCount: runtimeSnapshot.filteredStepCount ?? 0,
  })
}

function buildWorkspaceAcceleratorControllerInput(input: WorkspaceAcceleratorCardInput): WorkspaceAcceleratorCardInput {
  const visibleSteps = input.steps.filter(
    (step) =>
      (step.stepKind !== "lesson" ||
        Boolean(step.moduleContext?.workspaceOnboarding)) &&
      step.stepKind !== "complete",
  )
  if (visibleSteps.length === input.steps.length) return input
  const visibleStepIds = new Set(visibleSteps.map((step) => step.id))
  const nextInitialCurrentStepId =
    input.initialCurrentStepId && visibleStepIds.has(input.initialCurrentStepId)
      ? input.initialCurrentStepId
      : visibleSteps[0]?.id ?? null

  return {
    ...input,
    steps: visibleSteps,
    initialCurrentStepId: nextInitialCurrentStepId,
    initialCompletedStepIds: (input.initialCompletedStepIds ?? []).filter(
      (stepId) => visibleStepIds.has(stepId),
    ),
  }
}

function useWorkspaceAcceleratorRuntimeSync({
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
  onRuntimeActionsChange?: (actions: WorkspaceAcceleratorCardRuntimeActions) => void
}) {
  const lastRuntimeSnapshotRef =
    useRef<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const lastRuntimeSnapshotSignatureRef = useRef<string | null>(null)
  const lastRuntimeActionsSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      areWorkspaceAcceleratorRuntimeSnapshotsEqual(
        lastRuntimeSnapshotRef.current,
        runtimeSnapshot,
      )
    ) {
      return
    }
    if (lastRuntimeSnapshotSignatureRef.current === runtimeSnapshotSignature) return
    lastRuntimeSnapshotRef.current = runtimeSnapshot
    lastRuntimeSnapshotSignatureRef.current = runtimeSnapshotSignature
    onRuntimeChange?.(runtimeSnapshot)
  }, [onRuntimeChange, runtimeSnapshot, runtimeSnapshotSignature])

  useEffect(() => {
    if (lastRuntimeActionsSignatureRef.current === runtimeActionsSignature) return
    lastRuntimeActionsSignatureRef.current = runtimeActionsSignature
    onRuntimeActionsChange?.(runtimeActions)
  }, [onRuntimeActionsChange, runtimeActions, runtimeActionsSignature])
}

// eslint-disable-next-line max-lines-per-function
export function WorkspaceAcceleratorCardPanel({
  input,
  roadmapSections = [],
  roadmapBasePath = "/workspace/roadmap",
  presentationMode = "embedded",
  initialModuleViewerOpen = false,
  initialOpenModuleId = null,
  onRuntimeChange,
  onRuntimeActionsChange,
  onRequestOpenStep,
  onModuleViewerClose,
  tutorialCallout = null,
  tutorialInteractionPolicy = null,
  tutorialMode = null,
  onTutorialActionComplete,
}: WorkspaceAcceleratorCardPanelProps) {
  const router = useRouter()
  const controllerInput = useMemo<WorkspaceAcceleratorCardInput>(
    () => buildWorkspaceAcceleratorControllerInput(input),
    [input],
  )
  const controller = useWorkspaceAcceleratorCardController(controllerInput)
  const currentStep = controller.currentStep
  const stepHrefOverride = typeof controllerInput.linkHrefOverride === "string" && controllerInput.linkHrefOverride.trim().length > 0 ? controllerInput.linkHrefOverride : null
  const fallbackAcceleratorHref =
    stepHrefOverride ??
    (presentationMode === "fullscreen-route" ? "/workspace" : "/accelerator")
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

  const [openModuleId, setOpenModuleId] = useState<string | null>(initialOpenModuleId)
  const [isModuleViewerOpen, setIsModuleViewerOpen] = useState(
    presentationMode === "fullscreen-route" || initialModuleViewerOpen)
  const previousCurrentModuleIdRef = useRef<string | null>(null)
  const previousTutorialManagedViewerOpenRef = useRef(false)
  const pendingFirstModuleTutorialAdvanceRef = useRef(false)
  const {
    selectedLessonGroup,
    selectedLessonGroupKey,
    lessonGroupSummaries,
    checklistModules,
    filteredSteps,
    filteredProgressPercent,
    firstVisibleChecklistStepId,
    handleLessonGroupChange,
  } = useWorkspaceAcceleratorLessonGroupState({
    controller,
    currentStep,
    tutorialInteractionPolicy,
    setOpenModuleId,
  })
  const placeholderVideoUrl = useMemo(
    () =>
      resolveWorkspaceAcceleratorPlaceholderVideoUrl({
        steps: controller.steps,
        currentStepId: currentStep?.id,
      }),
    [controller.steps, currentStep?.id],
  )
  const moduleStepNavigation = useMemo(
    () =>
      resolveWorkspaceAcceleratorModuleStepNavigation({
        steps: controller.steps,
        currentModuleSteps: controller.currentModuleSteps,
        currentStepId: currentStep?.id,
      }),
    [controller.currentModuleSteps, controller.steps, currentStep?.id],
  )
  const goPreviousWithinModule = useCallback(() => {
    if (!moduleStepNavigation.previousStepId) return
    controller.goToStep(moduleStepNavigation.previousStepId)
  }, [controller, moduleStepNavigation.previousStepId])
  const goNextWithinModule = useCallback(() => {
    if (!moduleStepNavigation.nextStepId) return
    controller.goToStep(moduleStepNavigation.nextStepId)
  }, [controller, moduleStepNavigation.nextStepId])
  const runtimeActions = useMemo<WorkspaceAcceleratorCardRuntimeActions>(
    () => ({
      goPrevious: goPreviousWithinModule,
      goNext: goNextWithinModule,
      markCurrentStepComplete: controller.markCurrentStepComplete,
      selectLessonGroup: handleLessonGroupChange,
    }),
    [
      handleLessonGroupChange,
      goNextWithinModule,
      goPreviousWithinModule,
      controller.markCurrentStepComplete,
    ],
  )
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
        placeholderVideoUrl,
        readinessSummary: controllerInput.readinessSummary,
        checklistModuleCount: checklistModules.length,
        filteredStepCount: filteredSteps.length,
      }),
    [
      controller,
      controllerInput.readinessSummary,
      firstVisibleChecklistStepId,
      filteredSteps.length,
      isModuleViewerOpen,
      lessonGroupSummaries,
      checklistModules.length,
      openModuleId,
      placeholderVideoUrl,
      runtimeStep,
      selectedLessonGroup?.label,
      selectedLessonGroupKey,
    ],
  )
  const runtimeSnapshotSignature = useMemo(() => buildAcceleratorRuntimeSnapshotSignature(runtimeSnapshot), [runtimeSnapshot])
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
  const checklistModuleIds = useMemo(() => checklistModules.map((module) => module.id), [checklistModules])
  const checklistModuleIdsSignature = useMemo(() => checklistModuleIds.join("|"), [checklistModuleIds])
  const { onSizeChange, size, readinessSummary } = controllerInput
  const shouldSyncModuleViewerSize = shouldWorkspaceAcceleratorSyncModuleViewerSize({
    tutorialCallout,
    tutorialMode,
  })
  const showMilestoneTooltips = tutorialInteractionPolicy === null

  useModuleViewerSizeSync({
    size,
    onSizeChange,
    isModuleViewerOpen,
    enabled: shouldSyncModuleViewerSize,
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
    const nextModuleId =
      checklistModules
        .flatMap((module) => module.steps)
        .find((step) => step.id === firstVisibleChecklistStepId)?.moduleId ??
      checklistModules[0]?.id ??
      null
    if (!nextModuleId) return
    setOpenModuleId((previous) => (previous === nextModuleId ? previous : nextModuleId))
  }, [checklistModules, firstVisibleChecklistStepId, tutorialCallout?.focus])

  useWorkspaceAcceleratorTutorialViewerState({
    currentModuleId: currentStep?.moduleId ?? null,
    tutorialCallout,
    tutorialMode,
    setIsModuleViewerOpen,
    setOpenModuleId,
    previousTutorialManagedViewerOpenRef,
  })

  useWorkspaceAcceleratorRuntimeSync({
    runtimeSnapshot,
    runtimeSnapshotSignature,
    runtimeActions,
    runtimeActionsSignature,
    onRuntimeChange,
    onRuntimeActionsChange,
  })

  useEffect(() => {
    if (
      !shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen({
        tutorialCallout,
        pendingAdvance: pendingFirstModuleTutorialAdvanceRef.current,
        isModuleViewerOpen,
        currentStepId: currentStep?.id ?? null,
        tutorialTargetStepId: firstVisibleChecklistStepId,
      })
    ) {
      if (tutorialCallout?.focus !== "first-module") {
        pendingFirstModuleTutorialAdvanceRef.current = false
      }
      return
    }

    pendingFirstModuleTutorialAdvanceRef.current = false
    onTutorialActionComplete?.("complete-and-advance")
  }, [
    currentStep?.id,
    firstVisibleChecklistStepId,
    isModuleViewerOpen,
    onTutorialActionComplete,
    tutorialCallout,
  ])

  const handleCloseModuleViewer = () => {
    if (onModuleViewerClose) {
      onModuleViewerClose()
      return
    }
    setIsModuleViewerOpen(false)
    if (tutorialCallout?.focus === "close-module") {
      onTutorialActionComplete?.("complete-and-advance")
    }
  }

  const handleCompleteModuleStep = () => {
    if (
      shouldWorkspaceAcceleratorTutorialAdvanceFromFooterContinue(tutorialMode)
    ) {
      completeWorkspaceAcceleratorTutorialPreview({
        setIsModuleViewerOpen,
        previousTutorialManagedViewerOpenRef,
        onTutorialActionComplete,
      })
      return
    }
    controller.markCurrentStepComplete()
    if (moduleStepNavigation.nextStepId) {
      controller.goToStep(moduleStepNavigation.nextStepId)
    }
    handleCloseModuleViewer()
  }

  const handleStepSelect = (step: WorkspaceAcceleratorCardStep) => {
    if (
      !canWorkspaceAcceleratorTutorialActivateStep({
        tutorialInteractionPolicy,
        stepId: step.id,
        moduleId: step.moduleId,
      })
    ) {
      return
    }

    const canRequestExternalOpen =
      Boolean(onRequestOpenStep) &&
      (presentationMode === "fullscreen-route" ||
        tutorialInteractionPolicy === null)
    const openRequestResult = canRequestExternalOpen
      ? onRequestOpenStep?.({
          step,
          selectedLessonGroupKey: selectedLessonGroupKey || null,
        })
      : undefined

    if (
      presentationMode === "embedded" &&
      tutorialInteractionPolicy === null &&
      onRequestOpenStep &&
      openRequestResult !== false
    ) {
      return
    }

    controller.goToStep(step.id)
    setOpenModuleId(step.moduleId)
    setIsModuleViewerOpen(true)
    if (
      tutorialCallout?.focus === "first-module" &&
      step.id === firstVisibleChecklistStepId
    ) {
      pendingFirstModuleTutorialAdvanceRef.current = true
    }
  }

  if (!currentStep) {
    return <WorkspaceAcceleratorCardEmptyState href={fallbackAcceleratorHref} />
  }

  const fullscreenEmbedded = presentationMode === "fullscreen-route"
  const renderSidebarInline = !fullscreenEmbedded
  const sidebarProps = {
    selectedLessonGroup,
    tutorialCallout,
    tutorialInteractionPolicy,
    filteredProgressPercent,
    readinessSummary,
    showMilestoneTooltips,
    checklistModules,
    currentStepId: currentStep.id,
    completedStepIds: controller.completedStepIds,
    openModuleId,
    onOpenModuleIdChange: setOpenModuleId,
    onStepSelect: handleStepSelect,
    tutorialTargetStepId:
      tutorialCallout?.focus === "first-module"
        ? firstVisibleChecklistStepId
        : null,
  } satisfies ComponentProps<typeof WorkspaceAcceleratorCardSidebar>

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      {!renderSidebarInline ? (
        <WorkspaceAcceleratorCardFullscreenRail
          {...sidebarProps}
          lessonGroupOptions={lessonGroupSummaries}
          selectedLessonGroupKey={selectedLessonGroupKey}
          viewerOpen={isModuleViewerOpen}
          onLessonGroupChange={handleLessonGroupChange}
          roadmapSections={roadmapSections}
          roadmapBasePath={roadmapBasePath}
        />
      ) : null}
      <div
        className={cn(
          "grid min-h-0 flex-1",
          fullscreenEmbedded ? "gap-0" : "gap-3",
          renderSidebarInline && isModuleViewerOpen
            ? "grid-cols-[minmax(250px,290px)_minmax(0,1fr)]"
            : "grid-cols-1",
        )}
      >
        {renderSidebarInline ? (
          <div className="flex min-h-0 flex-col gap-2">
            <WorkspaceAcceleratorCardSidebar {...sidebarProps} />
          </div>
        ) : null}

        {isModuleViewerOpen ? (
          <WorkspaceAcceleratorStepNodeCard
            variant="embedded"
            step={currentStep}
            placeholderVideoUrl={placeholderVideoUrl}
            stepIndex={controller.currentModuleStepIndex}
            stepTotal={Math.max(controller.currentModuleSteps.length, 1)}
            canGoPrevious={moduleStepNavigation.canGoPrevious}
            canGoNext={moduleStepNavigation.canGoNext}
            completed={controller.isCurrentStepCompleted}
            moduleCompleted={controller.isCurrentModuleCompleted}
            onPrevious={goPreviousWithinModule}
            onNext={goNextWithinModule}
            onComplete={handleCompleteModuleStep}
            onClose={handleCloseModuleViewer}
            tutorialCallout={
              tutorialCallout?.focus === "close-module" ? tutorialCallout : null
            }
            tutorialInteractionPolicy={tutorialInteractionPolicy}
            onWorkspaceOnboardingSubmit={input.onWorkspaceOnboardingSubmit}
            immersive={fullscreenEmbedded}
          />
        ) : null}
      </div>
    </div>
  )
}
