"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import XIcon from "lucide-react/dist/esm/icons/x"
import { useMemo, useState, type ReactNode } from "react"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { ModuleRightRail } from "@/components/training/module-right-rail"
import type { ModuleResource } from "@/components/training/types"
import { Button } from "@/components/ui/button"
import { WORKSPACE_TEXT_STYLES } from "@/components/workspace/workspace-typography"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import { resolveWorkspaceCanvasStageMotion } from "@/lib/workspace-canvas/motion-spec"
import { cn } from "@/lib/utils"

import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import { shouldShowWorkspaceAcceleratorModuleTitle } from "./workspace-accelerator-step-node-card-helpers"
import { WorkspaceAcceleratorStepBody } from "./workspace-accelerator-step-node-card-body"
import {
  canWorkspaceAcceleratorTutorialPerformPreviewAction,
  isWorkspaceAcceleratorTutorialPreviewLocked,
} from "./workspace-accelerator-card-tutorial-guards"
import { WorkspaceAcceleratorTutorialGuardTooltip } from "./workspace-accelerator-tutorial-guard-tooltip"
import { useWorkspaceAcceleratorTutorialGuard } from "./use-workspace-accelerator-tutorial-guard"

type WorkspaceAcceleratorStepNodeCardVariant = "node" | "embedded"
const WORKSPACE_ACCELERATOR_STEP_NODE_CARD_SOURCE =
  "src/features/workspace-accelerator-card/components/workspace-accelerator-step-node-card.tsx"

export type WorkspaceAcceleratorStepNodeCardProps = {
  step: WorkspaceAcceleratorCardStep
  placeholderVideoUrl?: string | null
  stepIndex: number
  stepTotal: number
  canGoPrevious: boolean
  canGoNext: boolean
  completed: boolean
  moduleCompleted: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  onClose: () => void
  tutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  variant?: WorkspaceAcceleratorStepNodeCardVariant
  sidePanel?: ReactNode
  onWorkspaceOnboardingSubmit?: (form: FormData) => Promise<void>
}

function headerButtonClassName() {
  return "h-8 w-8 rounded-lg border border-border/65 bg-background/80 hover:bg-background/95"
}

function clampStepTitle(title: string) {
  const trimmed = title.trim()
  if (!trimmed) return "Accelerator step"
  return trimmed
}

function normalizeRailResources(step: WorkspaceAcceleratorCardStep): ModuleResource[] {
  if (step.moduleContext?.moduleResources?.length) {
    return step.moduleContext.moduleResources
  }

  return step.resources.map((resource) => ({
    label: resource.title,
    url: resource.url,
    provider: "generic" as const,
  }))
}

function AcceleratorStepCloseButton({
  moduleCompleted,
  onClose,
  reactGrabOwnerProps,
  tutorialCallout,
  variant,
}: {
  moduleCompleted: boolean
  onClose: () => void
  reactGrabOwnerProps?: Record<string, string>
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  variant: WorkspaceAcceleratorStepNodeCardVariant
}) {
  const button = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      {...reactGrabOwnerProps}
      className={cn(
        headerButtonClassName(),
        "h-7 w-7",
        moduleCompleted &&
          "border-sky-500/45 bg-sky-500/12 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400",
      )}
      onClick={onClose}
      aria-label={
        moduleCompleted
          ? "Module complete"
          : variant === "embedded"
            ? "Close accelerator module"
            : "Close accelerator step node"
      }
    >
      {moduleCompleted ? (
        <CheckIcon className="h-4 w-4" aria-hidden />
      ) : (
        <XIcon className="h-4 w-4" aria-hidden />
      )}
    </Button>
  )

  if (tutorialCallout?.focus !== "close-module") {
    return button
  }

  return (
    <div className="relative inline-flex shrink-0">
      <WorkspaceTutorialCallout
        reactGrabOwnerId="workspace-accelerator-step-node-card:close-module-callout"
        mode="indicator"
        indicatorOffsetY={-12}
      />
      {button}
    </div>
  )
}

