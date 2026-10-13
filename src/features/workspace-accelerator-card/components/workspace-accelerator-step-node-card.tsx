"use client"

import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"
import XIcon from "lucide-react/dist/esm/icons/x"
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
import { cn } from "@/lib/utils"

import type { WorkspaceAcceleratorCardStep } from "../types"

export type WorkspaceAcceleratorStepNodeCardProps = {
  step: WorkspaceAcceleratorCardStep
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
}

function headerButtonClassName() {
  return "h-8 w-8 rounded-lg border border-border/65 bg-background/80 hover:bg-background/95"
}

function clampStepTitle(title: string) {
  const trimmed = title.trim()
  if (!trimmed) return "Accelerator step"
  return trimmed
}

export function WorkspaceAcceleratorStepNodeCard({
  step,
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
}: WorkspaceAcceleratorStepNodeCardProps) {
  const [fallbackNotesValue, setFallbackNotesValue] = useState(
    "<p>Capture your notes for this lesson.</p>"
  )
  const moduleContext = step.moduleContext
  const assignmentFields = moduleContext?.assignmentFields ?? []
  const assignmentSubmission = moduleContext?.assignmentSubmission ?? null
  const completeOnSubmit = moduleContext?.completeOnSubmit ?? false
  const classTitle = moduleContext?.classTitle ?? "Accelerator"

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

  const stepTitle = clampStepTitle(step.stepTitle)
  const stepCount = Math.max(stepTotal, 1)
  const currentCount = Math.min(stepIndex + 1, stepCount)
  const acceleratorBreakHref = step.href.includes("paywall=")
    ? step.href
    : "/accelerator"
  const showVideo = step.stepKind === "video"
  const showResources = step.stepKind === "resources"
  const showAssignment = step.stepKind === "assignment"
  const showDeck = step.stepKind === "deck"
  const showComplete = step.stepKind === "complete"
  const showLessonNotes =
    step.stepKind === "lesson" && Boolean(moduleContext?.lessonNotesContent)
  const showStepKindBadge = !showAssignment
  const showDurationBadge = Boolean(step.durationMinutes)
  const showStepMeta = showStepKindBadge || showDurationBadge

  return (
    <article className="border-border/70 bg-card flex h-auto w-full min-w-0 flex-col overflow-hidden rounded-[24px] border shadow-[0_16px_42px_-30px_rgba(15,23,42,0.24)]">
      <header className="accelerator-step-node-drag-handle border-border/60 bg-muted/20 cursor-grab active:cursor-grabbing border-b px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-[11px]">
              {step.moduleTitle}
            </p>
            <h3 className="text-foreground line-clamp-1 text-sm font-semibold">
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
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(headerButtonClassName(), "h-7 w-7")}
                onClick={onPrevious}
                disabled={!canGoPrevious}
                aria-label="Previous accelerator step"
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </Button>
              <p className="bg-muted/60 text-foreground min-w-[4rem] rounded-md px-2 py-1 text-center text-[11px] font-medium tabular-nums">
                {currentCount} of {stepCount}
              </p>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(headerButtonClassName(), "h-7 w-7")}
                onClick={onNext}
                disabled={!canGoNext}
                aria-label="Next accelerator step"
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  headerButtonClassName(),
                  "h-7 w-7",
                  moduleCompleted &&
                    "border-sky-500/45 bg-sky-500/12 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400",
                )}
                onClick={onClose}
                aria-label={
                  moduleCompleted
                    ? "Lesson complete"
                    : "Close accelerator step node"
                }
              >
                {moduleCompleted ? (
                  <CheckIcon className="h-4 w-4" aria-hidden />
                ) : (
                  <XIcon className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full min-w-0"
        >
          {showVideo ? (
            <div className="px-4 py-3">
              <VideoSection
                embedUrl={null}
                videoUrl={step.videoUrl}
                fallbackUrl={step.href}
                variant="frame"
                className="border-border/60 aspect-video w-full overflow-hidden rounded-xl border"
              />
            </div>
          ) : (
            <div className="space-y-4 px-5 py-4">
              {step.stepDescription ? (
                !showAssignment ? (
                  <p className="text-foreground text-sm leading-relaxed">
                    {step.stepDescription}
                  </p>
                ) : null
              ) : null}

              {showStepMeta ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {showStepKindBadge ? (
                    <Badge
                      variant="outline"
                      className="rounded-md text-[10px] font-medium"
                    >
                      {step.stepKind}
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
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Resources
                    </p>
                    <div className="space-y-1.5">
                      {step.resources.map((resource) => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
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
                    currentStep={stepIndex + 1}
                    totalSteps={stepTotal}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Assignment
                    </p>
                    <p className="text-muted-foreground text-sm">
                      This module assignment schema is not available yet. Use
                      notes below until it is published.
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
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
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
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Deck
                    </p>
                    <p className="text-muted-foreground text-sm">
                      No deck is attached to this module yet.
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
                  onContinue={onNext}
                  onSchedule={onClose}
                />
              ) : null}

              {!showLessonNotes &&
              !showResources &&
              !showAssignment &&
              !showDeck &&
              !showComplete ? (
                <section className="space-y-2">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Step focus
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Complete this lesson step, then move forward in sequence.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs"
                  >
                    <Link href={step.href}>
                      Open full lesson
                      <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </section>
              ) : null}
            </div>
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
        >
          {completed ? "Completed" : "Complete"}
        </Button>
      </footer>
    </article>
  )
}
