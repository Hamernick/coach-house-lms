"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import XIcon from "lucide-react/dist/esm/icons/x"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { ModuleRightRail } from "@/components/training/module-right-rail"
import type { ModuleResource } from "@/components/training/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { WORKSPACE_TEXT_STYLES } from "@/components/workspace/workspace-typography"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import { useIsMobile } from "@/hooks/use-mobile"
import { resolveWorkspaceCanvasStageMotion } from "@/lib/workspace-canvas/motion-spec"
import { cn } from "@/lib/utils"

import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import {
  resolveWorkspaceAcceleratorDisplayStepTitle,
  shouldShowWorkspaceAcceleratorModuleTitle,
} from "./workspace-accelerator-step-node-card-helpers"
import { WorkspaceAcceleratorStepBody } from "./workspace-accelerator-step-node-card-body"
import {
  canWorkspaceAcceleratorTutorialPerformPreviewAction,
  isWorkspaceAcceleratorTutorialPreviewLocked,
} from "./workspace-accelerator-card-tutorial-guards"
import {
  resolveAssignmentFooterNavigation,
  WorkspaceAcceleratorStepFooter,
} from "./workspace-accelerator-step-node-card-footer"
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
  immersive?: boolean
}

function headerButtonClassName() {
  return "h-9 w-9 touch-manipulation rounded-lg border border-border/65 bg-background/80 hover:bg-background/95 sm:h-8 sm:w-8"
}

