"use client"

import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import FolderOpen from "lucide-react/dist/esm/icons/folder-open"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import { Button } from "@/components/ui/button"
import { StepperRail, type StepperRailStep } from "@/components/ui/stepper-rail"
import { ShellContentHeaderPortal } from "@/components/app-shell/shell-content-portal"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"
import type { CoachingTier } from "@/lib/meetings"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"
import { LessonNotes } from "./lesson-notes"
import { VideoSection } from "./video-section"
import { ResourcesCard } from "../resources-card"
import { DeckResourceCard } from "../deck-resource-card"
import { buildAssignmentSections } from "./assignment-sections"
import type { ModuleAssignmentField, ModuleResource } from "../types"
import type { AssignmentValues } from "./utils"
import { markModuleCompleteAction } from "@/app/actions/module-progress"
import type { RoadmapSectionStatus } from "@/lib/roadmap"

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

type Step =
  | { id: string; label: string; type: "video"; stepIndex?: number }
  | { id: string; label: string; type: "notes"; stepIndex?: number }
  | { id: string; label: string; type: "resources"; stepIndex?: number }
  | {
      id: string
      label: string
      type: "assignment"
      sectionId: string
      description?: string
      roadmap?: boolean
      assignmentIndex?: number
      stepIndex?: number
    }
  | { id: string; label: string; type: "complete"; stepIndex?: number }

type StepStatus = "not_started" | "in_progress" | "complete"

type ModuleStepperProps = {
  moduleId: string
  moduleTitle: string
  moduleSubtitle?: string | null
  classTitle: string
  embedUrl: string | null
  videoUrl: string | null
  fallbackUrl: string | null
  hasDeck: boolean
  lessonNotesContent?: string | null
  resources?: ModuleResource[]
  assignmentFields: ModuleAssignmentField[]
  initialValues: AssignmentValues
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  pending: boolean
  onSubmit: (values: AssignmentValues, options?: { silent?: boolean }) => void
  statusLabel?: string | null
  statusVariant?: "default" | "secondary" | "destructive" | "outline"
  statusNote?: string | null
  helperText?: string | null
  errorMessage?: string | null
  updatedAt?: string | null
  completeOnSubmit: boolean
  nextHref?: string | null
  breakHref?: string
  nextLocked?: boolean
  moduleCount: number
  completedModuleCount: number
  isCurrentModuleCompleted: boolean
  stepperPlacement?: "header" | "body"
  showModuleHeading?: boolean
}

type StepFrameProps = {
  children: ReactNode
  scrollable?: boolean
  padded?: boolean
  fitContent?: boolean
}