export function WorkspaceAcceleratorStepNodeCard({
  step,
  placeholderVideoUrl = null,
  stepIndex,
  stepTotal,
  canGoPrevious,
  canGoNext,
  completed,
  moduleCompleted,
  onPrevious,
  onNext,
  onComplete,
  onClose,
  tutorialCallout = null,
  tutorialInteractionPolicy = null,
  variant = "node",
  sidePanel,
  onWorkspaceOnboardingSubmit,
}: WorkspaceAcceleratorStepNodeCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const embedded = variant === "embedded"
  const previewLocked = isWorkspaceAcceleratorTutorialPreviewLocked({
    tutorialInteractionPolicy,
  })
  const previewGuard = useWorkspaceAcceleratorTutorialGuard({
    enabled: previewLocked,
    defaultMessage:
      tutorialInteractionPolicy?.blockedMessage ??
      "We'll go over this soon, I promise! :)",
    durationMs: tutorialInteractionPolicy?.blockedMessageDurationMs ?? 3000,
  })
  const [blockedControlId, setBlockedControlId] = useState<string | null>(null)
  const stepTitle = clampStepTitle(step.stepTitle)
  const showModuleTitle = shouldShowWorkspaceAcceleratorModuleTitle({
    moduleTitle: step.moduleTitle,
    stepTitle,
  })
  const stepCount = Math.max(stepTotal, 1)
  const currentCount = Math.min(stepIndex + 1, stepCount)
  const workspaceOnboardingView =
    step.moduleContext?.workspaceOnboarding?.view ?? null
  const handleBlockedPreviewAction = (
    action: "preview-navigation" | "preview-close" | "preview-link" | "preview-submit",
    controlId: string,
  ) => {
    setBlockedControlId(controlId)
    previewGuard.showBlockedFeedback(action)
  }
  const canNavigatePreview = canWorkspaceAcceleratorTutorialPerformPreviewAction({
    tutorialInteractionPolicy,
    action: "preview-navigation",
  })
  const canClosePreview = canWorkspaceAcceleratorTutorialPerformPreviewAction({
    tutorialInteractionPolicy,
    action: "preview-close",
  })
  const previousButtonOwnerDescriptor = {
    ownerId: `workspace-accelerator-step-node-card:${step.id}:previous`,
    component: "WorkspaceAcceleratorStepNodeCard",
    source: WORKSPACE_ACCELERATOR_STEP_NODE_CARD_SOURCE,
    slot: "previous-button",
    variant,
  } as const
  const nextButtonOwnerDescriptor = {
    ownerId: `workspace-accelerator-step-node-card:${step.id}:next`,
    component: "WorkspaceAcceleratorStepNodeCard",
    source: WORKSPACE_ACCELERATOR_STEP_NODE_CARD_SOURCE,
    slot: "next-button",
    variant,
  } as const
  const closeButtonOwnerDescriptor = {
    ownerId: `workspace-accelerator-step-node-card:${step.id}:close`,
    component: "WorkspaceAcceleratorStepNodeCard",
    source: WORKSPACE_ACCELERATOR_STEP_NODE_CARD_SOURCE,
    slot: "close-button",
    variant,
  } as const
  const resolvedSidePanel =
    sidePanel ??
    (embedded && !workspaceOnboardingView ? (
      <ModuleRightRail
        moduleId={step.moduleId}
        resources={normalizeRailResources(step)}
        hasDeck={step.hasDeck}
        breakAction={{
          kind: "button",
          label: "Close module",
          onClick: () => {
            if (canClosePreview) {
              onClose()
              return
            }
            handleBlockedPreviewAction("preview-close", "rail-close")
          },
        }}
      />
    ) : null)
  const contentSwapMotion = resolveWorkspaceCanvasStageMotion({
    stage: "content-swap",
    preset: "default",
    prefersReducedMotion: !!prefersReducedMotion,
  })
  return (
    <article
      className={cn(
        "border-border/70 bg-card flex w-full min-w-0 flex-col overflow-hidden border",
        tutorialCallout?.focus === "close-module" && "overflow-visible",
        embedded
          ? "relative z-10 h-full min-h-0 rounded-[24px] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.34)]"
          : "h-auto rounded-[24px] shadow-[0_16px_42px_-30px_rgba(15,23,42,0.24)]",
      )}
    >
      <header
        className={cn(
          "border-border/60 bg-muted/20 border-b px-4 py-3",
          tutorialCallout?.focus === "close-module" && "relative z-20 overflow-visible",
          !embedded && "accelerator-step-node-drag-handle cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {showModuleTitle ? (
              <p className={cn("truncate", WORKSPACE_TEXT_STYLES.meta)}>
                {step.moduleTitle}
              </p>
            ) : null}
            <h3 className={cn("line-clamp-1", WORKSPACE_TEXT_STYLES.cardTitle)}>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-[6px]">
                  <WaypointsIcon
                    className="h-3.5 w-3.5 text-fuchsia-500 dark:text-fuchsia-400"
                    aria-hidden
                  />
                </span>
                {stepTitle}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">
              <WorkspaceAcceleratorTutorialGuardTooltip
                open={previewGuard.open && blockedControlId === "previous"}
                message={previewGuard.message}
                ownerDescriptor={previousButtonOwnerDescriptor}
                side="top"
                align="end"
                sideOffset={8}
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  {...getReactGrabOwnerProps(previousButtonOwnerDescriptor)}
                  className={cn(headerButtonClassName(), "h-7 w-7")}
                  onClick={() => {
                    if (canNavigatePreview) {
                      onPrevious()
                      return
                    }
                    handleBlockedPreviewAction("preview-navigation", "previous")
                  }}
                  disabled={!canGoPrevious}
                  aria-label="Previous accelerator step"
                >
                  <ChevronLeftIcon className="h-4 w-4" aria-hidden />
                </Button>
              </WorkspaceAcceleratorTutorialGuardTooltip>
              <p className="bg-muted/60 text-foreground min-w-[4rem] rounded-md px-2 py-1 text-center text-[11px] font-medium tabular-nums">
                {currentCount} of {stepCount}
              </p>
              <WorkspaceAcceleratorTutorialGuardTooltip
                open={previewGuard.open && blockedControlId === "next"}
                message={previewGuard.message}
                ownerDescriptor={nextButtonOwnerDescriptor}
                side="top"
                align="end"
                sideOffset={8}
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  {...getReactGrabOwnerProps(nextButtonOwnerDescriptor)}
                  className={cn(headerButtonClassName(), "h-7 w-7")}
                  onClick={() => {
                    if (canNavigatePreview) {
                      onNext()
                      return
                    }
                    handleBlockedPreviewAction("preview-navigation", "next")
                  }}
                  disabled={!canGoNext}
                  aria-label="Next accelerator step"
                >
                  <ChevronRightIcon className="h-4 w-4" aria-hidden />
                </Button>
              </WorkspaceAcceleratorTutorialGuardTooltip>
              <WorkspaceAcceleratorTutorialGuardTooltip
                open={previewGuard.open && blockedControlId === "close"}
                message={previewGuard.message}
                ownerDescriptor={closeButtonOwnerDescriptor}
                side="top"
                align="end"
                sideOffset={8}
              >
                <div className="inline-flex">
                  <AcceleratorStepCloseButton
                    moduleCompleted={moduleCompleted}
                    onClose={() => {
                      if (canClosePreview) {
                        onClose()
                        return
                      }
                      handleBlockedPreviewAction("preview-close", "close")
                    }}
                    reactGrabOwnerProps={getReactGrabOwnerProps(
                      closeButtonOwnerDescriptor,
                    )}
                    tutorialCallout={tutorialCallout}
                    variant={variant}
                  />
                </div>
              </WorkspaceAcceleratorTutorialGuardTooltip>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={contentSwapMotion.initial}
          animate={contentSwapMotion.animate}
          exit={contentSwapMotion.exit}
          transition={contentSwapMotion.transition}
          className={cn(
            "w-full min-w-0",
            embedded && "flex min-h-0 flex-1 flex-col",
          )}
        >
          {resolvedSidePanel ? (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-h-0 overflow-y-auto">
                <WorkspaceAcceleratorStepBody
                  step={step}
                  placeholderVideoUrl={placeholderVideoUrl}
                  stepIndex={stepIndex}
                  stepTotal={stepTotal}
                  canGoNext={canGoNext}
                  completed={completed}
                  onComplete={onComplete}
                  onClose={onClose}
                  tutorialInteractionPolicy={tutorialInteractionPolicy}
                  onBlockedPreviewAction={handleBlockedPreviewAction}
                  onWorkspaceOnboardingSubmit={onWorkspaceOnboardingSubmit}
                />
              </div>
              <aside className="border-border/60 min-h-0 border-l bg-muted/10 p-3">
                {resolvedSidePanel}
              </aside>
            </div>
          ) : (
            <WorkspaceAcceleratorStepBody
              step={step}
              placeholderVideoUrl={placeholderVideoUrl}
              stepIndex={stepIndex}
              stepTotal={stepTotal}
              canGoNext={canGoNext}
              completed={completed}
              onComplete={onComplete}
              onClose={onClose}
              tutorialInteractionPolicy={tutorialInteractionPolicy}
              onBlockedPreviewAction={handleBlockedPreviewAction}
              onWorkspaceOnboardingSubmit={onWorkspaceOnboardingSubmit}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <footer className="border-border/60 bg-muted/15 flex items-center justify-end border-t px-4 py-2.5">
        <Button
          type="button"
          size="sm"
          variant={completed ? "default" : "secondary"}
          className="h-7 rounded-lg px-2.5 text-[11px]"
          onClick={onComplete}
          disabled={
            workspaceOnboardingView === "organization-setup" && !completed
          }
        >
          {completed
            ? "Completed"
            : workspaceOnboardingView === "welcome"
              ? "Continue"
              : workspaceOnboardingView === "organization-setup"
                ? "Save to continue"
                : "Complete"}
        </Button>
      </footer>
    </article>
  )
}
