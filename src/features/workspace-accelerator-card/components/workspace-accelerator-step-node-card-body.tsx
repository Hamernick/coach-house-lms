"use client"

import Link from "next/link"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import { useMemo, useState } from "react"

import { RichTextEditor } from "@/components/rich-text-editor"
import { AssignmentForm } from "@/components/training/module-detail/assignment-form"
import { DeckViewer } from "@/components/training/module-detail/deck-viewer"
import { LessonNotes } from "@/components/training/module-detail/lesson-notes"
import { ModuleStepperCompleteStep } from "@/components/training/module-detail/module-stepper-complete-step"
import { ModuleStepperResourcesStep } from "@/components/training/module-detail/module-stepper-resources-step"
import { useAssignmentSubmission } from "@/components/training/module-detail/use-assignment-submission"
import { VideoSection } from "@/components/training/module-detail/video-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WORKSPACE_TEXT_STYLES } from "@/components/workspace/workspace-typography"
import type { ModuleResource, ModuleResourceProvider } from "@/lib/modules"

import type {
  WorkspaceAcceleratorCardStep,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import {
  resolveWorkspaceAcceleratorStepVideoUrl,
} from "./workspace-accelerator-step-node-card-helpers"
import { WorkspaceAcceleratorOnboardingStepBody } from "./workspace-accelerator-step-node-card-onboarding"
import { canWorkspaceAcceleratorTutorialPerformPreviewAction } from "./workspace-accelerator-card-tutorial-guards"

function resolveWorkspaceAcceleratorStepKindLabel(
  stepKind: WorkspaceAcceleratorCardStep["stepKind"],
) {
  if (stepKind === "lesson") return "Class"
  if (stepKind === "video") return "Video"
  if (stepKind === "resources") return "Resources"
  if (stepKind === "assignment") return "Assignment"
  if (stepKind === "complete") return "Complete"
  return "Deck"
}

const MODULE_RESOURCE_PROVIDERS = new Set<ModuleResourceProvider>([
  "youtube",
  "google-drive",
  "dropbox",
  "loom",
  "vimeo",
  "notion",
  "figma",
  "generic",
])

function resolveWorkspaceStepOverviewResources(
  step: WorkspaceAcceleratorCardStep,
): ModuleResource[] {
  if (step.moduleContext?.moduleResources.length) {
    return step.moduleContext.moduleResources
  }

  return step.resources.map((resource) => {
    const provider = MODULE_RESOURCE_PROVIDERS.has(resource.kind as ModuleResourceProvider)
      ? (resource.kind as ModuleResourceProvider)
      : "generic"
    return {
      label: resource.title,
      url: resource.url,
      provider,
    }
  })
}

export function WorkspaceAcceleratorStepBody({
  step,
  placeholderVideoUrl,
  stepIndex,
  stepTotal,
  canGoNext,
  completed,
  onComplete,
  onClose,
  tutorialInteractionPolicy,
  onBlockedPreviewAction,
  onWorkspaceOnboardingSubmit,
  immersiveOnboarding = false,
}: {
  step: WorkspaceAcceleratorCardStep
  placeholderVideoUrl?: string | null
  stepIndex: number
  stepTotal: number
  canGoNext: boolean
  completed: boolean
  onComplete: () => void
  onClose: () => void
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  onBlockedPreviewAction?: (
    action: "preview-close" | "preview-link" | "preview-submit",
    controlId: string,
  ) => void
  onWorkspaceOnboardingSubmit?: (form: FormData) => Promise<void>
  immersiveOnboarding?: boolean
}) {
  const [fallbackNotesValue, setFallbackNotesValue] = useState(
    "<p>Capture your notes for this class.</p>",
  )
  const moduleContext = step.moduleContext
  const assignmentFields = moduleContext?.assignmentFields ?? []
  const assignmentSubmission = moduleContext?.assignmentSubmission ?? null
  const completeOnSubmit = moduleContext?.completeOnSubmit ?? false
  const classTitle = moduleContext?.classTitle ?? "Accelerator"
  const overviewResources = useMemo(
    () => resolveWorkspaceStepOverviewResources(step),
    [step],
  )

  const {
    formSeed,
    handleSubmit,
    isSubmitting,
    lastSavedAt,
    message,
    statusMeta,
    submissionError,
  } = useAssignmentSubmission({
    assignmentFields,
    moduleId: step.moduleId,
    submission: assignmentSubmission,
  })

  const statusLabel = useMemo(() => {
    if (completed) return "Completed"
    return statusMeta?.label ?? null
  }, [completed, statusMeta?.label])

  const statusVariant = useMemo(() => {
    if (completed) return "default" as const
    return statusMeta?.variant ?? "secondary"
  }, [completed, statusMeta?.variant])

  const stepCount = Math.max(stepTotal, 1)
  const currentCount = Math.min(stepIndex + 1, stepCount)
  const acceleratorBreakHref = step.href.includes("paywall=") ? step.href : "/accelerator"
  const workspaceOnboardingView =
    step.moduleContext?.workspaceOnboarding?.view ?? null
  const effectiveVideoUrl = resolveWorkspaceAcceleratorStepVideoUrl({
    step,
    placeholderVideoUrl,
  })
  const showVideo =
    step.stepKind === "video" || workspaceOnboardingView === "welcome"
  const showResources = step.stepKind === "resources"
  const showAssignment = step.stepKind === "assignment"
  const showDeck = step.stepKind === "deck"
  const showComplete = step.stepKind === "complete"
  const showLessonNotes =
    step.stepKind === "lesson" && Boolean(moduleContext?.lessonNotesContent)
  const showStepKindBadge = !showAssignment
  const showDurationBadge = Boolean(step.durationMinutes)
  const showStepMeta = showStepKindBadge || showDurationBadge
  const stepKindLabel = resolveWorkspaceAcceleratorStepKindLabel(step.stepKind)

  if (workspaceOnboardingView === "organization-setup") {
    return (
      <WorkspaceAcceleratorOnboardingStepBody
        view={workspaceOnboardingView}
        defaults={step.moduleContext?.workspaceOnboarding?.defaults ?? null}
        onSubmit={onWorkspaceOnboardingSubmit}
        immersive={immersiveOnboarding}
      />
    )
  }

  if (showVideo) {
    return (
      <div className="px-3 py-3 sm:px-4">
        <VideoSection
          embedUrl={null}
          videoUrl={effectiveVideoUrl}
          fallbackUrl={step.href}
          variant="frame"
          className="border-border/60 aspect-video w-full overflow-hidden rounded-xl border"
        />
      </div>
    )
  }

  return (
    <div
      className={
        showAssignment
          ? "flex h-full min-h-0 flex-col gap-4 px-4 py-4 sm:px-5"
          : "space-y-4 px-4 py-4 sm:px-5"
      }
    >
      {step.stepDescription && !showAssignment ? (
        <p className="text-foreground text-sm leading-relaxed">
          {step.stepDescription}
        </p>
      ) : null}

      {showStepMeta ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {showStepKindBadge ? (
            <Badge
              variant="outline"
              className="rounded-md text-[10px] font-medium"
            >
              {stepKindLabel}
            </Badge>
          ) : null}
          {showDurationBadge ? (
            <Badge
              variant="outline"
              className="rounded-md text-[10px] font-medium"
            >
              {step.durationMinutes} min
            </Badge>
          ) : null}
        </div>
      ) : null}

      {showLessonNotes && moduleContext?.lessonNotesContent ? (
        <LessonNotes
          title={step.moduleTitle}
          content={moduleContext.lessonNotesContent}
        />
      ) : null}

      {showResources ? (
        moduleContext ? (
          <ModuleStepperResourcesStep
            resources={moduleContext.moduleResources ?? []}
            moduleId={step.moduleId}
            hasDeck={step.hasDeck}
          />
        ) : (
          <section className="space-y-1.5">
            <p className={WORKSPACE_TEXT_STYLES.meta}>
              Resources
            </p>
            <div className="space-y-1.5">
              {step.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    if (
                      canWorkspaceAcceleratorTutorialPerformPreviewAction({
                        tutorialInteractionPolicy,
                        action: "preview-link",
                      })
                    ) {
                      return
                    }
                    event.preventDefault()
                    onBlockedPreviewAction?.("preview-link", `resource:${resource.id}`)
                  }}
                  className="border-border/60 bg-background/75 hover:bg-muted/25 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {resource.title}
                  </span>
                  <ExternalLinkIcon
                    className="text-muted-foreground h-4 w-4"
                    aria-hidden
                  />
                </a>
              ))}
            </div>
          </section>
        )
      ) : null}

      {showAssignment ? (
        assignmentFields.length > 0 ? (
          <div className="min-h-0 flex-1">
            <AssignmentForm
              mode="stepper"
              fields={assignmentFields}
              initialValues={formSeed}
              pending={isSubmitting}
              onSubmit={handleSubmit}
              statusLabel={statusLabel}
              statusVariant={statusVariant}
              statusNote={statusMeta?.note ?? null}
              helperText={message}
              errorMessage={submissionError}
              updatedAt={lastSavedAt}
              completeOnSubmit={completeOnSubmit}
              moduleId={step.moduleId}
              moduleTitle={step.moduleTitle}
              classTitle={classTitle}
              activeSectionId={step.assignmentSectionId ?? undefined}
              currentStep={stepIndex + 1}
              totalSteps={stepTotal}
              overviewResources={overviewResources}
              overviewHasDeck={step.hasDeck}
              showStepNavigation={false}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className={WORKSPACE_TEXT_STYLES.meta}>
              Assignment
            </p>
            <p className={WORKSPACE_TEXT_STYLES.bodyMuted}>
              This lesson assignment schema is not available yet. Use notes below
              until it is published.
            </p>
            <RichTextEditor
              value={fallbackNotesValue}
              onChange={setFallbackNotesValue}
              mode="homework"
              minHeight={180}
              maxHeight={320}
              className="border-border/60 rounded-xl"
            />
          </div>
        )
      ) : null}

      {showDeck ? (
        step.hasDeck ? (
          <div className="space-y-2">
            <p className={WORKSPACE_TEXT_STYLES.meta}>
              Deck
            </p>
            <DeckViewer
              moduleId={step.moduleId}
              hasDeck
              variant="frame"
              showPreviewTrigger={false}
              inlinePreview
              className="border-border/60 h-[420px] overflow-hidden rounded-xl border"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className={WORKSPACE_TEXT_STYLES.meta}>
              Deck
            </p>
            <p className={WORKSPACE_TEXT_STYLES.bodyMuted}>
              No deck is attached to this lesson yet.
            </p>
          </div>
        )
      ) : null}

      {showComplete ? (
        <ModuleStepperCompleteStep
          completionCount={currentCount}
          moduleCount={stepCount}
          progressPercent={Math.round((currentCount / stepCount) * 100)}
          breakHref={acceleratorBreakHref}
          nextHref={canGoNext ? step.href : null}
          nextLocked={!canGoNext}
          schedulePending={false}
          coachingTier={null}
          coachingRemaining={null}
          onContinue={onComplete}
          onSchedule={() => {
            if (
              canWorkspaceAcceleratorTutorialPerformPreviewAction({
                tutorialInteractionPolicy,
                action: "preview-close",
              })
            ) {
              onClose()
              return
            }
            onBlockedPreviewAction?.("preview-close", "complete-schedule")
          }}
        />
      ) : null}

      {!showLessonNotes &&
      !showResources &&
      !showAssignment &&
      !showDeck &&
      !showComplete ? (
        <section className="space-y-2">
          <p className={WORKSPACE_TEXT_STYLES.meta}>
            Step focus
          </p>
          <p className={WORKSPACE_TEXT_STYLES.bodyMuted}>
            Complete this step here, then keep moving through the lesson.
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-xs"
          >
            <Link
              href={step.href}
              onClick={(event) => {
                if (
                  canWorkspaceAcceleratorTutorialPerformPreviewAction({
                    tutorialInteractionPolicy,
                    action: "preview-link",
                  })
                ) {
                  return
                }
                event.preventDefault()
                onBlockedPreviewAction?.("preview-link", "open-in-accelerator")
              }}
            >
              Open in accelerator
              <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </section>
      ) : null}
    </div>
  )
}
