"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Waypoints from "lucide-react/dist/esm/icons/waypoints"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StepperRailStatus = "not_started" | "in_progress" | "complete"

export type StepperRailStep = {
  id: string
  label: string
  status: StepperRailStatus
  roadmap?: boolean
  stepIndex?: number
  icon?: ReactNode
  description?: string
}

type StepperRailProps = {
  steps: StepperRailStep[]
  activeIndex: number
  onChange: (index: number) => void
  pageSize?: number
  variant?: "header" | "default" | "roadmap"
  showControls?: boolean
  className?: string
}

export function StepperRail({
  steps,
  activeIndex,
  onChange,
  pageSize = 5,
  variant = "default",
  showControls = true,
  className,
}: StepperRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const railItemsRef = useRef<HTMLDivElement | null>(null)
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [railOverflow, setRailOverflow] = useState(false)
  const [railFade, setRailFade] = useState({ left: false, right: false })
  const [mounted, setMounted] = useState(false)
  const [roadmapLine, setRoadmapLine] = useState<{
    startPct: number
    endPct: number
    progressPct: number
  } | null>(null)

  const totalSteps = steps.length
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(totalSteps - 1, 0))
  const lastPageStart = Math.max(0, totalSteps - pageSize)
  const rawPageStart = Math.floor(safeActiveIndex / pageSize) * pageSize
  const pageStart = Math.min(rawPageStart, lastPageStart)
  const visibleSteps = steps.slice(pageStart, pageStart + pageSize)
  const visibleIndex = Math.max(0, safeActiveIndex - pageStart)
  const visibleCount = visibleSteps.length
  const pageStartRef = useRef(pageStart)
  const pageDirection = pageStart >= pageStartRef.current ? 1 : -1
  const railProgress = visibleCount > 1 ? Math.round((visibleIndex / (visibleCount - 1)) * 100) : 0

  const isRoadmap = variant === "roadmap"
  const stepperLayout = isRoadmap
    ? { railPad: "0px", dotSize: "40px", buttonSize: "h-9 w-9", railPadding: "py-1" }
    : variant === "header"
      ? { railPad: "24px", dotSize: "32px", buttonSize: "h-9 w-9", railPadding: "py-0.5" }
      : { railPad: "56px", dotSize: "32px", buttonSize: "h-9 w-9", railPadding: "py-2" }
  const railAlignment = variant === "header" ? "mx-0" : "mx-auto"
  const railGap = variant === "header" ? "gap-2" : isRoadmap ? "gap-0" : "gap-4 md:gap-5"
  const railContainerClass = variant === "header" ? "w-max" : "min-w-0 flex-1"
  const stepperShellClass = variant === "header" ? "w-max" : "w-full"
  const railInnerClass = isRoadmap
    ? "w-full justify-between gap-6"
    : cn("w-max", railAlignment, railGap)
  const railItemsClass = isRoadmap ? "items-start" : "items-center"
  const railLineClass = isRoadmap
    ? "top-[calc(var(--dot-size)/2+1px)]"
    : "top-1/2"

  const updateRoadmapLine = useCallback(() => {
    if (!isRoadmap) return
    const railItems = railItemsRef.current
    if (!railItems) return
    const itemsRect = railItems.getBoundingClientRect()
    if (itemsRect.width <= 0) return

    const centers: Array<number | null> = Array.from({ length: visibleCount }, () => null)
    for (let idx = 0; idx < visibleCount; idx += 1) {
      const globalIndex = pageStart + idx
      const step = stepRefs.current[globalIndex]
      if (!step) continue
      const iconNode =
        step.querySelector<HTMLElement>("[data-stepper-roadmap-icon='true']") ??
        step
      const iconRect = iconNode.getBoundingClientRect()
      centers[idx] = iconRect.left + iconRect.width / 2 - itemsRect.left
    }

    const validCenters = centers.filter((value): value is number => typeof value === "number")

    if (validCenters.length === 0) {
      setRoadmapLine(null)
      return
    }

    const start = validCenters[0]
    const end = validCenters[validCenters.length - 1]
    const activeCenterIndex = Math.min(Math.max(visibleIndex, 0), centers.length - 1)
    const active =
      centers[activeCenterIndex] ??
      validCenters[Math.min(activeCenterIndex, validCenters.length - 1)] ??
      start
    const startPct = (start / itemsRect.width) * 100
    const endPct = ((itemsRect.width - end) / itemsRect.width) * 100
    const progressPct = end > start ? ((active - start) / (end - start)) * 100 : 0

    setRoadmapLine((prev) => {
      if (
        prev &&
        Math.abs(prev.startPct - startPct) < 0.1 &&
        Math.abs(prev.endPct - endPct) < 0.1 &&
        Math.abs(prev.progressPct - progressPct) < 0.1
      ) {
        return prev
      }
      return { startPct, endPct, progressPct }
    })
  }, [isRoadmap, pageStart, visibleCount, visibleIndex])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isRoadmap) return
    const target = stepRefs.current[safeActiveIndex]
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
  }, [isRoadmap, mounted, safeActiveIndex])

  useEffect(() => {
    if (!mounted || isRoadmap) return
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
  }, [isRoadmap, mounted, pageStart, visibleCount])

  useEffect(() => {
    if (!mounted || !isRoadmap) return
    const frame = requestAnimationFrame(() => {
      updateRoadmapLine()
    })

    const railItems = railItemsRef.current
    if (!railItems || typeof ResizeObserver === "undefined") {
      const onResize = () => updateRoadmapLine()
      window.addEventListener("resize", onResize)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener("resize", onResize)
      }
    }

    const observer = new ResizeObserver(() => {
      updateRoadmapLine()
    })
    observer.observe(railItems)
    for (let idx = 0; idx < visibleCount; idx += 1) {
      const step = stepRefs.current[pageStart + idx]
      if (step) observer.observe(step)
    }

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [isRoadmap, mounted, pageStart, updateRoadmapLine, visibleCount, visibleIndex])

  useEffect(() => {
    pageStartRef.current = pageStart
  }, [pageStart])

  return (
    <div className={cn("flex items-center", showControls ? "gap-2" : "gap-0", stepperShellClass, className)}>
      {showControls ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("shrink-0 rounded-full", stepperLayout.buttonSize)}
          onClick={() => onChange(Math.max(safeActiveIndex - 1, 0))}
          disabled={safeActiveIndex <= 0}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : null}
      <div
        ref={railRef}
        className={cn(
          "relative scroll-px-[var(--rail-pad)]",
          isRoadmap ? "overflow-hidden" : "overflow-x-auto",
          railContainerClass,
          stepperLayout.railPadding,
        )}
        style={{ ["--dot-size" as string]: stepperLayout.dotSize, ["--rail-pad" as string]: stepperLayout.railPad }}
      >
        {railOverflow && !isRoadmap ? (
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
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={pageStart}
            ref={railItemsRef}
            className={cn("relative flex px-[var(--rail-pad)] py-1", railItemsClass, railInnerClass)}
            initial={{ opacity: 0, x: pageDirection * 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: pageDirection * -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div
              className={cn(
                "absolute left-[calc(var(--rail-pad)+var(--dot-size)/2)] right-[calc(var(--rail-pad)+var(--dot-size)/2)] h-[3px] -translate-y-1/2 rounded-full bg-border/60",
                railLineClass,
              )}
              style={
                isRoadmap && roadmapLine
                  ? { left: `${roadmapLine.startPct}%`, right: `${roadmapLine.endPct}%` }
                  : undefined
              }
            >
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  "bg-gradient-to-r from-purple-500 via-blue-500 to-sky-400",
                )}
                animate={{
                  width:
                    isRoadmap && roadmapLine
                      ? `${roadmapLine.progressPct}%`
                      : `${railProgress}%`,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            {visibleSteps.map((step, idx) => {
              const globalIndex = pageStart + idx
              const isActive = globalIndex === safeActiveIndex
              const showNumber = !step.roadmap && step.stepIndex != null
              const numberIcon = showNumber ? (
                <span className="text-[11px] font-semibold tabular-nums leading-none" aria-hidden>
                  {step.stepIndex}
                </span>
              ) : null
              const styles =
                step.status === "complete"
                  ? {
                      border: "border-emerald-500",
                      text: "text-emerald-500",
                      icon: step.roadmap ? <Waypoints className="h-4 w-4" aria-hidden /> : <CheckIcon className="h-4 w-4" aria-hidden />,
                    }
                  : step.status === "in_progress"
                    ? {
                        border: "border-amber-500",
                        text: "text-amber-500",
                        icon: step.roadmap ? <Waypoints className="h-4 w-4" aria-hidden /> : numberIcon,
                      }
                    : {
                        border: "border-muted-foreground/60",
                        text: "text-muted-foreground",
                        icon: step.roadmap ? <Waypoints className="h-4 w-4" aria-hidden /> : numberIcon,
                      }
              const iconNode = isRoadmap
                ? step.icon ?? <Waypoints className="h-5 w-5" aria-hidden />
                : styles.icon
              const roadmapIconTextClass =
                step.status === "complete"
                  ? "text-emerald-600 dark:text-emerald-300"
                  : step.status === "in_progress"
                    ? "text-amber-600 dark:text-amber-300"
                    : "text-muted-foreground"
              const iconTextClass = isRoadmap ? roadmapIconTextClass : styles.text
              return (
                <button
                  key={step.id}
                  type="button"
                  title={step.label}
                  aria-label={`Go to ${step.label}`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => onChange(globalIndex)}
                  ref={(el) => {
                    stepRefs.current[globalIndex] = el
                  }}
                  className={cn(
                    "relative z-10 shrink-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isRoadmap
                      ? "flex min-w-0 flex-1 flex-col items-start gap-2 text-left"
                      : cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background scroll-mx-10",
                          styles.border,
                          step.status === "not_started" && "hover:border-foreground/40",
                        ),
                  )}
                >
                  {isRoadmap ? (
                    <div
                      data-stepper-roadmap-icon="true"
                      className={cn(
                        "flex h-[var(--dot-size)] w-[var(--dot-size)] items-center justify-center rounded-lg border bg-background shadow-sm",
                        step.status === "complete"
                          ? "border-emerald-500/35"
                          : step.status === "in_progress"
                            ? "border-amber-500/35"
                            : "border-border/60",
                      )}
                    >
                      {iconNode ? (
                        <span className={cn("flex h-5 w-5 items-center justify-center", iconTextClass)}>
                          {iconNode}
                        </span>
                      ) : null}
                    </div>
                  ) : iconNode ? (
                    <span className={cn("flex h-5 w-5 items-center justify-center", iconTextClass)}>
                      {iconNode}
                    </span>
                  ) : null}
                  {isRoadmap ? (
                    <span className="space-y-1 text-left">
                      <span className="line-clamp-2 text-sm font-semibold text-foreground">{step.label}</span>
                      {step.description ? (
                        <span className="line-clamp-3 text-xs text-muted-foreground">{step.description}</span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      {showControls ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("shrink-0 rounded-full", stepperLayout.buttonSize)}
          onClick={() => onChange(Math.min(safeActiveIndex + 1, Math.max(totalSteps - 1, 0)))}
          disabled={safeActiveIndex >= totalSteps - 1}
          aria-label="Next step"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
