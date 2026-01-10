"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Home2ScrollVideoProps = {
  className?: string
  videoSrc?: string
  posterSrc?: string
}

export function Home2ScrollVideo({ className, videoSrc, posterSrc }: Home2ScrollVideoProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const hasQueuedLoad = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    const card = cardRef.current
    const glow = glowRef.current

    if (!section || !card) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      card.style.transform = "translate3d(0, 0, 0) scale(1)"
      card.style.opacity = "1"
      if (glow) {
        glow.style.opacity = "0.45"
        glow.style.transform = "scale(1)"
      }
      return
    }

    let frame = 0
    let isActive = true

    const getScrollParent = (node: HTMLElement | null): Window | HTMLElement => {
      if (!node) return window
      let parent: HTMLElement | null = node.parentElement
      while (parent) {
        const style = window.getComputedStyle(parent)
        const isScrollable = /(auto|scroll)/.test(style.overflowY)
        if (isScrollable && parent.scrollHeight > parent.clientHeight) {
          return parent
        }
        parent = parent.parentElement
      }
      return window
    }

    const scrollParent = getScrollParent(section)

    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const viewport =
        scrollParent === window ? window.innerHeight || 1 : (scrollParent as HTMLElement).clientHeight || 1
      const containerTop = scrollParent === window ? 0 : (scrollParent as HTMLElement).getBoundingClientRect().top
      const relativeTop = rect.top - containerTop
      const start = viewport * 0.9
      const end = viewport * 0.25
      const raw = 1 - (relativeTop - end) / (start - end)
      const progress = clamp(raw, 0, 1)
      const scale = 0.85 + progress * 0.2
      const translate = 26 - progress * 26
      const opacity = 0.7 + progress * 0.3

      card.style.transform = `translate3d(0, ${translate}px, 0) scale(${scale})`
      card.style.opacity = `${opacity}`

      if (glow) {
        glow.style.opacity = `${0.2 + progress * 0.5}`
        glow.style.transform = `scale(${0.94 + progress * 0.12})`
      }
    }

    const onScroll = () => {
      if (!isActive) return
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isActive = entry.isIntersecting
        if (entry.isIntersecting && videoSrc && !hasQueuedLoad.current) {
          hasQueuedLoad.current = true
          setShouldLoadVideo(true)
        }
        if (entry.isIntersecting) {
          onScroll()
        }
      },
      {
        root: scrollParent === window ? null : scrollParent,
        rootMargin: "45% 0px",
        threshold: 0,
      },
    )

    if (scrollParent === window) {
      window.addEventListener("scroll", onScroll, { passive: true })
    } else {
      scrollParent.addEventListener("scroll", onScroll, { passive: true })
    }
    window.addEventListener("resize", onScroll)
    observer.observe(section)
    update()

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      if (scrollParent === window) {
        window.removeEventListener("scroll", onScroll)
      } else {
        scrollParent.removeEventListener("scroll", onScroll)
      }
      window.removeEventListener("resize", onScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <section ref={sectionRef} className={cn("relative min-h-[110vh] py-12", className)}>
      <div className="sticky top-24 flex justify-center px-4">
        <div
          ref={cardRef}
          className="relative w-full max-w-5xl overflow-visible will-change-transform"
          style={{ transform: "translate3d(0, 26px, 0) scale(0.85)", opacity: 0.7 }}
        >
          {videoSrc ? (
            <div
              ref={glowRef}
              className="pointer-events-none absolute -inset-16 rounded-[40px] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.28),transparent_70%)] blur-[40px]"
              style={{ opacity: 0.2, transform: "scale(0.94)" }}
            />
          ) : null}
          <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-border/60 bg-muted/40 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.35)]">
            {videoSrc ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={shouldLoadVideo ? videoSrc : undefined}
                poster={posterSrc}
                muted
                loop
                playsInline
                autoPlay
                preload={shouldLoadVideo ? "auto" : "none"}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Video container
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
