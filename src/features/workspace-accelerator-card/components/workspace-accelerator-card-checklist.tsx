"use client"

import type { ReactNode } from "react"
import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ClipboardCheckIcon from "lucide-react/dist/esm/icons/clipboard-check"
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open"
import LayersIcon from "lucide-react/dist/esm/icons/layers"
import PlayCircleIcon from "lucide-react/dist/esm/icons/play-circle"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"

import type { WorkspaceAcceleratorChecklistModule } from "../lib"
import { formatWorkspaceAcceleratorModuleCompletionLabel } from "../lib"
import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorStepKind,
  WorkspaceAcceleratorTutorialCallout,
} from "../types"

type WorkspaceAcceleratorCardChecklistProps = {
  modules: WorkspaceAcceleratorChecklistModule[]
  selectedLessonGroupLabel: string | null
  currentStepId: string
  completedStepIds: string[]
  openModuleId: string | null
  onOpenModuleIdChange: (next: string | null) => void
  onStepSelect: (step: WorkspaceAcceleratorCardStep) => void
  tutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  tutorialTargetStepId?: string | null
  headerControls?: ReactNode
}

function resolveChecklistStepIcon(stepKind: WorkspaceAcceleratorStepKind) {
  if (stepKind === "video") return PlayCircleIcon
  if (stepKind === "resources") return FolderOpenIcon
  if (stepKind === "assignment") return ClipboardCheckIcon
  if (stepKind === "deck") return LayersIcon
  if (stepKind === "complete") return CheckCircle2Icon
  return BookOpenIcon
}

function resolveChecklistStepActionLabel(isCompletedChecklistStep: boolean) {
  return isCompletedChecklistStep ? "Review" : "Start"
}

function resolveChecklistModuleActionLabel({
  completedStepCount,
  totalSteps,
}: {
  completedStepCount: number
  totalSteps: number
}) {
  return completedStepCount >= totalSteps ? "Review" : "Start"
}

export function WorkspaceAcceleratorCardChecklist({
  modules,
  selectedLessonGroupLabel,
  currentStepId,
  completedStepIds,
  openModuleId,
  onOpenModuleIdChange,
  onStepSelect,
  tutorialCallout = null,
  tutorialTargetStepId = null,
  headerControls = null,
}: WorkspaceAcceleratorCardChecklistProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/70">
      <div className="border-border/60 flex items-center justify-between gap-2 border-b px-2 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            {selectedLessonGroupLabel ?? "Lesson checklist"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Review each module and open the step you want to work on.
          </p>
        </div>
        {headerControls ? (
          <div className="shrink-0 self-start">{headerControls}</div>
        ) : null}
      </div>

      <Accordion
        type="single"
        collapsible
        value={openModuleId ?? undefined}
        onValueChange={(nextValue) => onOpenModuleIdChange(nextValue || null)}
        className="w-full"
      >
        {modules.map((module) => (
          <AccordionItem key={module.id} value={module.id} className="border-border/60 px-2">
            <AccordionTrigger className="py-2.5 text-left hover:no-underline">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/35 text-muted-foreground">
                {(() => {
                  const ModuleIcon = getTrackIcon(module.groupTitle || module.title)
                  return <ModuleIcon className="h-4 w-4" aria-hidden />
                })()}
              </span>
              <div className="min-w-0 flex flex-1 items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs leading-4 font-medium text-foreground">
                    {module.title}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                    {formatWorkspaceAcceleratorModuleCompletionLabel(
                      module.completedStepCount,
                      module.totalSteps,
                    )}
                  </p>
                </div>
                {module.isCurrent ? (
                  <span className="inline-flex h-5 shrink-0 self-center items-center rounded-md border border-border/70 bg-background px-1.5 text-[10px] leading-none text-muted-foreground">
                    {resolveChecklistModuleActionLabel({
                      completedStepCount: module.completedStepCount,
                      totalSteps: module.totalSteps,
                    })}
                  </span>
                ) : null}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1">
                {module.steps.map((step) => {
                  const isCurrentChecklistStep = step.id === currentStepId
                  const isCompletedChecklistStep = completedStepIds.includes(step.id)
                  const isTutorialTarget =
                    tutorialCallout !== null && tutorialTargetStepId === step.id
                  const StepIcon = resolveChecklistStepIcon(step.stepKind)

                  return (
                    <div key={step.id} className="space-y-2">
                      {tutorialCallout && isTutorialTarget ? (
                        <Tooltip open>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onStepSelect(step)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
                                isCurrentChecklistStep
                                  ? "border-border/70 bg-muted/70"
                                  : "border-transparent hover:border-border/60 hover:bg-muted/40",
                                isTutorialTarget &&
                                  "border-sky-300/70 bg-sky-50/78 shadow-[0_12px_28px_-26px_rgba(14,165,233,0.65)] dark:border-sky-400/50 dark:bg-sky-500/10",
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                                  isCompletedChecklistStep
                                    ? "border-emerald-300/70 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-200"
                                    : isCurrentChecklistStep
                                      ? "border-amber-300/70 bg-amber-100/80 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200"
                                      : "border-border/60 bg-background/70 text-muted-foreground",
                                )}
                              >
                                <StepIcon className="h-3.5 w-3.5" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                                {step.stepTitle}
                              </span>
                              <span className="inline-flex h-5 shrink-0 self-center items-center text-[10px] leading-none text-muted-foreground">
                                {resolveChecklistStepActionLabel(isCompletedChecklistStep)}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <WorkspaceTutorialCallout
                            title={tutorialCallout.title}
                            instruction={tutorialCallout.instruction}
                            emphasis="tap-here"
                          />
                        </Tooltip>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStepSelect(step)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
                            isCurrentChecklistStep
                              ? "border-border/70 bg-muted/70"
                              : "border-transparent hover:border-border/60 hover:bg-muted/40",
                            isTutorialTarget &&
                              "border-sky-300/70 bg-sky-50/78 shadow-[0_12px_28px_-26px_rgba(14,165,233,0.65)] dark:border-sky-400/50 dark:bg-sky-500/10",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                              isCompletedChecklistStep
                                ? "border-emerald-300/70 bg-emerald-100/80 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-200"
                                : isCurrentChecklistStep
                                  ? "border-amber-300/70 bg-amber-100/80 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200"
                                  : "border-border/60 bg-background/70 text-muted-foreground",
                            )}
                          >
                            <StepIcon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                            {step.stepTitle}
                          </span>
                          <span className="inline-flex h-5 shrink-0 self-center items-center text-[10px] leading-none text-muted-foreground">
                            {resolveChecklistStepActionLabel(isCompletedChecklistStep)}
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
