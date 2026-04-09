"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import { RoadmapNavigatorSection } from "@/components/roadmap/roadmap-navigator-section"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RoadmapSection } from "@/lib/roadmap"
import { cn } from "@/lib/utils"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupOptions,
} from "../lib"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorLessonGroupSummary,
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import { WorkspaceAcceleratorCardChecklist } from "./workspace-accelerator-card-checklist"
import { WorkspaceAcceleratorCardProgressStrip } from "./workspace-accelerator-card-progress-strip"
import { WorkspaceAcceleratorHeaderPicker } from "./workspace-accelerator-header-picker"

export { WorkspaceAcceleratorHeaderPicker } from "./workspace-accelerator-header-picker"
export { resolveWorkspaceAcceleratorHeaderPickerScrollDistance } from "./workspace-accelerator-header-picker-overflow"
type WorkspaceAcceleratorRailView = "roadmap" | "accelerator"

type WorkspaceAcceleratorCardSidebarProps = {
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
  headerControls?: ReactNode
  showChecklist?: boolean
}

const WORKSPACE_ACCELERATOR_RAIL_PANEL_EASE = [0.25, 1, 0.5, 1] as const

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
  headerControls = null,
  showChecklist = true,
}: WorkspaceAcceleratorCardSidebarProps) {
  return (
    <div className="flex min-h-full flex-col gap-2.5">
      {headerControls ? <div className="w-full">{headerControls}</div> : null}

      <WorkspaceAcceleratorCardProgressStrip
        progressPercent={filteredProgressPercent}
        readinessSummary={readinessSummary}
        showMilestoneTooltips={showMilestoneTooltips}
        tutorialCallout={
          tutorialCallout?.focus === "progress" ? tutorialCallout : null
        }
      />

      {showChecklist ? (
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
      ) : null}
    </div>
  )
}

export function WorkspaceAcceleratorCardFullscreenRail({
  lessonGroupOptions,
  selectedLessonGroupKey,
  onLessonGroupChange,
  viewerOpen = false,
  roadmapSections = [],
  roadmapBasePath = "/workspace/roadmap",
  ...sidebarProps
}: WorkspaceAcceleratorCardSidebarProps & {
  lessonGroupOptions: WorkspaceAcceleratorLessonGroupSummary[]
  selectedLessonGroupKey: string
  onLessonGroupChange: (nextLessonGroupKey: string) => void
  viewerOpen?: boolean
  roadmapSections?: RoadmapSection[]
  roadmapBasePath?: string
}) {
  return (
    <RightRailSlot priority={20}>
      <WorkspaceAcceleratorCardFullscreenRailContent
        {...sidebarProps}
        lessonGroupOptions={lessonGroupOptions}
        selectedLessonGroupKey={selectedLessonGroupKey}
        onLessonGroupChange={onLessonGroupChange}
        viewerOpen={viewerOpen}
        roadmapSections={roadmapSections}
        roadmapBasePath={roadmapBasePath}
      />
    </RightRailSlot>
  )
}

export function WorkspaceAcceleratorCardFullscreenRailContent({
  lessonGroupOptions,
  selectedLessonGroupKey,
  onLessonGroupChange,
  viewerOpen = false,
  roadmapSections = [],
  roadmapBasePath = "/workspace/roadmap",
  initialView = "accelerator",
  ...sidebarProps
}: WorkspaceAcceleratorCardSidebarProps & {
  lessonGroupOptions: WorkspaceAcceleratorLessonGroupSummary[]
  selectedLessonGroupKey: string
  onLessonGroupChange: (nextLessonGroupKey: string) => void
  viewerOpen?: boolean
  roadmapSections?: RoadmapSection[]
  roadmapBasePath?: string
  initialView?: WorkspaceAcceleratorRailView
}) {
  const hasRoadmap = roadmapSections.length > 0
  const prefersReducedMotion = useReducedMotion()
  const [activeView, setActiveView] =
    useState<WorkspaceAcceleratorRailView>(initialView)

  useEffect(() => {
    if (sidebarProps.tutorialInteractionPolicy && activeView !== "accelerator") {
      setActiveView("accelerator")
    }
  }, [activeView, sidebarProps.tutorialInteractionPolicy])

  const resolvedActiveView = hasRoadmap ? activeView : "accelerator"
  const railPanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: WORKSPACE_ACCELERATOR_RAIL_PANEL_EASE }

  return (
    <Tabs
      value={resolvedActiveView}
      onValueChange={(nextValue) =>
        setActiveView(nextValue as WorkspaceAcceleratorRailView)
      }
      className="flex h-full min-h-0 flex-col gap-2.5"
    >
      {hasRoadmap ? (
        <div className="px-1">
          <TabsList className="w-full gap-1 rounded-full border border-border/70 bg-background/70 p-1">
            <TabsTrigger
              value="roadmap"
              disabled={Boolean(sidebarProps.tutorialInteractionPolicy)}
              className="min-w-0 flex-1 rounded-full border border-transparent px-2 py-1.5 text-[11px] data-[state=active]:border-border/70 data-[state=active]:bg-muted/55 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <span className="truncate">Roadmap</span>
            </TabsTrigger>
            <TabsTrigger
              value="accelerator"
              className="min-w-0 flex-1 rounded-full border border-transparent px-2 py-1.5 text-[11px] data-[state=active]:border-border/70 data-[state=active]:bg-muted/55 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <span className="truncate">Accelerator</span>
            </TabsTrigger>
          </TabsList>
        </div>
      ) : null}

      <TabsContent
        forceMount
        value="accelerator"
        className="min-h-0 flex-1 data-[state=inactive]:hidden data-[state=active]:flex data-[state=active]:flex-col"
      >
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={false}
          animate={
            resolvedActiveView === "accelerator"
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 6 }
          }
          transition={railPanelTransition}
        >
          <WorkspaceAcceleratorCardSidebar
            {...sidebarProps}
            showChecklist={false}
            headerControls={
              <WorkspaceAcceleratorHeaderPicker
                lessonGroupOptions={lessonGroupOptions}
                selectedLessonGroupKey={selectedLessonGroupKey}
                tutorialCallout={
                  sidebarProps.tutorialCallout?.focus === "picker"
                    ? sidebarProps.tutorialCallout
                    : null
                }
                tutorialInteractionPolicy={sidebarProps.tutorialInteractionPolicy}
                viewerOpen={viewerOpen}
                layout="rail"
                onLessonGroupChange={onLessonGroupChange}
              />
            }
          />
        </motion.div>
      </TabsContent>

      {hasRoadmap ? (
        <TabsContent
          forceMount
          value="roadmap"
          className="min-h-0 flex-1 data-[state=inactive]:hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <motion.div
            className="flex min-h-0 flex-1 flex-col"
            initial={false}
            animate={
              resolvedActiveView === "roadmap"
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 6 }
            }
            transition={railPanelTransition}
          >
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <RoadmapNavigatorSection
                sections={roadmapSections}
                basePath={roadmapBasePath}
              />
            </div>
          </motion.div>
        </TabsContent>
      ) : null}
    </Tabs>
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
