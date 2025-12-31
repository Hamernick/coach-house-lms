"use client"

import { useEffect, useRef } from "react"

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
    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const start = viewport * 0.9
      const end = viewport * 0.25
      const raw = 1 - (rect.top - end) / (start - end)
      const progress = clamp(raw, 0, 1)
      const scale = 0.84 + progress * 0.16
      const translate = 28 - progress * 28
      const opacity = 0.7 + progress * 0.3

      card.style.transform = `translate3d(0, ${translate}px, 0) scale(${scale})`
      card.style.opacity = `${opacity}`

      if (glow) {
        glow.style.opacity = `${0.2 + progress * 0.5}`
        glow.style.transform = `scale(${0.94 + progress * 0.12})`
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  useEffect(() => {
    if (!videoSrc) return

    const video = videoRef.current
    const glow = glowRef.current

    if (!video || !glow) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    canvas.width = 18
    canvas.height = 18

    let rafId = 0
    let lastSample = 0

    const updateGlow = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let r = 0
      let g = 0
      let b = 0
      const count = data.length / 4
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      const avgR = Math.round(r / count)
      const avgG = Math.round(g / count)
      const avgB = Math.round(b / count)
      glow.style.setProperty("--video-glow", `rgba(${avgR}, ${avgG}, ${avgB}, 0.42)`)
    }

    const tick = (now: number) => {
      rafId = 0
      if (video.paused || video.ended) return
      if (now - lastSample > 450) {
        lastSample = now
        try {
          updateGlow()
        } catch {
          return
        }
      }
      rafId = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const handlePlay = () => start()
    const handlePause = () => stop()

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handlePause)
    video.addEventListener("loadeddata", handlePlay, { once: true })

    if (!video.paused) {
      start()
    }

    return () => {
      stop()
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handlePause)
    }
  }, [videoSrc])

  return (
    <section ref={sectionRef} className={cn("relative min-h-[140vh] py-20", className)}>
      <div className="sticky top-24 flex justify-center px-4">
        <div
          ref={cardRef}
          className="relative w-full max-w-4xl overflow-visible will-change-transform"
          style={{ transform: "translate3d(0, 28px, 0) scale(0.84)", opacity: 0.7 }}
        >
          {videoSrc ? (
            <div
              ref={glowRef}
              className="pointer-events-none absolute -inset-20 rounded-[40px] bg-[radial-gradient(circle_at_center,var(--video-glow,rgba(99,102,241,0.35)),transparent_70%)] blur-[60px]"
              style={{ opacity: 0.2, transform: "scale(0.94)" }}
            />
          ) : null}
          <div className="relative aspect-video w-full overflow-hidden rounded-[28px] border border-border/60 bg-muted/40 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.35)]">
            {videoSrc ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={videoSrc}
                poster={posterSrc}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
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
