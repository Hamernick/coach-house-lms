"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type PhotoItem = {
  id: string
  label: string
  className: string
}

type Home2PhotoStripProps = {
  items: PhotoItem[]
  className?: string
}

export function Home2PhotoStrip({ items, className }: Home2PhotoStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    let isDragging = false
    let startX = 0
    let startScroll = 0

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const snapToNearest = () => {
      const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-snap-card]"))
      if (!cards.length) return
      const containerRect = scroller.getBoundingClientRect()
      const center = containerRect.left + containerRect.width / 2
      let nearest: HTMLElement | null = null
      let nearestDistance = Number.POSITIVE_INFINITY
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const distance = Math.abs(cardCenter - center)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = card
        }
      })
      if (!nearest) return
      const rect = nearest.getBoundingClientRect()
      const target = scroller.scrollLeft + (rect.left + rect.width / 2 - center)
      scroller.scrollTo({ left: target, behavior: prefersReducedMotion ? "auto" : "smooth" })
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      isDragging = true
      startX = event.clientX
      startScroll = scroller.scrollLeft
      scroller.dataset.dragging = "true"
      scroller.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      event.preventDefault()
      const delta = event.clientX - startX
      scroller.scrollLeft = startScroll - delta
    }

    const endDrag = () => {
      if (!isDragging) return
      isDragging = false
      scroller.dataset.dragging = "false"
      snapToNearest()
    }

    scroller.addEventListener("pointerdown", onPointerDown)
    scroller.addEventListener("pointermove", onPointerMove, { passive: false })
    scroller.addEventListener("pointerup", endDrag)
    scroller.addEventListener("pointercancel", endDrag)
    scroller.addEventListener("pointerleave", endDrag)

    return () => {
      scroller.removeEventListener("pointerdown", onPointerDown)
      scroller.removeEventListener("pointermove", onPointerMove)
      scroller.removeEventListener("pointerup", endDrag)
      scroller.removeEventListener("pointercancel", endDrag)
      scroller.removeEventListener("pointerleave", endDrag)
    }
  }, [])

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollerRef}
        className={cn(
          "drag-scroll no-scrollbar flex items-end gap-6 overflow-x-auto pb-4",
          "cursor-grab select-none snap-x snap-mandatory touch-pan-y",
          "[--first-card:20rem] sm:[--first-card:22rem] lg:[--first-card:26rem]",
        )}
        style={{
          scrollPaddingLeft: "calc(50vw - var(--first-card) / 2)",
          scrollPaddingRight: "calc(50vw - var(--first-card) / 2)",
        }}
      >
        <div className="shrink-0" style={{ width: "calc(50vw - var(--first-card) / 2)" }} aria-hidden />
        {items.map((item) => (
          <div
            key={item.id}
            data-snap-card
            aria-label={item.label}
            className={cn(
              "shrink-0 snap-center rounded-[24px] border border-border/60 bg-muted/40 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
              item.className,
            )}
          />
        ))}
        <div className="shrink-0" style={{ width: "calc(50vw - var(--first-card) / 2)" }} aria-hidden />
      </div>
    </div>
  )
}
