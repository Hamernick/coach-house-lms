"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import Layers from "lucide-react/dist/esm/icons/layers"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
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
} from "../types"
import { WorkspaceAcceleratorCardChecklist } from "./workspace-accelerator-card-checklist"
import { WorkspaceAcceleratorCardProgressStrip } from "./workspace-accelerator-card-progress-strip"

type WorkspaceAcceleratorCardPanelProps = {
  input: WorkspaceAcceleratorCardInput
  onRuntimeChange?: (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => void
  onRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions
  ) => void
  onOpenStepNode?: (stepId?: string | null) => void
}

export function WorkspaceAcceleratorCardPanel({
  input,
  onRuntimeChange,
  onRuntimeActionsChange,
  onOpenStepNode,
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
  const stepHrefOverride = typeof controllerInput.linkHrefOverride === "string" && controllerInput.linkHrefOverride.trim().length > 0
    ? controllerInput.linkHrefOverride
    : null
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
    }),
    [
      runtimeStep,
      controller.canGoNext,
      controller.canGoPrevious,
      controller.currentIndex,
      controller.currentModuleCompletedCount,
      controller.isCurrentModuleCompleted,
      controller.currentModuleStepIndex,
      controller.currentModuleSteps.length,
      controller.isCurrentStepCompleted,
      controller.steps.length,
    ]
  )

  const runtimeActions = useMemo<WorkspaceAcceleratorCardRuntimeActions>(
    () => ({
      goPrevious: controller.goPrevious,
      goNext: controller.goNext,
      markCurrentStepComplete: controller.markCurrentStepComplete,
    }),
    [
      controller.goNext,
      controller.goPrevious,
      controller.markCurrentStepComplete,
    ]
  )
  runtimeActionsRef.current = runtimeActions

  const runtimeSnapshotSignature = useMemo(
    () =>
      JSON.stringify({
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
      }),
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
      }),
    [
      runtimeSnapshot.canGoNext,
      runtimeSnapshot.canGoPrevious,
      runtimeSnapshot.currentStep?.id,
      runtimeSnapshot.isCurrentStepCompleted,
      runtimeSnapshot.totalSteps,
    ],
  )

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
  const ActiveLessonGroupIcon = useMemo(() => {
    if (!selectedLessonGroup) return Layers
    return getTrackIcon(selectedLessonGroup.label)
  }, [selectedLessonGroup])
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
  const moduleCount = checklistModules.length
  const checklistModuleIds = useMemo(
    () => checklistModules.map((module) => module.id),
    [checklistModules],
  )
  const checklistModuleIdsSignature = useMemo(
    () => checklistModuleIds.join("|"),
    [checklistModuleIds],
  )

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

  const handleStepSelect = (step: WorkspaceAcceleratorCardStep) => {
    controller.goToStep(step.id)
    setOpenModuleId(step.moduleId)
    onOpenStepNode?.(step.id)
  }

  if (!currentStep) {
    return (
      <div className="flex min-h-0 flex-col gap-3 pb-1">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Accelerator lessons will appear here once your roadmap is available.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="self-start rounded-xl text-xs"
        >
          <Link href={fallbackAcceleratorHref}>Open accelerator</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-col gap-2 pb-1">
      <Select
        value={selectedLessonGroupKey}
        onValueChange={(nextValue) => {
          setLessonGroupFilter(nextValue)
          const nextGroup = lessonGroupOptions.find((option) => option.key === nextValue)
          const nextModuleId = nextGroup?.moduleIds[0]
          const nextStep = controller.steps.find((step) => step.moduleId === nextModuleId)
          if (!nextStep) return
          setOpenModuleId(nextModuleId ?? null)
          controller.goToStep(nextStep.id)
        }}
      >
        <SelectTrigger
          className="min-h-9 w-full text-left text-xs"
          multiline
          aria-label="Filter by lesson group"
        >
          <ActiveLessonGroupIcon
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <SelectValue placeholder="Select lesson group" />
        </SelectTrigger>
        <SelectContent align="start">
          {lessonGroupOptions.map((option) => (
            <SelectItem
              key={option.key}
              value={option.key}
              icon={
                (() => {
                  const OptionIcon = getTrackIcon(option.label)
                  return <OptionIcon className="h-4 w-4" aria-hidden />
                })()
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
          {moduleCount} {moduleCount === 1 ? "module" : "modules"}
        </span>
        <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
          {filteredSteps.length} {filteredSteps.length === 1 ? "step" : "steps"}
        </span>
      </div>

      <WorkspaceAcceleratorCardProgressStrip
        progressPercent={filteredProgressPercent}
        completedCount={filteredCompletedCount}
        totalCount={filteredSteps.length}
      />

      <WorkspaceAcceleratorCardChecklist
        modules={checklistModules}
        selectedLessonGroupLabel={selectedLessonGroup?.label ?? null}
        currentStepId={currentStep.id}
        completedStepIds={controller.completedStepIds}
        openModuleId={openModuleId}
        onOpenModuleIdChange={setOpenModuleId}
        onStepSelect={handleStepSelect}
      />
    </div>
  )
}
