"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"

import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { NotificationsMenu } from "@/components/notifications/notifications-menu"
import { SupportMenu } from "@/components/support-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { LessonNotes } from "./lesson-notes"
import { VideoSection } from "./video-section"
import { ResourcesCard } from "../resources-card"
import { DeckViewer } from "./deck-viewer"
import { buildAssignmentSections } from "./assignment-sections"
import type { ModuleAssignmentField, ModuleResource } from "../types"
import type { AssignmentValues } from "./utils"

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

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

type Step =
  | { id: string; label: string; type: "video" }
  | { id: string; label: string; type: "deck" }
  | { id: string; label: string; type: "notes" }
  | { id: string; label: string; type: "resources" }
  | { id: string; label: string; type: "assignment"; sectionId: string; description?: string }
  | { id: string; label: string; type: "complete" }

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
  moduleIndex: number | null
  moduleCount: number
  isAdmin?: boolean
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
  moduleIndex,
  moduleCount,
  isAdmin = false,
}: ModuleStepperProps) {
  const { tabSections } = useMemo(() => buildAssignmentSections(assignmentFields), [assignmentFields])
  const railRef = useRef<HTMLDivElement | null>(null)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const celebratePlayedRef = useRef(false)
  const [railOverflow, setRailOverflow] = useState(false)
  const [railFade, setRailFade] = useState({ left: false, right: false })

  const steps = useMemo(() => {
    const list: Step[] = []
    if (embedUrl || videoUrl || fallbackUrl) {
      list.push({ id: "video", label: "Lesson video", type: "video" })
    }
    if (hasDeck) {
      list.push({ id: "deck", label: "Slide deck", type: "deck" })
    }
    if (lessonNotesContent) {
      list.push({ id: "notes", label: "Lesson notes", type: "notes" })
    }
    if (resources && resources.length > 0) {
      list.push({ id: "resources", label: "Resources", type: "resources" })
    }
    if (assignmentFields.length > 0) {
      tabSections.forEach((section, index) => {
        if (section.fields.length === 0) return
        list.push({
          id: `assignment-${section.id}`,
          label: section.title ?? `Step ${index + 1}`,
          type: "assignment",
          sectionId: section.id,
          description: section.description,
        })
      })
    }
    list.push({ id: "complete", label: "Congratulations", type: "complete" })
    return list
  }, [assignmentFields.length, embedUrl, fallbackUrl, hasDeck, lessonNotesContent, resources, tabSections, videoUrl])

  const [activeIndex, setActiveIndex] = useState(0)
  const [schedulePending, setSchedulePending] = useState(false)
  const activeStep = steps[activeIndex]
  const totalSteps = steps.length
  const stepDescription = activeStep?.type === "assignment" ? activeStep.description : null
  const moduleProgressIndex = moduleIndex != null ? moduleIndex + 1 : null
  const progressPercent =
    moduleCount > 0 && moduleProgressIndex != null
      ? Math.round((moduleProgressIndex / moduleCount) * 100)
      : 0
  const railProgress =
    totalSteps > 1 ? Math.round((activeIndex / (totalSteps - 1)) * 100) : 0

  const deckShellActions = useMemo(
    () => (
      <>
        <NotificationsMenu />
        <ThemeToggle />
        {!isAdmin ? (
          <SupportMenu
            email={SUPPORT_EMAIL}
            host="joel"
            buttonVariant="ghost"
            buttonSize="sm"
            buttonClassName="h-8 px-2 text-xs font-medium"
          />
        ) : null}
      </>
    ),
    [isAdmin],
  )

  useEffect(() => {
    setActiveIndex((prev) => Math.min(Math.max(prev, 0), Math.max(steps.length - 1, 0)))
  }, [steps.length])

  useEffect(() => {
    const target = stepRefs.current[activeIndex]
    if (!target) return
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    try {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      })
    } catch {
      // ignore scroll failures
    }
  }, [activeIndex])

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

  const handleSchedule = async () => {
    if (schedulePending) return
    setSchedulePending(true)
    try {
      const response = await fetch("/api/meetings/schedule?host=joel", { method: "GET" })
      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string }
      if (!response.ok) {
        toast.error(payload.error ?? "Unable to schedule a meeting right now.")
        return
      }
      if (!payload.url) {
        toast.error("Scheduling link unavailable.")
        return
      }
      window.open(payload.url, "_blank", "noopener,noreferrer")
      toast.success("Opening your scheduling link.")
    } catch (error) {
      console.error(error)
      toast.error("Unable to schedule a meeting right now.")
    } finally {
      setSchedulePending(false)
    }
  }

  useEffect(() => {
    const el = railRef.current
    if (!el) return

    const updateFade = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      const hasOverflow = maxScroll > 4
      setRailOverflow(hasOverflow)
      setRailFade({
        left: el.scrollLeft > 6,
        right: el.scrollLeft < maxScroll - 6,
      })
    }

    updateFade()
    el.addEventListener("scroll", updateFade, { passive: true })

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateFade)
      observer.observe(el)
    } else {
      window.addEventListener("resize", updateFade)
    }

    return () => {
      el.removeEventListener("scroll", updateFade)
      observer?.disconnect()
      if (!observer) {
        window.removeEventListener("resize", updateFade)
      }
    }
  }, [steps.length])

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
      <div className="space-y-3 text-center">
        <div className="space-y-1 text-center" aria-live="polite">
          <p className="text-sm font-semibold text-foreground">{moduleTitle}</p>
          {moduleSubtitle ? (
            <p className="text-xs text-muted-foreground">{moduleSubtitle}</p>
          ) : null}
        </div>
        {stepDescription ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{stepDescription}</p>
        ) : null}
        <div className="relative w-full">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 z-30 h-9 w-9 -translate-y-1/2 rounded-full"
            onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
            disabled={activeIndex <= 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={railRef}
            className="relative w-full overflow-x-auto pb-2 pt-2 scroll-px-[var(--rail-pad)]"
            style={{ ["--dot-size" as string]: "32px", ["--rail-pad" as string]: "56px" }}
          >
            {railOverflow ? (
              <>
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-background via-background/80 to-transparent transition-opacity",
                    railFade.left ? "opacity-100" : "opacity-0",
                  )}
                />
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity",
                    railFade.right ? "opacity-100" : "opacity-0",
                  )}
                />
              </>
            ) : null}
            <div
              className="relative mx-auto flex w-max items-center justify-center gap-4 px-[var(--rail-pad)] py-2 md:gap-5"
            >
              <div className="absolute left-[calc(var(--rail-pad)+var(--dot-size)/2)] right-[calc(var(--rail-pad)+var(--dot-size)/2)] top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-sky-400"
                  animate={{ width: `${railProgress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            {steps.map((step, idx) => {
              const isActive = idx === activeIndex
              const status: StepStatus =
                idx < activeIndex ? "complete" : isActive ? "in_progress" : "not_started"
              const styles =
                status === "complete"
                  ? {
                      border: "border-emerald-500",
                      text: "text-emerald-500",
                      icon: <CheckIcon className="h-4 w-4" />,
                      dashed: false,
                    }
                  : status === "in_progress"
                    ? {
                        border: "border-amber-500",
                        text: "text-amber-500",
                        icon: <span className="text-[11px] font-semibold">{idx + 1}</span>,
                        dashed: true,
                      }
                    : {
                        border: "border-muted-foreground/60",
                        text: "text-muted-foreground",
                        icon: <span className="text-[11px] font-semibold">{idx + 1}</span>,
                        dashed: false,
                      }
              return (
                <button
                  key={step.id}
                  type="button"
                  title={step.label}
                  aria-label={`Go to ${step.label}`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => setActiveIndex(idx)}
                  ref={(el) => {
                    stepRefs.current[idx] = el
                  }}
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background transition scroll-mx-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    styles.border,
                    status === "not_started" && "hover:border-foreground/40",
                  )}
                  style={{ borderStyle: styles.dashed ? "dashed" : "solid" }}
                >
                  <span className={cn("flex h-5 w-5 items-center justify-center", styles.text)}>
                    {styles.icon}
                  </span>
                </button>
              )
            })}
          </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 z-30 h-9 w-9 -translate-y-1/2 rounded-full"
            onClick={() => setActiveIndex((prev) => Math.min(prev + 1, steps.length - 1))}
            disabled={activeIndex >= steps.length - 1}
            aria-label="Next step"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep?.id ?? "empty"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {(() => {
              if (!activeStep) {
                return (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-8 text-sm text-muted-foreground">
                    Nothing to display yet.
                  </div>
                )
              }
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
                case "deck":
                  return (
                    <StepFrame>
                      <DeckViewer
                        moduleId={moduleId}
                        hasDeck={hasDeck}
                        variant="frame"
                        className="h-full w-full"
                        showPreviewTrigger={false}
                        inlinePreview
                        shellActions={deckShellActions}
                      />
                    </StepFrame>
                  )
                case "notes":
                  return lessonNotesContent ? (
                    <LessonNotes title={moduleTitle} content={lessonNotesContent} />
                  ) : null
                case "resources":
                  return resources && resources.length > 0 ? (
                    <ResourcesCard resources={resources} />
                  ) : null
                case "assignment":
                  return (
                    <AssignmentFormLazy
                      mode="stepper"
                      activeSectionId={activeStep.sectionId}
                      fields={assignmentFields}
                      initialValues={initialValues}
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
                            {moduleProgressIndex != null ? moduleProgressIndex : 0} of {moduleCount} modules
                          </span>
                        </div>
                        <div className="mx-auto h-2 w-full max-w-md rounded-full border border-dashed border-border/70 bg-muted/30">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-[width]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
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
                        </ItemContent>
                        <ItemActions>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSchedule}
                            disabled={schedulePending}
                          >
                            {schedulePending ? "Opening..." : "Book a session"}
                          </Button>
                        </ItemActions>
                      </Item>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Button variant="outline" asChild className="rounded-full px-5">
                          <Link href="/dashboard">Take a break</Link>
                        </Button>
                        {nextHref ? (
                          <Button asChild className="rounded-full px-5">
                            <Link href={nextHref}>Continue to next lesson</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                default:
                  return null
              }
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
