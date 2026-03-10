"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"

type WorkspaceTutorialCalloutProps = {
  anchorRef: React.RefObject<HTMLElement | null>
  title: string
  instruction: string
  emphasis?: "default" | "tap-here"
}

export function WorkspaceTutorialCallout({
  anchorRef,
  title,
  instruction,
  emphasis = "default",
}: WorkspaceTutorialCalloutProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 })
  const calloutRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    let frameId = 0
    const gap = 16
    const padding = 12

    const updatePosition = () => {
      const anchor = anchorRef.current
      const callout = calloutRef.current
      if (!anchor || !callout) {
        frameId = window.requestAnimationFrame(updatePosition)
        return
      }

      const anchorRect = anchor.getBoundingClientRect()
      const calloutRect = callout.getBoundingClientRect()

      const preferredLeft = anchorRect.left - calloutRect.width - gap
      const preferredTop =
        anchorRect.top + anchorRect.height / 2 - calloutRect.height / 2

      const maxLeft = Math.max(
        padding,
        window.innerWidth - calloutRect.width - padding,
      )
      const maxTop = Math.max(
        padding,
        window.innerHeight - calloutRect.height - padding,
      )

      setStyle({
        position: "fixed",
        left: Math.min(Math.max(preferredLeft, padding), maxLeft),
        top: Math.min(Math.max(preferredTop, padding), maxTop),
        opacity: 1,
      })

      frameId = window.requestAnimationFrame(updatePosition)
    }

    frameId = window.requestAnimationFrame(updatePosition)
    return () => window.cancelAnimationFrame(frameId)
  }, [anchorRef, isMounted])

  if (!isMounted) return null

  return createPortal(
    <div
      ref={calloutRef}
      className="pointer-events-none absolute z-30 w-[17rem] rounded-xl border border-primary/40 bg-primary px-3 py-3 text-primary-foreground shadow-[0_10px_30px_rgba(15,23,42,0.28)] transition-[left,top,opacity] duration-150 ease-out"
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold">{title}</p>
          <p className="text-[11px] leading-4 text-primary-foreground/90">
            {instruction}
          </p>
        </div>
        {emphasis === "tap-here" ? (
          <div className="inline-flex items-center gap-1 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            <span>Click</span>
            <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
          </div>
        ) : null}
      </div>
      <div className="absolute top-1/2 right-[-5px] h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[2px] border-t border-r border-primary/40 bg-primary" />
    </div>,
    document.body,
  )
}