function headerDoneButtonClassName() {
  return "h-9 min-w-[76px] touch-manipulation gap-1.5 rounded-full border border-border/70 bg-background/90 px-3 text-xs font-medium text-foreground shadow-xs hover:border-border hover:bg-muted/70 hover:text-foreground sm:h-8 sm:min-w-[72px] sm:px-3 dark:bg-background/75 dark:hover:bg-muted/45"
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
  done,
  moduleCompleted,
  onClose,
  reactGrabOwnerProps,
  tutorialCallout,
  variant,
}: {
  done?: boolean
  moduleCompleted: boolean
  onClose: () => void
  reactGrabOwnerProps?: Record<string, string>
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  variant: WorkspaceAcceleratorStepNodeCardVariant
}) {
  const button = (
    <Button
      type="button"
      size={done ? "sm" : "icon"}
      variant={done ? "outline" : "ghost"}
      {...reactGrabOwnerProps}
      className={cn(
        done ? headerDoneButtonClassName() : headerButtonClassName(),
        !done && "h-7 w-7",
        !done &&
          moduleCompleted &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300",
      )}
      onClick={onClose}
      aria-label={
        done
          ? "Done reviewing this lesson"
          : moduleCompleted
          ? "Lesson complete"
          : variant === "embedded"
            ? "Close accelerator lesson"
            : "Close accelerator step node"
      }
    >
      {done ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span>Done</span>
        </>
      ) : moduleCompleted ? (
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

function WorkspaceAcceleratorStepMobileDetailsDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh] rounded-t-[28px] p-0">
        <DrawerHeader className="text-left">
          <DrawerTitle>Details</DrawerTitle>
          <DrawerDescription>
            Notes, resources, and support for this accelerator step.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
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
  immersive = false,
}: WorkspaceAcceleratorStepNodeCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const embedded = variant === "embedded"
  const isMobile = useIsMobile()
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
  const [mobileRailOpen, setMobileRailOpen] = useState(false)
  const stepTitle = clampStepTitle(
    step.stepKind === "assignment" && step.moduleTitle.trim()
      ? step.moduleTitle
      : resolveWorkspaceAcceleratorDisplayStepTitle({
          moduleTitle: step.moduleTitle,
          stepTitle: step.stepTitle,
        }),
  )
  const showModuleTitle =
    step.stepKind !== "assignment" &&
    shouldShowWorkspaceAcceleratorModuleTitle({
      moduleTitle: step.moduleTitle,
      stepTitle,
    })
  const stepCount = Math.max(stepTotal, 1)
  const currentCount = Math.min(stepIndex + 1, stepCount)
  const workspaceOnboardingView =
    step.moduleContext?.workspaceOnboarding?.view ?? null
  const fullscreenEmbedded = embedded && immersive
  const immersiveOnboarding =
    fullscreenEmbedded && workspaceOnboardingView === "organization-setup"
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
          label: "Close lesson",
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
  const showMobileRailDrawer = Boolean(resolvedSidePanel) && isMobile
  const assignmentFooterNavigation = resolveAssignmentFooterNavigation(step)
  const isFinalAssignmentSection = Boolean(
    assignmentFooterNavigation && !assignmentFooterNavigation.nextSection,
  )
  useEffect(() => {
    setMobileRailOpen(false)
  }, [isMobile, step.id])
  const stepBody = (
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
      immersiveOnboarding={immersiveOnboarding}
    />
  )
  return (
    <article
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden",
        fullscreenEmbedded
          ? "h-full min-h-0 border-0 rounded-none bg-transparent shadow-none"
          : "border-border/70 bg-card border",
        tutorialCallout?.focus === "close-module" && "overflow-visible",
        embedded
          ? fullscreenEmbedded
            ? "relative z-10 h-full min-h-0"
            : "relative z-10 h-full min-h-0 rounded-[24px] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.34)]"
          : "h-auto rounded-[24px] shadow-[0_16px_42px_-30px_rgba(15,23,42,0.24)]",
      )}
    >
      {!immersiveOnboarding ? (
        <header
          className={cn(
            "border-border/60 bg-muted/20 border-b px-3 py-3 sm:px-4",
            tutorialCallout?.focus === "close-module" && "relative z-20 overflow-visible",
            !embedded && "accelerator-step-node-drag-handle cursor-grab active:cursor-grabbing",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="rounded-full border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium tabular-nums"
                >
                  {currentCount} of {stepCount}
                </Badge>
                {showMobileRailDrawer ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full px-3 text-xs touch-manipulation sm:hidden"
                    onClick={() => setMobileRailOpen(true)}
                  >
                    Details
                  </Button>
                ) : null}
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
                    className={cn(headerButtonClassName(), "h-9 w-9 sm:h-7 sm:w-7")}
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
                    className={cn(headerButtonClassName(), "h-9 w-9 sm:h-7 sm:w-7")}
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
                      done={isFinalAssignmentSection}
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
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={contentSwapMotion.initial}
          animate={contentSwapMotion.animate}
          exit={contentSwapMotion.exit}
          transition={contentSwapMotion.transition}
          className={cn(
            "w-full min-w-0",
            embedded && "flex h-full min-h-0 flex-1 flex-col",
          )}
        >
          {resolvedSidePanel && !showMobileRailDrawer ? (
            <div className="grid h-full min-h-0 flex-1 items-stretch grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
              <div
                className={cn(
                  "min-h-0",
                  immersiveOnboarding || step.stepKind === "assignment" ? "flex h-full flex-col overflow-hidden" : "overflow-y-auto",
                )}
              >
                {stepBody}
              </div>
              <aside className="border-border/60 min-h-0 border-t bg-muted/10 p-3 sm:p-4 lg:border-t-0 lg:border-l">
                {resolvedSidePanel}
              </aside>
            </div>
          ) : (
            <div
              className={cn(
                "min-h-0",
                embedded && !immersiveOnboarding && (step.stepKind === "assignment" ? "flex h-full flex-1 flex-col overflow-hidden" : "overflow-y-auto"),
                immersiveOnboarding && "flex h-full flex-col overflow-hidden",
              )}
            >
              {stepBody}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {!immersiveOnboarding && assignmentFooterNavigation ? (
        <WorkspaceAcceleratorStepFooter
          assignmentFooterNavigation={assignmentFooterNavigation}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          completed={completed}
          isFinalAssignmentSection={isFinalAssignmentSection}
          onComplete={onComplete}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      ) : null}

      {showMobileRailDrawer ? (
        <WorkspaceAcceleratorStepMobileDetailsDrawer
          open={mobileRailOpen}
          onOpenChange={setMobileRailOpen}
        >
          {resolvedSidePanel}
        </WorkspaceAcceleratorStepMobileDetailsDrawer>
      ) : null}
    </article>
  )
}
