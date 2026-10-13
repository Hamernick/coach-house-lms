"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { markModuleCompleteAction } from "@/app/actions/module-progress"
import { ShellContentHeaderPortal } from "@/components/app-shell/shell-content-portal"
import { StepperRail } from "@/components/ui/stepper-rail"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import type { CoachingTier } from "@/lib/meetings"
import { cn } from "@/lib/utils"

import { buildAssignmentSections } from "./assignment-sections"
import { ModuleStepperActiveStepContent } from "./module-stepper-active-step-content"
import {
  buildModuleStepperRailSteps,
  buildModuleStepperSteps,
  resolveModuleCompletionCount,
} from "./module-stepper-helpers"
import { useModuleStepperCompletionEffects } from "./module-stepper/hooks/use-module-stepper-completion-effects"
import { useModuleStepperNavigationState } from "./module-stepper/hooks/use-module-stepper-navigation-state"
import type { ModuleStepperProps } from "./module-stepper-types"

export function ModuleStepper({
  moduleId,
  moduleTitle,
  moduleSubtitle,
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
  nextHref,
  breakHref = "/organization",
  nextLocked = false,
  moduleCount,
  completedModuleCount,
  isCurrentModuleCompleted,
  stepperPlacement = "body",
  showModuleHeading = true,
}: ModuleStepperProps) {
  const router = useRouter()
  const { tabSections } = useMemo(() => buildAssignmentSections(assignmentFields), [assignmentFields])
  const contentCacheRef = useRef<Record<string, ReactNode>>({})
  const { schedule, pending: schedulePending } = useCoachingBooking()
  const [coachingTier, setCoachingTier] = useState<CoachingTier | null>(null)
  const [coachingRemaining, setCoachingRemaining] = useState<number | null>(null)

  const steps = useMemo(
    () =>
      buildModuleStepperSteps({
        embedUrl,
        videoUrl,
        fallbackUrl,
        lessonNotesContent,
        resources,
        hasDeck,
        assignmentFields,
        tabSections,
      }),
    [assignmentFields, embedUrl, fallbackUrl, hasDeck, lessonNotesContent, resources, tabSections, videoUrl],
  )

  const { activeIndex, setActiveIndex, hydrated } = useModuleStepperNavigationState({
    moduleId,
    stepCount: steps.length,
  })
  const activeStep = steps[activeIndex]
  const totalSteps = steps.length
  const ModuleIcon = getTrackIcon(classTitle)

  const completionCount = useMemo(
    () =>
      resolveModuleCompletionCount({
        activeStepType: activeStep?.type,
        isCurrentModuleCompleted,
        moduleCount,
        completedModuleCount,
      }),
    [activeStep?.type, completedModuleCount, isCurrentModuleCompleted, moduleCount],
  )
  const progressPercent = moduleCount > 0 ? Math.round((completionCount / moduleCount) * 100) : 0
  const useHeaderStepper = stepperPlacement === "header"
  const showBodyStepperContext = !useHeaderStepper || showModuleHeading
  const stepperVariant = useHeaderStepper ? "header" : "default"
  const railSteps = useMemo(
    () =>
      buildModuleStepperRailSteps({
        steps,
        activeIndex,
      }),
    [activeIndex, steps],
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const detail = { activeIndex, totalSteps }
    window.dispatchEvent(new CustomEvent("coachhouse:module-step:update", { detail }))
  }, [activeIndex, totalSteps])

  useEffect(() => {
    contentCacheRef.current = {}
  }, [moduleId, steps.length])

  const markModuleComplete = useCallback(() => {
    return markModuleCompleteAction(moduleId)
  }, [moduleId])

  useModuleStepperCompletionEffects({
    moduleId,
    activeStep,
    markModuleComplete,
  })

  const handleContinue = useCallback(async () => {
    if (!nextHref) return
    router.push(nextHref)
    void markModuleComplete().catch(() => {
      // non-blocking best-effort completion sync
    })
  }, [markModuleComplete, nextHref, router])

  const handleSchedule = useCallback(async () => {
    const payload = await schedule()
    if (!payload) return
    if (payload.tier) {
      setCoachingTier(payload.tier)
    }
    if (payload.remaining === null || typeof payload.remaining === "number") {
      setCoachingRemaining(payload.remaining ?? null)
    }
  }, [schedule])

  const stepperRail = (
    <StepperRail
      steps={railSteps}
      activeIndex={activeIndex}
      onChange={setActiveIndex}
      pageSize={5}
      variant={stepperVariant}
    />
  )

  return (
    <>
      {useHeaderStepper ? (
        <ShellContentHeaderPortal>
          <header className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
                <ModuleIcon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 flex-col gap-0.5 text-left">
                <p className="truncate text-sm font-semibold text-foreground">{moduleTitle}</p>
                {moduleSubtitle ? (
                  <p className="truncate text-xs text-muted-foreground">{moduleSubtitle}</p>
                ) : null}
              </div>
            </div>
            <div className="flex w-full min-w-0 items-center justify-center lg:ml-auto lg:w-auto lg:max-w-[560px] lg:justify-end">
              {stepperRail}
            </div>
          </header>
        </ShellContentHeaderPortal>
      ) : null}

      <section
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col py-6",
          showBodyStepperContext ? "gap-8" : "gap-0",
          activeStep?.type === "video" && "min-h-[clamp(420px,68vh,760px)] justify-center",
        )}
      >
        {showBodyStepperContext ? (
          <div className="space-y-3 text-left">
            {!useHeaderStepper && showModuleHeading ? (
              <div className="space-y-1" aria-live="polite">
                <p className="text-sm font-semibold text-foreground">{moduleTitle}</p>
                {moduleSubtitle ? (
                  <p className="text-xs text-muted-foreground">{moduleSubtitle}</p>
                ) : null}
              </div>
            ) : null}
            {!useHeaderStepper ? stepperRail : null}
          </div>
        ) : null}

        <div
          className={cn(
            "w-full",
            activeStep?.type === "video"
              ? "flex min-h-[clamp(360px,62vh,680px)] items-center justify-center"
              : "min-h-[360px]",
            activeStep?.type === "assignment" && "flex min-h-[calc(100vh-320px)]",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep?.id ?? "empty"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "w-full",
                activeStep?.type === "video" && "mx-auto max-w-[min(1100px,100%)]",
                activeStep?.type === "assignment" && "flex min-h-0 flex-1",
              )}
            >
              <ModuleStepperActiveStepContent
                activeStep={activeStep}
                hydrated={hydrated}
                contentCacheRef={contentCacheRef}
                moduleId={moduleId}
                moduleTitle={moduleTitle}
                classTitle={classTitle}
                embedUrl={embedUrl}
                videoUrl={videoUrl}
                fallbackUrl={fallbackUrl}
                hasDeck={hasDeck}
                lessonNotesContent={lessonNotesContent}
                resources={resources}
                assignmentFields={assignmentFields}
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
                moduleCount={moduleCount}
                breakHref={breakHref}
                nextHref={nextHref}
                nextLocked={nextLocked}
                completionCount={completionCount}
                progressPercent={progressPercent}
                schedulePending={schedulePending}
                coachingTier={coachingTier}
                coachingRemaining={coachingRemaining}
                onContinue={() => void handleContinue()}
                onSchedule={() => void handleSchedule()}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
