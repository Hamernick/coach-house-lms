"use client"
import type { ReactNode } from "react"
import { useState } from "react"
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
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import { WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"

import type { WorkspaceAcceleratorChecklistModule } from "../lib"
import { formatWorkspaceAcceleratorModuleCompletionLabel } from "../lib"
import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorStepKind,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import {
  canWorkspaceAcceleratorTutorialActivateStep,
} from "./workspace-accelerator-card-tutorial-guards"
import { WorkspaceAcceleratorTutorialGuardTooltip } from "./workspace-accelerator-tutorial-guard-tooltip"
import { useWorkspaceAcceleratorTutorialGuard } from "./use-workspace-accelerator-tutorial-guard"

const WORKSPACE_ACCELERATOR_CARD_CHECKLIST_SOURCE =
  "src/features/workspace-accelerator-card/components/workspace-accelerator-card-checklist.tsx"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_BUTTON_CLASSNAME =
  "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-foreground/80 transition-[color,background-color,opacity,transform] outline-hidden ring-ring/0 focus-visible:ring-2 focus-visible:ring-inset"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_CLASSNAME =
  "inline-flex shrink-0 items-center justify-center"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_GLYPH_CLASSNAME =
  "size-4 shrink-0"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ACTION_CLASSNAME =
  "inline-flex h-5 shrink-0 self-center items-center text-[10px] leading-none text-muted-foreground"

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
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  headerControls?: ReactNode
}

export function shouldWorkspaceAcceleratorTutorialRestrictLessonSelection({
  tutorialInteractionPolicy,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
}) {
  return tutorialInteractionPolicy?.stepId === "accelerator-first-module"
}

export function canWorkspaceAcceleratorTutorialSelectLessonStep({
  tutorialInteractionPolicy,
  stepId,
  moduleId,
}: {
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  stepId: string
  moduleId: string
}) {
  return canWorkspaceAcceleratorTutorialActivateStep({
    tutorialInteractionPolicy,
    stepId,
    moduleId,
  })
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
  tutorialInteractionPolicy = null,
  headerControls = null,
}: WorkspaceAcceleratorCardChecklistProps) {
  const blockedStepGuard = useWorkspaceAcceleratorTutorialGuard({
    enabled: Boolean(tutorialInteractionPolicy),
    defaultMessage:
      tutorialInteractionPolicy?.blockedMessage ??
      "We'll go over this soon, I promise! :)",
    durationMs: tutorialInteractionPolicy?.blockedMessageDurationMs ?? 3000,
  })
  const [blockedStepId, setBlockedStepId] = useState<string | null>(null)

  return (
    <div className="rounded-lg border border-border/60 bg-transparent dark:bg-transparent">
      <div className="border-border/60 flex items-center justify-between gap-2 border-b px-2 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            {selectedLessonGroupLabel ?? "Lesson checklist"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {tutorialInteractionPolicy?.stepId === "accelerator"
              ? "The guide will open the Welcome module next. For now, stay on the Accelerator overview."
              : tutorialInteractionPolicy?.stepId === "accelerator-picker"
              ? "Browse the class structure here. The guide will keep this path on Formation for now."
              : tutorialInteractionPolicy?.stepId === "accelerator-first-module"
                ? "Open the highlighted Welcome module to see how a class launches inside Workspace."
                : tutorialInteractionPolicy?.stepId === "accelerator-close-module"
                  ? "This preview stays centered on the Welcome module until you continue to Calendar."
                : "Review each module and open the step you want to work on."}
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
              {(() => {
                const ModuleIcon = getTrackIcon(module.groupTitle || module.title)
                return (
                  <span className="inline-flex shrink-0 items-center justify-center">
                    <ModuleIcon
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                )
              })()}
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
                    {resolveChecklistStepActionLabel(
                      module.completedStepCount >= module.totalSteps,
                    )}
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
                  const canSelectStep =
                    canWorkspaceAcceleratorTutorialSelectLessonStep({
                      tutorialInteractionPolicy,
                      stepId: step.id,
                      moduleId: module.id,
                    })
                  const reactGrabOwnerDescriptor = {
                    ownerId: `workspace-accelerator-checklist:${step.id}`,
                    component: "WorkspaceAcceleratorCardChecklist",
                    source: WORKSPACE_ACCELERATOR_CARD_CHECKLIST_SOURCE,
                    slot: "step-button",
                    variant: step.id,
                  } as const
                  const StepIcon = resolveChecklistStepIcon(step.stepKind)
                  const button = (
                    <button
                      type="button"
                      {...getReactGrabOwnerProps(reactGrabOwnerDescriptor)}
                      onClick={() => {
                        if (!canSelectStep) {
                          setBlockedStepId(step.id)
                          blockedStepGuard.showBlockedFeedback("step-selection")
                          return
                        }
                        onStepSelect(step)
                      }}
                      className={cn(
                        WORKSPACE_ACCELERATOR_CHECKLIST_STEP_BUTTON_CLASSNAME,
                        isCurrentChecklistStep
                          ? "border-border/70 bg-muted/70"
                          : "border-border/60 hover:bg-accent hover:text-accent-foreground",
                        isTutorialTarget &&
                          "border-sky-300/70 bg-sky-50/78 shadow-[0_12px_28px_-26px_rgba(14,165,233,0.65)] dark:border-sky-400/50 dark:bg-sky-500/10",
                        !canSelectStep &&
                          tutorialInteractionPolicy &&
                          "opacity-84",
                      )}
                    >
                      <span
                        className={cn(
                          WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_CLASSNAME,
                          isCompletedChecklistStep
                            ? "text-emerald-700 dark:text-emerald-200"
                            : isCurrentChecklistStep
                              ? "text-amber-700 dark:text-amber-200"
                              : "text-muted-foreground",
                        )}
                      >
                        <StepIcon
                          className={WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_GLYPH_CLASSNAME}
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                        {step.stepTitle}
                      </span>
                      <span className={WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ACTION_CLASSNAME}>
                        {resolveChecklistStepActionLabel(isCompletedChecklistStep)}
                      </span>
                    </button>
                  )

                  return (
                    <div key={step.id} className="space-y-2">
                      {tutorialCallout && isTutorialTarget ? (
                        <div className="relative">
                          <WorkspaceTutorialCallout
                            reactGrabOwnerId={`${reactGrabOwnerDescriptor.ownerId}:callout`}
                            mode="indicator"
                            tooltipContentClassName={WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME}
                            indicatorAnchorAlign="end"
                            indicatorAnchorVerticalAlign="center"
                            indicatorSide="right"
                          />
                          <WorkspaceAcceleratorTutorialGuardTooltip
                            open={blockedStepGuard.open && blockedStepId === step.id}
                            message={blockedStepGuard.message}
                            ownerDescriptor={reactGrabOwnerDescriptor}
                            side="top"
                            align="end"
                            sideOffset={8}
                          >
                            {button}
                          </WorkspaceAcceleratorTutorialGuardTooltip>
                        </div>
                      ) : (
                        <WorkspaceAcceleratorTutorialGuardTooltip
                          open={blockedStepGuard.open && blockedStepId === step.id}
                          message={blockedStepGuard.message}
                          ownerDescriptor={reactGrabOwnerDescriptor}
                          side="top"
                          align="end"
                          sideOffset={8}
                        >
                          {button}
                        </WorkspaceAcceleratorTutorialGuardTooltip>
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
