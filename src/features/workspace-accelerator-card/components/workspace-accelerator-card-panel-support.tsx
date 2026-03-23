"use client"

import Link from "next/link"
import {
  useEffect,
  useRef,
} from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupOptions,
} from "../lib"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import { WorkspaceAcceleratorCardChecklist } from "./workspace-accelerator-card-checklist"
import { WorkspaceAcceleratorCardProgressStrip } from "./workspace-accelerator-card-progress-strip"

export { WorkspaceAcceleratorHeaderPicker } from "./workspace-accelerator-header-picker"
export { resolveWorkspaceAcceleratorHeaderPickerScrollDistance } from "./workspace-accelerator-header-picker-overflow"

export function WorkspaceAcceleratorCardEmptyState({
  href,
}: {
  href: string
}) {
  return (
    <div className="flex min-h-0 flex-col gap-3 pb-1">
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs">
          Accelerator classes will appear here once your roadmap is ready.
        </p>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="self-start rounded-xl text-xs"
      >
        <Link href={href}>Open accelerator</Link>
      </Button>
    </div>
  )
}

export function useModuleViewerSizeSync({
  size,
  onSizeChange,
  isModuleViewerOpen,
  enabled = true,
}: {
  size: WorkspaceAcceleratorCardInput["size"]
  onSizeChange: WorkspaceAcceleratorCardInput["onSizeChange"]
  isModuleViewerOpen: boolean
  enabled?: boolean
}) {
  const collapsedSizeBeforeViewerRef = useRef<
    WorkspaceAcceleratorCardInput["size"] | null
  >(null)

  useEffect(() => {
    if (!onSizeChange) return

    if (!enabled) {
      const previousCollapsedSize = collapsedSizeBeforeViewerRef.current
      collapsedSizeBeforeViewerRef.current = null
      if (previousCollapsedSize && size !== previousCollapsedSize) {
        onSizeChange(previousCollapsedSize)
      }
      return
    }

    if (isModuleViewerOpen) {
      if (collapsedSizeBeforeViewerRef.current === null) {
        collapsedSizeBeforeViewerRef.current = size
      }
      if (size !== "lg") {
        onSizeChange("lg")
      }
      return
    }

    const previousCollapsedSize = collapsedSizeBeforeViewerRef.current
    if (!previousCollapsedSize) {
      const fallbackCollapsedSize =
        resolveWorkspaceAcceleratorCollapsedCardSize({
          currentSize: size,
          previousCollapsedSize: null,
        })
      if (fallbackCollapsedSize !== size) {
        onSizeChange(fallbackCollapsedSize)
      }
      return
    }
    collapsedSizeBeforeViewerRef.current = null
    if (size !== previousCollapsedSize) {
      onSizeChange(previousCollapsedSize)
    }
  }, [enabled, isModuleViewerOpen, onSizeChange, size])
}

export function resolveWorkspaceAcceleratorCollapsedCardSize({
  currentSize,
  previousCollapsedSize,
}: {
  currentSize: WorkspaceAcceleratorCardInput["size"]
  previousCollapsedSize: WorkspaceAcceleratorCardInput["size"] | null
}) {
  if (previousCollapsedSize) {
    return previousCollapsedSize
  }

  return currentSize === "lg" ? "sm" : currentSize
}

export function shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
  tutorialCallout,
  tutorialMode = null,
}: {
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  tutorialMode?: "module-preview" | null
}) {
  return tutorialCallout?.focus === "close-module" || tutorialMode === "module-preview"
}

export function shouldWorkspaceAcceleratorTutorialAdvanceFromFooterContinue(
  tutorialMode?: "module-preview" | null,
) {
  return tutorialMode === "module-preview"
}

export function shouldWorkspaceAcceleratorSyncModuleViewerSize({
  tutorialCallout,
  tutorialMode = null,
}: {
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  tutorialMode?: "module-preview" | null
}) {
  return !shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
    tutorialCallout,
    tutorialMode,
  })
}

export function shouldWorkspaceAcceleratorTutorialAdvanceAfterStepOpen({
  tutorialCallout,
  pendingAdvance,
  isModuleViewerOpen,
  currentStepId,
  tutorialTargetStepId,
}: {
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  pendingAdvance: boolean
  isModuleViewerOpen: boolean
  currentStepId: string | null
  tutorialTargetStepId: string | null
}) {
  return (
    pendingAdvance &&
    tutorialCallout?.focus === "first-module" &&
    isModuleViewerOpen &&
    currentStepId !== null &&
    tutorialTargetStepId !== null &&
    currentStepId === tutorialTargetStepId
  )
}

