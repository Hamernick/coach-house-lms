"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type HighlightTourStep = {
  id: string
  selector: string
  title: string
  description: string
  icon?: ReactNode
}

type HighlightTourProps = {
  open: boolean
  steps: HighlightTourStep[]
  onOpenChange: (next: boolean) => void
  onFinish?: () => void
  onDismiss?: () => void
  initialStep?: number
}

type Rect = { top: number; left: number; width: number; height: number }

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getRect(el: Element, padding: number): Rect {
  const rect = el.getBoundingClientRect()
  const top = Math.max(0, rect.top - padding)
  const left = Math.max(0, rect.left - padding)
  const width = Math.min(window.innerWidth - left, rect.width + padding * 2)
  const height = Math.min(window.innerHeight - top, rect.height + padding * 2)
  return { top, left, width, height }
}

function buildRoundedRectPath({ left, top, width, height }: Rect, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const right = left + width
  const bottom = top + height

  return [
    `M ${left + r} ${top}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 1 ${right} ${top + r}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H ${left + r}`,
    `A ${r} ${r} 0 0 1 ${left} ${bottom - r}`,
    `V ${top + r}`,
    `A ${r} ${r} 0 0 1 ${left + r} ${top}`,
    "Z",
  ].join(" ")
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return reduced
}

export function HighlightTour({
  open,
  steps,
  onOpenChange,
  onFinish,
  onDismiss,
  initialStep = 0,
}: HighlightTourProps) {
  const [index, setIndex] = useState(initialStep)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [targetFound, setTargetFound] = useState(true)
  const prefersReducedMotion = usePrefersReducedMotion()

  const step = steps[index]

  const dismiss = useCallback(() => {
    onDismiss?.()
    onOpenChange(false)
  }, [onDismiss, onOpenChange])

  const finish = useCallback(() => {
    onFinish?.()
    onOpenChange(false)
  }, [onFinish, onOpenChange])

  const goNext = useCallback(() => {
    if (index >= steps.length - 1) {
      finish()
      return
    }

    setIndex((prev) => Math.min(steps.length - 1, prev + 1))
  }, [finish, index, steps.length])

  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1))
  }, [])

  useEffect(() => {
    if (!open) return
    setIndex(clamp(initialStep, 0, Math.max(0, steps.length - 1)))
  }, [open, initialStep, steps.length])

  useEffect(() => {
    if (!open) return
    if (!step) return

    const candidates = Array.from(document.querySelectorAll(step.selector))
    const el =
      candidates.find((candidate) => {
        const rect = candidate.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      }) ?? candidates[0]
    if (!el) {
      setTargetRect(null)
      setTargetFound(false)
      return
    }

    setTargetFound(true)

    const scrollContainer = el.closest("[data-tour-scroll]") as HTMLElement | null
    const scrollBehavior = prefersReducedMotion ? "auto" : "smooth"

    if (scrollContainer) {
      el.scrollIntoView({ behavior: scrollBehavior, block: "center", inline: "nearest" })
    } else {
      el.scrollIntoView({ behavior: scrollBehavior, block: "center", inline: "nearest" })
    }

    const padding = 10
    const updateRect = () => setTargetRect(getRect(el, padding))
    updateRect()

    const onResize = () => updateRect()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)

    const observer = new ResizeObserver(() => updateRect())
    observer.observe(el)

    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
      observer.disconnect()
    }
  }, [open, step, prefersReducedMotion])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        dismiss()
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goNext()
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goPrev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dismiss, goNext, goPrev, open])

  const overlayPath = useMemo(() => {
    if (!targetRect) return null
    const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth
    const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight
    if (viewportWidth <= 0 || viewportHeight <= 0) return null

    const outer = `M 0 0 H ${viewportWidth} V ${viewportHeight} H 0 Z`
    const inner = buildRoundedRectPath(targetRect, 16)
    return `${outer} ${inner}`
  }, [targetRect])

  const tooltipStyle = useMemo(() => {
    const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth
    const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight
    const margin = 12
    const width = 360
    const minLeft = 16
    const maxLeft = viewportWidth - width - 16

    if (!targetRect) {
      return { top: Math.max(24, viewportHeight * 0.2), left: clamp((viewportWidth - width) / 2, minLeft, maxLeft), width }
    }

    const belowTop = targetRect.top + targetRect.height + margin
    const aboveTop = targetRect.top - margin
    const canShowBelow = belowTop + 220 < viewportHeight
    const top = canShowBelow ? belowTop : Math.max(24, aboveTop - 220)
    const left = clamp(targetRect.left, minLeft, maxLeft)
    return { top, left, width }
  }, [targetRect])

  if (!open || !step) return null

  const showPrev = index > 0
  const isLast = index === steps.length - 1

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      {!overlayPath ? <div className="pointer-events-auto absolute inset-0 bg-black/60" aria-hidden /> : null}
      {overlayPath ? (
        <>
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <path
              className="pointer-events-auto fill-black/60"
              d={overlayPath}
              fillRule="evenodd"
            />
          </svg>
          {targetRect ? (
            <div
              className={cn(
                "pointer-events-none absolute rounded-2xl border border-white/40 shadow-[0_0_0_2px_rgba(255,255,255,0.08)]",
                prefersReducedMotion ? "" : "transition-[top,left,width,height] duration-200",
              )}
              style={targetRect}
              aria-hidden
            />
          ) : null}
        </>
      ) : null}

      <div
        className="pointer-events-auto absolute rounded-2xl border border-white/10 bg-neutral-950/95 p-5 text-white shadow-2xl"
        style={tooltipStyle}
        role="dialog"
        aria-label="Tutorial"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              {step.icon ? <span className="text-white">{step.icon}</span> : <span className="h-5 w-5 rounded-lg bg-white/10" aria-hidden />}
            </div>
            <div>
              <p className="text-xs font-medium text-white/50">
                {index + 1} / {steps.length}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{step.title}</h3>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={dismiss} className="text-white/70 hover:text-white">
            <XIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <p className="mt-2 text-sm text-white/70">{targetFound ? step.description : "This step isn’t available on this screen. Continue to keep going."}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={dismiss} className="text-white/70 hover:text-white">
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {showPrev ? (
              <Button type="button" variant="outline" onClick={goPrev} className="border-white/15 bg-transparent text-white hover:bg-white/10">
                <ChevronLeftIcon className="mr-1 h-4 w-4" aria-hidden />
                Back
              </Button>
            ) : null}
            <Button type="button" onClick={goNext} className="bg-white text-black hover:bg-white/90">
              {isLast ? "Done" : "Next"}
              <ChevronRightIcon className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
