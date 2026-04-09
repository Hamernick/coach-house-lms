"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { CardContent } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import {
  areWorkspaceAcceleratorRuntimeSnapshotsEqual,
  buildWorkspaceAcceleratorRuntimeActionsSignature,
  canWorkspaceAcceleratorTutorialActivateStep,
  normalizeWorkspaceAcceleratorCardInput,
  useWorkspaceAcceleratorCardController,
  useWorkspaceAcceleratorLessonGroupState,
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "@/features/workspace-accelerator-card"
import { resolveRoadmapSections, type RoadmapSection } from "@/lib/roadmap"

import {
  ExecutionAcceleratorPane,
  ExecutionRoadmapPane,
  resolveRoadmapRowTone,
} from "./workspace-board-node-tool-card-execution-content"

type WorkspaceBoardExecutionCardProps = {
  profile: Parameters<typeof resolveRoadmapSections>[0]
  acceleratorInput: WorkspaceAcceleratorCardInput
  onRuntimeChange?: (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => void
  onRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions,
  ) => void
  onRequestOpenStep?: (args: {
    step: WorkspaceAcceleratorCardStep
    selectedLessonGroupKey: string | null
  }) => boolean | void
  tutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  onTutorialActionComplete?: (
    mode?: "complete" | "complete-and-advance",
  ) => void
}

type WorkspaceBoardExecutionTab = "roadmap" | "accelerator"

export type { WorkspaceBoardExecutionTab }

function buildExecutionRuntimeSnapshotSignature(
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
    selectedLessonGroupKey: runtimeSnapshot.selectedLessonGroupKey ?? null,
    selectedLessonGroupLabel: runtimeSnapshot.selectedLessonGroupLabel ?? null,
    lessonGroupOptions:
      runtimeSnapshot.lessonGroupOptions?.map((option) => option.key) ?? [],
    firstVisibleChecklistStepId: runtimeSnapshot.firstVisibleChecklistStepId ?? null,
    isModuleViewerOpen: runtimeSnapshot.isModuleViewerOpen ?? false,
    openModuleId: runtimeSnapshot.openModuleId ?? null,
    checklistModuleCount: runtimeSnapshot.checklistModuleCount ?? 0,
    filteredStepCount: runtimeSnapshot.filteredStepCount ?? 0,
    readinessScore: runtimeSnapshot.readinessSummary?.score ?? null,
  })
}