export function completeWorkspaceAcceleratorTutorialPreview({
  setIsModuleViewerOpen,
  previousTutorialManagedViewerOpenRef,
  onTutorialActionComplete,
}: {
  setIsModuleViewerOpen: (open: boolean) => void
  previousTutorialManagedViewerOpenRef: { current: boolean }
  onTutorialActionComplete?: (
    mode?: "complete" | "complete-and-advance",
  ) => void
}) {
  setIsModuleViewerOpen(false)
  previousTutorialManagedViewerOpenRef.current = false
  onTutorialActionComplete?.("complete-and-advance")
}

export function useWorkspaceAcceleratorTutorialViewerState({
  currentModuleId,
  tutorialCallout,
  tutorialMode,
  setIsModuleViewerOpen,
  setOpenModuleId,
  previousTutorialManagedViewerOpenRef,
}: {
  currentModuleId: string | null
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  tutorialMode?: "module-preview" | null
  setIsModuleViewerOpen: (open: boolean) => void
  setOpenModuleId: (
    update: string | null | ((previous: string | null) => string | null),
  ) => void
  previousTutorialManagedViewerOpenRef: { current: boolean }
}) {
  useEffect(() => {
    const shouldKeepTutorialViewerOpen =
      shouldWorkspaceAcceleratorTutorialKeepModuleViewerOpen({
        tutorialCallout,
        tutorialMode,
      })

    if (shouldKeepTutorialViewerOpen) {
      setIsModuleViewerOpen(true)
      setOpenModuleId((previous) =>
        previous === currentModuleId ? previous : currentModuleId,
      )
      previousTutorialManagedViewerOpenRef.current = true
      return
    }

    if (previousTutorialManagedViewerOpenRef.current) {
      setIsModuleViewerOpen(false)
      previousTutorialManagedViewerOpenRef.current = false
    }
  }, [
    currentModuleId,
    previousTutorialManagedViewerOpenRef,
    setIsModuleViewerOpen,
    setOpenModuleId,
    tutorialCallout,
    tutorialMode,
  ])
}

export function WorkspaceAcceleratorCardSidebar({
  selectedLessonGroup,
  tutorialCallout,
  tutorialInteractionPolicy = null,
  filteredProgressPercent,
  readinessSummary,
  showMilestoneTooltips = true,
  checklistModules,
  currentStepId,
  completedStepIds,
  openModuleId,
  onOpenModuleIdChange,
  onStepSelect,
  tutorialTargetStepId,
}: {
  selectedLessonGroup: ReturnType<
    typeof buildWorkspaceAcceleratorLessonGroupOptions
  >[number] | null
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  filteredProgressPercent: number
  readinessSummary: WorkspaceAcceleratorCardInput["readinessSummary"]
  showMilestoneTooltips?: boolean
  checklistModules: ReturnType<typeof buildWorkspaceAcceleratorChecklistModules>
  currentStepId: string
  completedStepIds: string[]
  openModuleId: string | null
  onOpenModuleIdChange: (next: string | null) => void
  onStepSelect: (step: WorkspaceAcceleratorCardStep) => void
  tutorialTargetStepId: string | null
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2.5">
      <WorkspaceAcceleratorCardProgressStrip
        progressPercent={filteredProgressPercent}
        readinessSummary={readinessSummary}
        showMilestoneTooltips={showMilestoneTooltips}
        tutorialCallout={
          tutorialCallout?.focus === "progress" ? tutorialCallout : null
        }
      />

      <WorkspaceAcceleratorCardChecklist
        modules={checklistModules}
        selectedLessonGroupLabel={selectedLessonGroup?.label ?? null}
        currentStepId={currentStepId}
        completedStepIds={completedStepIds}
        openModuleId={openModuleId}
        onOpenModuleIdChange={onOpenModuleIdChange}
        onStepSelect={onStepSelect}
        tutorialCallout={
          tutorialCallout?.focus === "first-module" ? tutorialCallout : null
        }
        tutorialTargetStepId={tutorialTargetStepId}
        tutorialInteractionPolicy={tutorialInteractionPolicy}
      />
    </div>
  )
}

export function WorkspaceAcceleratorHeaderSummary({
  moduleCount,
  stepCount,
}: {
  moduleCount: number
  stepCount: number
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground tabular-nums">
        {moduleCount} {moduleCount === 1 ? "module" : "modules"}
      </span>
      <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground tabular-nums">
        {stepCount} {stepCount === 1 ? "step" : "steps"}
      </span>
    </div>
  )
}