function StepFrame({ children, scrollable = false, padded = false, fitContent = false }: StepFrameProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm",
          fitContent ? "" : "aspect-[4/5] sm:aspect-[16/9]",
        )}
      >
        <div
          className={cn(
            fitContent ? "w-full" : "h-full w-full",
            scrollable ? "overflow-y-auto" : "overflow-hidden",
            padded ? "p-6" : "",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function CelebrationIcon() {
  return (
    <motion.span
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-gradient-to-br from-primary via-indigo-500 to-sky-400 text-white shadow-sm"
      initial={{ scale: 0.8, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Sparkles className="h-5 w-5 text-white" />
    </motion.span>
  )
}

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
  const celebratePlayedRef = useRef(false)
  const contentCacheRef = useRef<Record<string, ReactNode>>({})
  const completionMarkedRef = useRef(false)

  const steps = useMemo(() => {
    const list: Step[] = []
    let assignmentIndex = 0
    if (embedUrl || videoUrl || fallbackUrl) {
      list.push({ id: "video", label: "Lesson video", type: "video" })
    }
    if (lessonNotesContent) {
      list.push({ id: "notes", label: "Lesson notes", type: "notes" })
    }
    if ((resources && resources.length > 0) || hasDeck) {
      list.push({ id: "resources", label: "Resources", type: "resources" })
    }
    if (assignmentFields.length > 0) {
      tabSections.forEach((section, index) => {
        if (section.fields.length === 0) return
        const isRoadmap = section.fields.some((field) => Boolean(field.roadmapSectionId))
        assignmentIndex += 1
        list.push({
          id: `assignment-${section.id}`,
          label: section.title ?? `Step ${index + 1}`,
          type: "assignment",
          sectionId: section.id,
          description: section.description,
          roadmap: isRoadmap,
          assignmentIndex,
        })
      })
    }
    list.push({ id: "complete", label: "Congratulations", type: "complete" })
    return list.map((step, index) => ({ ...step, stepIndex: index + 1 }))
  }, [assignmentFields.length, embedUrl, fallbackUrl, hasDeck, lessonNotesContent, resources, tabSections, videoUrl])

  const [activeIndex, setActiveIndex] = useState(0)
  const { schedule, pending: schedulePending } = useCoachingBooking()
  const [coachingTier, setCoachingTier] = useState<CoachingTier | null>(null)
  const [coachingRemaining, setCoachingRemaining] = useState<number | null>(null)
  const ModuleIcon = getTrackIcon(classTitle)
  const activeStep = steps[activeIndex]
  const totalSteps = steps.length
  const completionCount = useMemo(() => {
    const completedFromServer = Math.max(0, Math.min(moduleCount, completedModuleCount))
    if (activeStep?.type !== "complete" || isCurrentModuleCompleted) {
      return completedFromServer
    }
    return Math.min(moduleCount, completedFromServer + 1)
  }, [activeStep?.type, completedModuleCount, isCurrentModuleCompleted, moduleCount])
  const progressPercent =
    moduleCount > 0 ? Math.round((completionCount / moduleCount) * 100) : 0
  const useHeaderStepper = stepperPlacement === "header"
  const stepperPageSize = 5
  const stepperVariant = useHeaderStepper ? "header" : "default"
  const [hydrated, setHydrated] = useState(false)
  const railSteps = useMemo<StepperRailStep[]>(() => {
    return steps.map((step, index) => {
      const isLast = index === steps.length - 1
      const status: StepStatus =
        index < activeIndex || (isLast && index === activeIndex)
          ? "complete"
          : index === activeIndex
            ? "in_progress"
            : "not_started"
      const isRoadmapStep = step.type === "assignment" && step.roadmap
      return {
        id: step.id,
        label: step.label,
        status,
        roadmap: isRoadmapStep,
        stepIndex: step.stepIndex,
      }
    })
  }, [activeIndex, steps])

  useEffect(() => {
    if (typeof window === "undefined") return
    const detail = { activeIndex, totalSteps }
    window.dispatchEvent(new CustomEvent("coachhouse:module-step:update", { detail }))
  }, [activeIndex, totalSteps])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    contentCacheRef.current = {}
    completionMarkedRef.current = false
    setActiveIndex((prev) => {
      if (typeof window === "undefined") return 0
      const stored = window.sessionStorage.getItem(`module-step-${moduleId}`)
      const parsed = stored != null ? Number.parseInt(stored, 10) : NaN
      const next = Number.isFinite(parsed) && parsed >= 0 && parsed < steps.length ? parsed : 0
      return Math.min(next, steps.length - 1)
    })
  }, [moduleId, steps.length])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.sessionStorage.setItem(`module-step-${moduleId}`, String(activeIndex))
    } catch {
      // ignore storage failures
    }
  }, [activeIndex, moduleId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handlePrev = () => {
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    }
    const handleNext = () => {
      setActiveIndex((prev) => Math.min(prev + 1, steps.length - 1))
    }
    window.addEventListener("coachhouse:module-step:prev", handlePrev as EventListener)
    window.addEventListener("coachhouse:module-step:next", handleNext as EventListener)
    return () => {
      window.removeEventListener("coachhouse:module-step:prev", handlePrev as EventListener)
      window.removeEventListener("coachhouse:module-step:next", handleNext as EventListener)
    }
  }, [steps.length])

  useEffect(() => {
    if (activeStep?.type === "complete" && !completionMarkedRef.current) {
      completionMarkedRef.current = true
      void markModuleCompleteAction(moduleId)
      try {
        window.sessionStorage.setItem(`module-complete-${moduleId}`, "true")
      } catch {
        // ignore
      }
    }
  }, [activeStep?.id, activeStep?.type, moduleId])

  const handleContinue = useCallback(async () => {
    if (!nextHref) return
    router.push(nextHref)
    void markModuleCompleteAction(moduleId).catch(() => {
      // non-blocking best-effort completion sync
    })
  }, [moduleId, nextHref, router])

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

  useEffect(() => {
    celebratePlayedRef.current = false
  }, [moduleId])

  useEffect(() => {
    if (activeStep?.type !== "complete" || celebratePlayedRef.current) return
    celebratePlayedRef.current = true
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = "triangle"
      oscillator.frequency.value = 880
      gain.gain.value = 0.0001
      oscillator.connect(gain)
      gain.connect(context.destination)
      const now = context.currentTime
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
      oscillator.start(now)
      oscillator.stop(now + 0.42)
      oscillator.onended = () => context.close().catch(() => null)
    } catch {
      // Ignore audio errors or autoplay restrictions.
    }
  }, [activeStep?.type])


  const stepperRail = (
    <StepperRail
      steps={railSteps}
      activeIndex={activeIndex}
      onChange={setActiveIndex}
      pageSize={stepperPageSize}
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

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
        <div className="space-y-3 text-left">
          {!useHeaderStepper && showModuleHeading ? (
            <div className="space-y-1" aria-live="polite">
              <p className="text-sm font-semibold text-foreground">{moduleTitle}</p>
              {moduleSubtitle ? (
                <p className="text-xs text-muted-foreground">{moduleSubtitle}</p>
              ) : null}
            </div>
          ) : null}
          {/* Hide step descriptions to avoid duplicating field helper copy */}
          {!useHeaderStepper ? stepperRail : null}
        </div>

        <div
          className={cn(
            "min-h-[360px]",
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
              className={cn(activeStep?.type === "assignment" && "flex min-h-0 flex-1")}
            >
              {(() => {
                if (!activeStep) {
                  return (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-8 text-sm text-muted-foreground">
                      Nothing to display yet.
                    </div>
                  )
                }

              const cacheableTypes = new Set<Step["type"]>(["video", "resources", "notes", "complete"])
                const cached = cacheableTypes.has(activeStep.type)
                  ? contentCacheRef.current[activeStep.id]
                  : null

                const content =
                  cached ??
                  (() => {
                    switch (activeStep.type) {
                      case "video":
                        return (
                          <StepFrame>
                            <VideoSection
                              embedUrl={embedUrl}
                              videoUrl={videoUrl}
                              fallbackUrl={fallbackUrl}
                              variant="frame"
                              className="h-full w-full"
                            />
                          </StepFrame>
                        )
                      case "notes":
                        return lessonNotesContent ? (
                          <LessonNotes title={moduleTitle} content={lessonNotesContent} />
                        ) : null
                      case "resources":
                        return (
                          <div className="space-y-6">
                            <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground">
                                <FolderOpen className="h-5 w-5" aria-hidden />
                              </span>
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">Resources</h3>
                                <p className="text-xs text-muted-foreground">
                                  Links and downloads that support this lesson.
                                </p>
                              </div>
                            </div>
                            <Separator className="bg-border/60" />
                            <ResourcesCard resources={resources ?? []}>
                              <DeckResourceCard moduleId={moduleId} hasDeck={hasDeck} />
                            </ResourcesCard>
                          </div>
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
                          <div className="space-y-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10">
                            <div className="flex items-center justify-center">
                              <CelebrationIcon />
                            </div>
                            <div className="space-y-2 text-center">
                              <h3 className="text-2xl font-semibold text-foreground">Congratulations</h3>
                              <p className="text-sm text-muted-foreground">
                                You finished this module. Take a break or keep building momentum.
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  {completionCount} of {moduleCount} modules
                                </span>
                              </div>
                              <div className="mx-auto h-2 w-full max-w-md rounded-full border border-dashed border-border/70 bg-muted/30">
                                <div
                                  className="h-full rounded-full bg-primary/70 transition-[width]"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                              <Button variant="outline" asChild className="rounded-full px-5">
                                <Link href={breakHref}>Take a break</Link>
                              </Button>
                              {nextHref ? (
                                nextLocked ? (
                                  <Button variant="outline" className="rounded-full px-5" disabled>
                                    Next lesson locked
                                  </Button>
                                ) : (
                                  <Button className="rounded-full px-5" onClick={handleContinue}>
                                    Continue to next lesson
                                  </Button>
                                )
                              ) : null}
                            </div>
                            <Item className="mx-auto max-w-md">
                              <ItemMedia>
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                                  <CalendarCheck className="h-4 w-4" aria-hidden />
                                </span>
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>Book a session</ItemTitle>
                                <ItemDescription>
                                  Review this module, ask questions, or plan next steps.
                                </ItemDescription>
                                <div className="pt-2">
                                  <CoachingAvatarGroup size="sm" />
                                </div>
                                {coachingTier === "free" && typeof coachingRemaining === "number" && coachingRemaining > 0 ? (
                                  <p className="pt-2 text-xs text-muted-foreground">
                                    {coachingRemaining} included session{coachingRemaining === 1 ? "" : "s"} remaining.
                                  </p>
                                ) : null}
                                {coachingTier === "free" && coachingRemaining === 0 ? (
                                  <p className="pt-2 text-xs text-muted-foreground">
                                    Included sessions complete. Your next bookings use the discounted calendar.
                                  </p>
                                ) : null}
                                {coachingTier === "discounted" ? (
                                  <p className="pt-2 text-xs text-muted-foreground">
                                    Included sessions complete. You are now booking at the discounted coaching rate.
                                  </p>
                                ) : null}
                                {coachingTier === "full" ? (
                                  <p className="pt-2 text-xs text-muted-foreground">
                                    Coaching booking opened in a new tab.
                                  </p>
                                ) : null}
                              </ItemContent>
                              <ItemActions>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => void handleSchedule()}
                                  disabled={schedulePending}
                                >
                                  {schedulePending ? "Opening..." : "Book a session"}
                                </Button>
                              </ItemActions>
                            </Item>
                          </div>
                        )
                      default:
                        return null
                    }
                  })()

                if (!cached && cacheableTypes.has(activeStep.type)) {
                  contentCacheRef.current[activeStep.id] = content
                }

                return content
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
