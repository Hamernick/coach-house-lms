"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"

import { RoadmapCtaButton } from "@/components/roadmap/public-roadmap-cta"
import { logRoadmapEvent } from "@/components/roadmap/public-roadmap-tracker"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { ShareButton } from "@/components/shared/share-button"
import GradualBlur from "@/components/GradualBlur"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type PublicRoadmapSection = {
  id: string
  slug: string
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  contentHtml: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

type PublicRoadmapPresentationProps = {
  orgName: string
  subtitle: string
  orgSlug: string
  logoUrl?: string | null
  shareUrl: string
  sections: PublicRoadmapSection[]
}

export function PublicRoadmapPresentation({
  orgName,
  subtitle,
  orgSlug,
  logoUrl,
  shareUrl,
  sections,
}: PublicRoadmapPresentationProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const isAnimatingRef = useRef(false)
  const lastNavAtRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)
  const hasAnimatedRef = useRef(false)

  const shareTitle = useMemo(() => `${orgName} · Roadmap`, [orgName])
  const resolvedLogoUrl = useMemo(() => {
    if (typeof logoUrl !== "string") return null
    const trimmed = logoUrl.trim()
    return trimmed.length > 0 ? trimmed : null
  }, [logoUrl])
  const activeSection = sections[activeIndex]
  const activeEyebrow = useMemo(() => activeSection?.eyebrow?.trim() ?? "", [activeSection?.eyebrow])
  const activeTitle = useMemo(() => activeSection?.title?.trim() ?? "", [activeSection?.title])
  const activeSubtitle = useMemo(() => activeSection?.subtitle?.trim() ?? "", [activeSection?.subtitle])
  const displayTitle = useMemo(() => activeTitle || activeEyebrow, [activeEyebrow, activeTitle])

  const clampIndex = useCallback(
    (index: number) => Math.min(Math.max(index, 0), Math.max(sections.length - 1, 0)),
    [sections.length],
  )

  const goTo = useCallback(
    (nextIndex: number) => {
      if (sections.length === 0) return
      const clamped = clampIndex(nextIndex)
      if (clamped === activeIndex) return
      if (isAnimatingRef.current) return
      const stage = stageRef.current
      isAnimatingRef.current = true

      if (!stage || reduceMotion) {
        setActiveIndex(clamped)
        return
      }

      gsap.killTweensOf(stage)
      gsap.to(stage, {
        autoAlpha: 0,
        y: -12,
        filter: "blur(10px)",
        duration: 0.22,
        ease: "power1.in",
        onComplete: () => {
          setActiveIndex(clamped)
        },
      })
    },
    [activeIndex, clampIndex, reduceMotion, sections.length],
  )

  const requestNav = useCallback(
    (direction: -1 | 1) => {
      if (sections.length === 0) return
      const now = Date.now()
      if (now - lastNavAtRef.current < 550) return
      lastNavAtRef.current = now
      goTo(activeIndex + direction)
    },
    [activeIndex, goTo, sections.length],
  )

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    gsap.killTweensOf(stage)

    if (reduceMotion || !hasAnimatedRef.current) {
      gsap.set(stage, { autoAlpha: 1, y: 0, filter: "blur(0px)" })
      isAnimatingRef.current = false
      hasAnimatedRef.current = true
      return
    }

    isAnimatingRef.current = true
    gsap.set(stage, { autoAlpha: 0, y: 18, filter: "blur(12px)" })
    const tween = gsap.to(stage, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        isAnimatingRef.current = false
      },
    })
    return () => tween.kill()
  }, [activeIndex, reduceMotion])

  useEffect(() => {
    if (!activeSection?.slug) return
    void logRoadmapEvent({
      orgSlug,
      eventType: "view",
      sectionId: activeSection.slug,
    })
  }, [activeSection?.slug, orgSlug])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const handleWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current) return
      const delta = event.deltaY
      if (!Number.isFinite(delta) || Math.abs(delta) < 16) return
      event.preventDefault()
      requestNav(delta > 0 ? 1 : -1)
    }

    root.addEventListener("wheel", handleWheel, { passive: false })
    return () => root.removeEventListener("wheel", handleWheel)
  }, [requestNav])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "j") {
        event.preventDefault()
        requestNav(1)
        return
      }
      if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "k") {
        event.preventDefault()
        requestNav(-1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [requestNav])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = touchStartYRef.current
      touchStartYRef.current = null
      const endY = event.changedTouches[0]?.clientY
      if (!Number.isFinite(startY) || !Number.isFinite(endY)) return
      const delta = startY - endY
      if (Math.abs(delta) < 48) return
      requestNav(delta > 0 ? 1 : -1)
    }

    root.addEventListener("touchstart", handleTouchStart, { passive: true })
    root.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      root.removeEventListener("touchstart", handleTouchStart)
      root.removeEventListener("touchend", handleTouchEnd)
    }
  }, [requestNav])

  if (!activeSection) {
    return null
  }

  const rawUrl = typeof activeSection.ctaUrl === "string" ? activeSection.ctaUrl.trim() : ""
  const ctaHref =
    rawUrl.length > 0
      ? rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`
      : null

  return (
    <div ref={rootRef} className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 pb-16 pt-8 sm:px-8 lg:px-12">
        <div className="flex flex-1 items-center">
          <div className="w-full">
            <div className="grid grid-cols-[40px_1fr] items-start gap-x-3">
              <div aria-hidden />
              <div className="w-full max-w-3xl">
            <div ref={stageRef} className="mt-4 space-y-8 sm:mt-6">
              {activeSection.imageUrl ? (
                <div className="space-y-3">
                  {activeEyebrow ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm"
                    >
                      {activeEyebrow}
                    </Badge>
                  ) : null}
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={activeSection.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 48rem, 100vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {activeEyebrow || activeTitle || activeSubtitle ? (
                <div className="space-y-4">
                  {activeEyebrow && !activeSection.imageUrl ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm"
                    >
                      {activeEyebrow}
                    </Badge>
                  ) : null}
                  {displayTitle ? (
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{displayTitle}</h1>
                  ) : null}
                  {activeSubtitle ? <p className="max-w-2xl text-base text-muted-foreground">{activeSubtitle}</p> : null}
                </div>
              ) : null}

              <div
                className="prose prose-lg max-w-none text-foreground/90 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: activeSection.contentHtml }}
              />
                  {activeSection.ctaLabel && ctaHref ? (
                    <div className="pt-2">
                      <RoadmapCtaButton
                        orgSlug={orgSlug}
                        sectionSlug={activeSection.slug}
                        href={ctaHref}
                        label={activeSection.ctaLabel}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GradualBlur
        position="bottom"
        height="9rem"
        strength={2}
        divCount={6}
        curve="ease-out"
        opacity={0.9}
        zIndex={30}
      />

      <div className="pointer-events-none fixed inset-x-0 top-6 z-50">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">
          <div className="flex justify-start">
            <div className="pointer-events-auto grid grid-cols-[40px_1fr] items-start gap-x-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/80 shadow-sm">
                {resolvedLogoUrl ? (
                  <Image src={resolvedLogoUrl} alt="Logo" fill sizes="40px" className="object-cover" priority />
                ) : (
                  <>
                    <Image
                      src="/coach-house-logo-dark.png"
                      alt="Coach House logo"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain dark:hidden"
                      priority
                    />
                    <Image
                      src="/coach-house-logo-light.png"
                      alt="Coach House logo"
                      width={28}
                      height={28}
                      className="hidden h-7 w-7 object-contain dark:block"
                      priority
                    />
                  </>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{orgName}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50">
        <div className="flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-background/80 p-2 shadow-sm backdrop-blur">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-muted/40 hover:text-foreground"
              aria-label="Previous section"
              title="Previous section"
              disabled={activeIndex <= 0}
              onClick={() => goTo(activeIndex - 1)}
            >
              <ChevronUp className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-muted/40 hover:text-foreground"
              aria-label="Next section"
              title="Next section"
              disabled={activeIndex >= sections.length - 1}
              onClick={() => goTo(activeIndex + 1)}
            >
              <ChevronDown className="h-5 w-5" aria-hidden />
            </Button>
            <div className="mx-1 h-7 w-px bg-border/60" aria-hidden />
            <ShareButton
              url={shareUrl}
              title={shareTitle}
              icon="link"
              iconOnly
              buttonVariant="ghost"
              buttonSize="icon"
              className="rounded-full hover:bg-muted/40"
            />
            <PublicThemeToggle variant="ghost" className="hover:bg-muted/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
