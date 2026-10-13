"use client"

import dynamic from "next/dynamic"
import { type MutableRefObject, type ReactNode } from "react"

import type { CoachingTier } from "@/lib/meetings"

import { LessonNotes } from "./lesson-notes"
import {
  isCacheableModuleStepperStep,
} from "./module-stepper-helpers"
import { ModuleStepperCompleteStep } from "./module-stepper-complete-step"
import { ModuleStepperFrame } from "./module-stepper-frame"
import { ModuleStepperResourcesStep } from "./module-stepper-resources-step"
import type { ModuleStepperProps, ModuleStepperStep } from "./module-stepper-types"
import { VideoSection } from "./video-section"

const AssignmentFormLazy = dynamic(
  () => import("./assignment-form").then((mod) => mod.AssignmentForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span>Loading assignment…</span>
        </div>
      </div>
    ),
  },
)

type ModuleStepperActiveStepContentProps = Pick<
  ModuleStepperProps,
  | "moduleId"
  | "moduleTitle"
  | "classTitle"
  | "embedUrl"
  | "videoUrl"
  | "fallbackUrl"
  | "hasDeck"
  | "lessonNotesContent"
  | "resources"
  | "assignmentFields"
  | "initialValues"
  | "roadmapStatusBySectionId"
  | "pending"
  | "onSubmit"
  | "statusLabel"
  | "statusVariant"
  | "statusNote"
  | "helperText"
  | "errorMessage"
  | "updatedAt"
  | "completeOnSubmit"
  | "moduleCount"
  | "breakHref"
  | "nextHref"
  | "nextLocked"
> & {
  activeStep: ModuleStepperStep | undefined
  hydrated: boolean
  contentCacheRef: MutableRefObject<Record<string, ReactNode>>
  completionCount: number
  progressPercent: number
  schedulePending: boolean
  coachingTier: CoachingTier | null
  coachingRemaining: number | null
  onContinue: () => void
  onSchedule: () => void
}

export function ModuleStepperActiveStepContent({
  activeStep,
  hydrated,
  contentCacheRef,
  moduleId,
  moduleTitle,
  classTitle,
  embedUrl,
  videoUrl,
  fallbackUrl,
  hasDeck,
  lessonNotesContent,
  resources,
  assignmentFields,
  initialValues,
  roadmapStatusBySectionId,
  pending,
  onSubmit,
  statusLabel,
  statusVariant,
  statusNote,
  helperText,
  errorMessage,
  updatedAt,
  completeOnSubmit,
  moduleCount,
  breakHref = "/organization",
  nextHref,
  nextLocked = false,
  completionCount,
  progressPercent,
  schedulePending,
  coachingTier,
  coachingRemaining,
  onContinue,
  onSchedule,
}: ModuleStepperActiveStepContentProps) {
  if (!activeStep) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-8 text-sm text-muted-foreground">
        Nothing to display yet.
      </div>
    )
  }

  const cached = isCacheableModuleStepperStep(activeStep.type)
    ? contentCacheRef.current[activeStep.id]
    : null

  const content =
    cached ??
    (() => {
      switch (activeStep.type) {
        case "video":
          return (
            <ModuleStepperFrame>
              <VideoSection
                embedUrl={embedUrl}
                videoUrl={videoUrl}
                fallbackUrl={fallbackUrl}
                variant="frame"
                className="h-full w-full"
              />
            </ModuleStepperFrame>
          )
        case "notes":
          return lessonNotesContent ? (
            <LessonNotes title={moduleTitle} content={lessonNotesContent} />
          ) : null
        case "resources":
          return (
            <ModuleStepperResourcesStep
              resources={resources ?? []}
              moduleId={moduleId}
              hasDeck={hasDeck}
            />
          )
        case "assignment":
          if (!hydrated) return null
          return (
            <AssignmentFormLazy
              mode="stepper"
              activeSectionId={activeStep.sectionId}
              fields={assignmentFields}
              initialValues={initialValues}
              roadmapStatusBySectionId={roadmapStatusBySectionId}
              pending={pending}
              onSubmit={onSubmit}
              statusLabel={statusLabel}
              statusVariant={statusVariant}
              statusNote={statusNote}
              helperText={helperText}
              errorMessage={errorMessage}
              updatedAt={updatedAt}
              completeOnSubmit={completeOnSubmit}
              moduleId={moduleId}
              moduleTitle={moduleTitle}
              classTitle={classTitle}
            />
          )
        case "complete":
          return (
            <ModuleStepperCompleteStep
              completionCount={completionCount}
              moduleCount={moduleCount}
              progressPercent={progressPercent}
              breakHref={breakHref}
              nextHref={nextHref}
              nextLocked={nextLocked}
              schedulePending={schedulePending}
              coachingTier={coachingTier}
              coachingRemaining={coachingRemaining}
              onContinue={onContinue}
              onSchedule={onSchedule}
            />
          )
        default:
          return null
      }
    })()

  if (!cached && isCacheableModuleStepperStep(activeStep.type)) {
    contentCacheRef.current[activeStep.id] = content
  }

  return content
}
