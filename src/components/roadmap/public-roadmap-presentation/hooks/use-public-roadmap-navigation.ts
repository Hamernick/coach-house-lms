"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react"
import { gsap } from "gsap"

import type { PublicRoadmapSection } from "../types"

type UsePublicRoadmapNavigationArgs = {
  sections: PublicRoadmapSection[]
  onSectionView?: (sectionSlug: string) => void | Promise<void>
}

type UsePublicRoadmapNavigationResult = {
  activeIndex: number
  activeSection: PublicRoadmapSection | undefined
  rootRef: RefObject<HTMLDivElement | null>
  stageRef: RefObject<HTMLDivElement | null>
  goTo: (nextIndex: number) => void
}

export function usePublicRoadmapNavigation({
  sections,
  onSectionView,
}: UsePublicRoadmapNavigationArgs): UsePublicRoadmapNavigationResult {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const isAnimatingRef = useRef(false)
  const lastNavAtRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)
  const hasAnimatedRef = useRef(false)

  const activeSection = sections[activeIndex]

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
    return () => {
      tween.kill()
    }
  }, [activeIndex, reduceMotion])

  useEffect(() => {
    if (!activeSection?.slug || !onSectionView) return
    void onSectionView(activeSection.slug)
  }, [activeSection?.slug, onSectionView])

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
      if (typeof startY !== "number" || typeof endY !== "number") return
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

  return {
    activeIndex,
    activeSection,
    rootRef,
    stageRef,
    goTo,
  }
}
