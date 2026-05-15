"use client"

import type { ReactNode } from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import { WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import { cn } from "@/lib/utils"

import {
  isWorkspaceAcceleratorChecklistModuleComplete,
  type WorkspaceAcceleratorChecklistModule,
} from "../lib"
import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import { canWorkspaceAcceleratorTutorialActivateStep } from "./workspace-accelerator-card-tutorial-guards"

const WORKSPACE_ACCELERATOR_CHECKLIST_SOURCE =
  "src/features/workspace-accelerator-card/components/workspace-accelerator-card-checklist.tsx"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_BUTTON_CLASSNAME =
  "flex w-full items-center gap-3 rounded-lg border border-transparent bg-background px-2.5 py-2 text-left text-sm text-foreground transition-[color,background-color,opacity,transform] outline-hidden ring-ring/0 focus-visible:ring-2 focus-visible:ring-inset"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_CLASSNAME =
  "peer size-4 shrink-0 rounded-full border border-border bg-background shadow-xs transition-shadow"
const WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_GLYPH_CLASSNAME =
  "size-3 text-primary-foreground"

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

function resolveChecklistModuleActionLabel({
  isCompletedChecklistModule,
  isCurrentChecklistModule,
}: {
  isCompletedChecklistModule: boolean
  isCurrentChecklistModule: boolean
}) {
  if (isCompletedChecklistModule) return "Review"
  if (isCurrentChecklistModule) return "Continue"
  return "Start"
}

function resolveChecklistModuleSubtitle({
  module,
  isCompletedChecklistModule,
  isCurrentChecklistModule,
}: {
  module: WorkspaceAcceleratorChecklistModule
  isCompletedChecklistModule: boolean
  isCurrentChecklistModule: boolean
}) {
  const actionLabel = resolveChecklistModuleActionLabel({
    isCompletedChecklistModule,
    isCurrentChecklistModule,
  })
  const stepLabel = module.totalSteps === 1 ? "step" : "steps"
  return `${module.totalSteps} ${stepLabel} • ${actionLabel}`.toLowerCase()
}

export function resolveWorkspaceAcceleratorChecklistSelectableStep({
  fallbackStep,
  isTutorialTarget,
  module,
  tutorialTargetStepId,
}: {
  fallbackStep: WorkspaceAcceleratorCardStep
  isTutorialTarget: boolean
  module: WorkspaceAcceleratorChecklistModule
  tutorialTargetStepId: string | null
}) {
  if (!isTutorialTarget || !tutorialTargetStepId) return fallbackStep

  return (
    module.steps.find((moduleStep) => moduleStep.id === tutorialTargetStepId) ??
    fallbackStep
  )
}

function ChecklistStepRow({
  completedStepIds,
  currentStepId,
  module,
  onStepSelect,
  step,
  tutorialCallout,
  tutorialInteractionPolicy,
  tutorialTargetStepId,
}: {
  completedStepIds: string[]
  currentStepId: string
  module: WorkspaceAcceleratorChecklistModule
  onStepSelect: (step: WorkspaceAcceleratorCardStep) => void
  step: WorkspaceAcceleratorCardStep
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  tutorialTargetStepId: string | null
}) {
  const primaryStep = module.steps[0] ?? step
  const isCurrentChecklistStep = module.steps.some(
    (moduleStep) => moduleStep.id === currentStepId,
  )
  const isCompletedChecklistStep = isWorkspaceAcceleratorChecklistModuleComplete({
    module,
    completedStepIds,
  })
  const isTutorialTarget =
    tutorialCallout !== null &&
    module.steps.some((moduleStep) => tutorialTargetStepId === moduleStep.id)
  const selectableStep = resolveWorkspaceAcceleratorChecklistSelectableStep({
    fallbackStep: primaryStep,
    isTutorialTarget,
    module,
    tutorialTargetStepId,
  })
  const canSelectStep = canWorkspaceAcceleratorTutorialSelectLessonStep({
    tutorialInteractionPolicy,
    stepId: selectableStep.id,
    moduleId: selectableStep.moduleId,
  })
  const subtitle = resolveChecklistModuleSubtitle({
    module,
    isCompletedChecklistModule: isCompletedChecklistStep,
    isCurrentChecklistModule: isCurrentChecklistStep,
  })
  const reactGrabOwnerId = `workspace-accelerator-checklist:${primaryStep.id}`
  const button = (
    <button
      {...getReactGrabOwnerProps({
        ownerId: reactGrabOwnerId,
        component: "WorkspaceAcceleratorChecklistStepRow",
        source: WORKSPACE_ACCELERATOR_CHECKLIST_SOURCE,
        slot: "lesson-row",
        variant: step.stepKind,
      })}
      type="button"
      onClick={() => {
        if (!canSelectStep) {
          return
        }
        onStepSelect(selectableStep)
      }}
      className={cn(
        WORKSPACE_ACCELERATOR_CHECKLIST_STEP_BUTTON_CLASSNAME,
        isCurrentChecklistStep
          ? "border-border/70 bg-muted/70"
          : "border-border/60 hover:bg-muted/60",
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
            ? "border-teal-600 bg-teal-600"
            : "hover:cursor-pointer",
        )}
        aria-hidden
      >
        {isCompletedChecklistStep ? (
          <span className="flex size-full items-center justify-center">
            <CheckIcon
              className={WORKSPACE_ACCELERATOR_CHECKLIST_STEP_ICON_GLYPH_CLASSNAME}
              aria-hidden
            />
          </span>
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground">
            {module.title}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {subtitle}
        </div>
      </div>
      {step.durationMinutes ? (
        <span className="ml-2 hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {step.durationMinutes} min
        </span>
      ) : null}
    </button>
  )

  if (tutorialCallout && isTutorialTarget) {
    return (
      <div className="relative space-y-2">
        <WorkspaceTutorialCallout
          reactGrabOwnerId={`workspace-accelerator-checklist-callout:${step.id}`}
          mode="indicator"
          tooltipContentClassName={WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME}
          indicatorAnchorAlign="end"
          indicatorAnchorVerticalAlign="center"
          indicatorSide="right"
        />
        {button}
      </div>
    )
  }

  return button
}

export function WorkspaceAcceleratorCardChecklist({
  modules,
  selectedLessonGroupLabel,
  currentStepId,
  completedStepIds,
  onStepSelect,
  tutorialCallout = null,
  tutorialTargetStepId = null,
  tutorialInteractionPolicy = null,
  headerControls = null,
}: WorkspaceAcceleratorCardChecklistProps) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "px-0 pb-1",
          headerControls
            ? "flex flex-col items-stretch gap-2.5"
            : "flex items-center justify-between gap-2",
        )}
      >
        {headerControls ? (
          <div className="w-full max-w-full">{headerControls}</div>
        ) : (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {selectedLessonGroupLabel ?? "Lesson checklist"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {tutorialInteractionPolicy?.stepId === "accelerator"
                ? "The guide will open Organization setup next. For now, stay on the Accelerator overview."
                : tutorialInteractionPolicy?.stepId === "accelerator-picker"
                  ? "Browse the class structure here. The guide will keep this path on Formation for now."
                  : tutorialInteractionPolicy?.stepId === "accelerator-first-module"
                    ? "Open the highlighted Organization setup lesson to see how a class launches inside Workspace."
                    : tutorialInteractionPolicy?.stepId === "accelerator-close-module"
                      ? "This preview stays centered on Organization setup until you continue to Calendar."
                      : "Review each lesson and open the step you want to work on."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1 px-0">
        {modules.flatMap((module) => {
          const firstStep = module.steps[0]
          if (!firstStep) return []

          return [
            <ChecklistStepRow
              key={module.id}
              completedStepIds={completedStepIds}
              currentStepId={currentStepId}
              module={module}
              onStepSelect={onStepSelect}
              step={firstStep}
              tutorialCallout={tutorialCallout}
              tutorialInteractionPolicy={tutorialInteractionPolicy}
              tutorialTargetStepId={tutorialTargetStepId}
            />,
          ]
        })}
      </div>
    </div>
  )
}