export function WorkspaceBoardExecutionCard({
  profile,
  acceleratorInput,
  onRuntimeChange,
  onRuntimeActionsChange,
  onRequestOpenStep,
  tutorialCallout = null,
  tutorialInteractionPolicy = null,
}: WorkspaceBoardExecutionCardProps) {
  const router = useRouter()
  const roadmapSections = useMemo(() => resolveRoadmapSections(profile), [profile])
  const normalizedAcceleratorInput = useMemo(
    () => normalizeWorkspaceAcceleratorCardInput(acceleratorInput),
    [acceleratorInput],
  )
  const controller = useWorkspaceAcceleratorCardController(
    normalizedAcceleratorInput,
  )
  const currentStep = controller.currentStep
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const lastRuntimeSnapshotRef =
    useRef<WorkspaceAcceleratorCardRuntimeSnapshot | null>(null)
  const lastRuntimeSnapshotSignatureRef = useRef<string | null>(null)
  const lastRuntimeActionsSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    const nextModuleId = currentStep?.moduleId ?? null
    setOpenModuleId((previous) =>
      previous === nextModuleId ? previous : nextModuleId,
    )
  }, [currentStep?.moduleId])

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

  const stepHrefOverride = normalizedAcceleratorInput.linkHrefOverride ?? null
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
  const runtimeActions = useMemo<WorkspaceAcceleratorCardRuntimeActions>(
    () => ({
      goPrevious: controller.goPrevious,
      goNext: controller.goNext,
      markCurrentStepComplete: controller.markCurrentStepComplete,
      selectLessonGroup: handleLessonGroupChange,
    }),
    [
      controller.goNext,
      controller.goPrevious,
      controller.markCurrentStepComplete,
      handleLessonGroupChange,
    ],
  )
  const runtimeSnapshot = useMemo<WorkspaceAcceleratorCardRuntimeSnapshot>(
    () => ({
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
      selectedLessonGroupLabel: selectedLessonGroup?.label ?? null,
      lessonGroupOptions: lessonGroupSummaries,
      firstVisibleChecklistStepId,
      isModuleViewerOpen: false,
      openModuleId,
      readinessSummary: normalizedAcceleratorInput.readinessSummary ?? null,
      checklistModuleCount: checklistModules.length,
      filteredStepCount: filteredSteps.length,
    }),
    [
      controller.canGoNext,
      controller.canGoPrevious,
      controller.currentIndex,
      controller.currentModuleCompletedCount,
      controller.currentModuleStepIndex,
      controller.currentModuleSteps.length,
      controller.isCurrentModuleCompleted,
      controller.isCurrentStepCompleted,
      controller.steps.length,
      filteredSteps.length,
      firstVisibleChecklistStepId,
      lessonGroupSummaries,
      checklistModules.length,
      normalizedAcceleratorInput.readinessSummary,
      openModuleId,
      runtimeStep,
      selectedLessonGroup?.label,
      selectedLessonGroupKey,
    ],
  )
  const runtimeSnapshotSignature = useMemo(
    () => buildExecutionRuntimeSnapshotSignature(runtimeSnapshot),
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
      lessonGroupSummaries.length,
      runtimeSnapshot.canGoNext,
      runtimeSnapshot.canGoPrevious,
      runtimeSnapshot.currentStep?.id,
      runtimeSnapshot.isCurrentStepCompleted,
      runtimeSnapshot.totalSteps,
      selectedLessonGroupKey,
    ],
  )

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

  const roadmapDoneCount = useMemo(
    () =>
      roadmapSections.filter((section) => resolveRoadmapRowTone(section.status) === "done")
        .length,
    [roadmapSections],
  )
  const roadmapProgressPercent =
    roadmapSections.length === 0
      ? 0
      : Math.round((roadmapDoneCount / roadmapSections.length) * 100)
  const acceleratorCompletedStepIds = useMemo(
    () => new Set(controller.completedStepIds),
    [controller.completedStepIds],
  )
  const acceleratorDoneCount = useMemo(
    () =>
      filteredSteps.filter((step) => acceleratorCompletedStepIds.has(step.id)).length,
    [acceleratorCompletedStepIds, filteredSteps],
  )

  const handleOpenRoadmapSection = useCallback(
    (section: RoadmapSection) => {
      router.push(`/workspace/roadmap/${section.slug}`)
    },
    [router],
  )
  const handleOpenAcceleratorStep = useCallback(
    (step: WorkspaceAcceleratorCardStep) => {
      if (
        !canWorkspaceAcceleratorTutorialActivateStep({
          tutorialInteractionPolicy,
          stepId: step.id,
          moduleId: step.moduleId,
        })
      ) {
        return
      }

      const handledExternally = onRequestOpenStep?.({
        step,
        selectedLessonGroupKey: selectedLessonGroupKey || null,
      })
      if (onRequestOpenStep && handledExternally !== false) {
        return
      }

      controller.goToStep(step.id)

      const nextHref = stepHrefOverride ?? step.href
      if (nextHref.startsWith("/")) {
        router.push(nextHref)
      }
    },
    [
      controller,
      onRequestOpenStep,
      router,
      selectedLessonGroupKey,
      stepHrefOverride,
      tutorialInteractionPolicy,
    ],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      
        <TabsContent
          value="roadmap"
          asChild
          className="min-h-0 min-w-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <CardContent className="nodrag nopan flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-0 pt-0 pb-0 first:pt-4">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <ExecutionRoadmapPane
                sections={roadmapSections}
                doneCount={roadmapDoneCount}
                progressPercent={roadmapProgressPercent}
                onOpenSection={handleOpenRoadmapSection}
              />
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent
          value="accelerator"
          asChild
          className="min-h-0 min-w-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <CardContent className="nodrag nopan flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-0 pt-0 pb-0 first:pt-4">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <ExecutionAcceleratorPane
                selectedLessonGroupLabel={selectedLessonGroup?.label ?? null}
                doneCount={acceleratorDoneCount}
                totalCount={filteredSteps.length}
                progressPercent={filteredProgressPercent}
                checklistModules={checklistModules}
                currentStepId={currentStep?.id ?? null}
                completedStepIds={acceleratorCompletedStepIds}
                onOpenStep={handleOpenAcceleratorStep}
              />
            </div>
          </CardContent>
        </TabsContent>
    </div>
  )
}
