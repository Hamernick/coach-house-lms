"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type PhotoItem = {
  id: string
  label: string
  className: string
  imageUrl?: string
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
    let snapTimer = 0
    let animationId = 0
    let isAnimating = false

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const animateScrollTo = (target: number) => {
      if (prefersReducedMotion) {
        scroller.scrollLeft = target
        return
      }

      if (animationId) {
        window.cancelAnimationFrame(animationId)
      }

      const start = scroller.scrollLeft
      const distance = target - start
      if (Math.abs(distance) < 1) return

      const duration = Math.min(900, Math.max(450, Math.abs(distance) * 0.6))
      const startTime = performance.now()
      isAnimating = true

      const easeInOut = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      const step = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = easeInOut(progress)
        scroller.scrollLeft = start + distance * eased
        if (progress < 1) {
          animationId = window.requestAnimationFrame(step)
        } else {
          isAnimating = false
        }
      }

      animationId = window.requestAnimationFrame(step)
    }

    const snapToNearest = () => {
      const cards = Array.from(scroller.querySelectorAll("[data-snap-card]")) as HTMLElement[]
      if (!cards.length) return
      const containerRect = scroller.getBoundingClientRect()
      const center = containerRect.left + containerRect.width / 2
      let nearest = cards[0]
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
      const rect = nearest.getBoundingClientRect()
      const target = scroller.scrollLeft + (rect.left + rect.width / 2 - center)
      animateScrollTo(target)
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

    const onScroll = () => {
      if (isDragging || isAnimating) return
      window.clearTimeout(snapTimer)
      snapTimer = window.setTimeout(snapToNearest, 140)
    }

    scroller.addEventListener("pointerdown", onPointerDown)
    scroller.addEventListener("pointermove", onPointerMove, { passive: false })
    scroller.addEventListener("pointerup", endDrag)
    scroller.addEventListener("pointercancel", endDrag)
    scroller.addEventListener("pointerleave", endDrag)
    scroller.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.clearTimeout(snapTimer)
      if (animationId) {
        window.cancelAnimationFrame(animationId)
      }
      scroller.removeEventListener("pointerdown", onPointerDown)
      scroller.removeEventListener("pointermove", onPointerMove)
      scroller.removeEventListener("pointerup", endDrag)
      scroller.removeEventListener("pointercancel", endDrag)
      scroller.removeEventListener("pointerleave", endDrag)
      scroller.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <div className={cn("relative overflow-visible", className)}>
      <div
        ref={scrollerRef}
        className={cn(
          "drag-scroll no-scrollbar flex items-end gap-6 overflow-x-auto overflow-y-visible pb-6 pt-3",
          "cursor-grab select-none touch-pan-y",
          "[--first-card:14rem] sm:[--first-card:16rem] lg:[--first-card:18rem]",
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
              "shrink-0 snap-center rounded-[24px] bg-muted/40 bg-cover bg-center shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md",
              item.className,
            )}
            style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
          />
        ))}
        <div className="shrink-0" style={{ width: "calc(50vw - var(--first-card) / 2)" }} aria-hidden />
      </div>
    </div>
  )
}
