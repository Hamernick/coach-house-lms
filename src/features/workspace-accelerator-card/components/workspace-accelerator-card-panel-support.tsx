"use client"

import Link from "next/link"
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import Layers from "lucide-react/dist/esm/icons/layers"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"

import {
  buildWorkspaceAcceleratorChecklistModules,
  buildWorkspaceAcceleratorLessonGroupOptions,
} from "../lib"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorLessonGroupSummary,
  WorkspaceAcceleratorTutorialCallout,
} from "../types"
import { WorkspaceAcceleratorCardChecklist } from "./workspace-accelerator-card-checklist"
import { WorkspaceAcceleratorCardProgressStrip } from "./workspace-accelerator-card-progress-strip"

export function WorkspaceAcceleratorCardEmptyState({
  href,
}: {
  href: string
}) {
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
        <Link href={href}>Open accelerator</Link>
      </Button>
    </div>
  )
}

export function useModuleViewerSizeSync({
  size,
  onSizeChange,
  isModuleViewerOpen,
}: {
  size: WorkspaceAcceleratorCardInput["size"]
  onSizeChange: WorkspaceAcceleratorCardInput["onSizeChange"]
  isModuleViewerOpen: boolean
}) {
  const collapsedSizeBeforeViewerRef = useRef<
    WorkspaceAcceleratorCardInput["size"] | null
  >(null)

  useEffect(() => {
    if (!onSizeChange) return

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
    if (!previousCollapsedSize) return
    collapsedSizeBeforeViewerRef.current = null
    if (size !== previousCollapsedSize) {
      onSizeChange(previousCollapsedSize)
    }
  }, [isModuleViewerOpen, onSizeChange, size])
}

export function WorkspaceAcceleratorCardSidebar({
  selectedLessonGroup,
  tutorialCallout,
  moduleCount,
  filteredSteps,
  filteredProgressPercent,
  readinessSummary,
  checklistModules,
  currentStepId,
  completedStepIds,
  openModuleId,
  onOpenModuleIdChange,
  onStepSelect,
  tutorialTargetStepId,
  headerControls = null,
}: {
  selectedLessonGroup: ReturnType<
    typeof buildWorkspaceAcceleratorLessonGroupOptions
  >[number] | null
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  moduleCount: number
  filteredSteps: WorkspaceAcceleratorCardStep[]
  filteredProgressPercent: number
  readinessSummary: WorkspaceAcceleratorCardInput["readinessSummary"]
  checklistModules: ReturnType<typeof buildWorkspaceAcceleratorChecklistModules>
  currentStepId: string
  completedStepIds: string[]
  openModuleId: string | null
  onOpenModuleIdChange: (next: string | null) => void
  onStepSelect: (step: WorkspaceAcceleratorCardStep) => void
  tutorialTargetStepId: string | null
  headerControls?: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-col gap-1.5">
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
        <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
          {moduleCount} {moduleCount === 1 ? "module" : "modules"}
        </span>
        <span className="inline-flex items-center rounded-md border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
          {filteredSteps.length} {filteredSteps.length === 1 ? "step" : "steps"}
        </span>
      </div>

      <WorkspaceAcceleratorCardProgressStrip
        progressPercent={filteredProgressPercent}
        readinessSummary={readinessSummary}
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
        headerControls={headerControls}
      />
    </div>
  )
}

export function WorkspaceAcceleratorCardNavControls({
  runtimeActions,
  runtimeSnapshot,
  tutorialCallout,
}: {
  runtimeActions: WorkspaceAcceleratorCardRuntimeActions | null
  runtimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
}) {
  const content = (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md"
        disabled={!runtimeSnapshot.canGoPrevious}
        onClick={() => runtimeActions?.goPrevious()}
        aria-label="Previous accelerator step"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-md"
        disabled={!runtimeSnapshot.canGoNext}
        onClick={() => runtimeActions?.goNext()}
        aria-label="Next accelerator step"
      >
        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  )

  if (tutorialCallout?.focus !== "nav") {
    return content
  }

  return (
    <Tooltip open>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <WorkspaceTutorialCallout
        title={tutorialCallout.title}
        instruction={tutorialCallout.instruction}
        side="bottom"
        align="end"
        sideOffset={10}
      />
    </Tooltip>
  )
}

function WorkspaceAcceleratorHeaderPickerLabel({
  label,
}: {
  label: string
}) {
  const viewportRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLSpanElement | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [scrollDistance, setScrollDistance] = useState(0)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const measure = () => {
      const nextScrollDistance = Math.max(
        0,
        Math.ceil(content.scrollWidth - viewport.clientWidth + 8),
      )
      setScrollDistance(nextScrollDistance)
    }

    measure()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)

    return () => observer.disconnect()
  }, [label])

  return (
    <span
      className="min-w-0 flex-1 overflow-hidden"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      ref={viewportRef}
    >
      <span
        ref={contentRef}
        className="block truncate whitespace-nowrap text-left transition-transform duration-1000 ease-out will-change-transform"
        style={
          scrollDistance > 0 && isHovered
            ? { transform: `translateX(-${scrollDistance}px)` }
            : undefined
        }
      >
        {label}
      </span>
    </span>
  )
}

export function WorkspaceAcceleratorHeaderPicker({
  lessonGroupOptions,
  selectedLessonGroupKey,
  tutorialCallout,
  onLessonGroupChange,
}: {
  lessonGroupOptions: WorkspaceAcceleratorLessonGroupSummary[]
  selectedLessonGroupKey: string
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  onLessonGroupChange: (nextLessonGroupKey: string) => void
}) {
  const selectedLessonGroup =
    lessonGroupOptions.find((option) => option.key === selectedLessonGroupKey) ?? null
  const ActiveLessonGroupIcon = useMemo(() => {
    if (!selectedLessonGroup) return Layers
    return getTrackIcon(selectedLessonGroup.label)
  }, [selectedLessonGroup])
  const selectedLessonGroupLabel = selectedLessonGroup?.label ?? "Lessons"

  const trigger = (
    <SelectTrigger
      className={cn(
        "h-8 min-h-8 w-[224px] max-w-[32vw] border-border/65 bg-background/80 text-left text-xs",
        tutorialCallout?.focus === "picker" &&
          "border-sky-300/70 bg-sky-50/80 dark:border-sky-400/45 dark:bg-sky-500/10",
      )}
      aria-label="Filter by lesson group"
    >
      <ActiveLessonGroupIcon
        className="h-3.5 w-3.5 text-muted-foreground"
        aria-hidden
      />
      <SelectValue className="sr-only" placeholder="Lessons" />
      <WorkspaceAcceleratorHeaderPickerLabel label={selectedLessonGroupLabel} />
    </SelectTrigger>
  )

  return (
    <Select value={selectedLessonGroupKey} onValueChange={onLessonGroupChange}>
      {tutorialCallout?.focus === "picker" ? (
        <Tooltip open>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <WorkspaceTutorialCallout
            title={tutorialCallout.title}
            instruction={tutorialCallout.instruction}
            side="bottom"
            align="end"
            sideOffset={10}
          />
        </Tooltip>
      ) : (
        trigger
      )}
      <SelectContent align="end">
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
  )
}
