import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent, type WheelEvent } from "react"

import {
  CANVAS_NAV,
  SECTION_WHEEL_LOCK_MS,
  VISIBLE_CANVAS_NAV,
  WHEEL_INTENT_RESET_MS,
  WHEEL_INTENT_THRESHOLD,
  hasOpenDialog,
  parseInitialSection,
  resolveSectionAlias,
  type CanvasSectionId,
} from "@/components/public/home-canvas-preview-config"
import { resolveCanvasSectionBehavior } from "@/components/public/home-canvas-behavior"
import { resolveSwipeSectionDelta, resolveWheelSectionDelta } from "@/components/public/home-canvas-scroll"

type UseHomeCanvasNavigationArgs = {
  initialSection?: string
}

export function resolveHomeCanvasSectionTransition(
  currentSection: CanvasSectionId,
  nextSection: CanvasSectionId,
) {
  if (currentSection === nextSection) {
    return {
      shouldChange: false,
      direction: null as 1 | -1 | null,
    }
  }

  const currentIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === currentSection)
  const nextIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === nextSection)
  const direction: 1 | -1 | null =
    currentIndex >= 0 && nextIndex >= 0 ? (nextIndex > currentIndex ? 1 : -1) : null

  return {
    shouldChange: true,
    direction,
  }
}

export function useHomeCanvasNavigation({ initialSection }: UseHomeCanvasNavigationArgs) {
  const parsedInitialSection = parseInitialSection(initialSection)
  const [activeSection, setActiveSection] = useState<CanvasSectionId>(() => parsedInitialSection)
  const [direction, setDirection] = useState<1 | -1>(1)
  const animationTimerRef = useRef<number | null>(null)
  const panelRefs = useRef<Partial<Record<CanvasSectionId, HTMLDivElement | null>>>({})
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeSectionRef = useRef<CanvasSectionId>(parsedInitialSection)
  const isAnimatingRef = useRef(false)
  const wheelIntentRef = useRef<{ direction: -1 | 1 | null; total: number; lastTs: number }>({
    direction: null,
    total: 0,
    lastTs: 0,
  })
  const sectionWheelLockUntilRef = useRef(0)

  const activeLabel = useMemo(
    () => CANVAS_NAV.find((item) => item.id === activeSection)?.label ?? "Welcome",
    [activeSection],
  )
  const activeSectionBehavior = useMemo(() => resolveCanvasSectionBehavior(activeSection), [activeSection])

  const syncUrlSection = useCallback((nextSection: CanvasSectionId) => {
    if (typeof window === "undefined") return

    const nextUrl = new URL(window.location.href)
    nextUrl.pathname = nextUrl.pathname === "/home-canvas" ? "/" : nextUrl.pathname
    nextUrl.searchParams.set("section", nextSection)
    window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`)
  }, [])

  const scheduleAnimationEnd = useCallback(() => {
    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current)
    }
    animationTimerRef.current = window.setTimeout(() => {
      isAnimatingRef.current = false
      animationTimerRef.current = null
    }, 380)
  }, [])

  const changeSection = useCallback(
    (nextSection: CanvasSectionId) => {
      const currentSection = activeSectionRef.current
      const transition = resolveHomeCanvasSectionTransition(currentSection, nextSection)
      if (!transition.shouldChange) return

      if (transition.direction) {
        setDirection(transition.direction)
      }

      activeSectionRef.current = nextSection
      setActiveSection(nextSection)
      isAnimatingRef.current = true
      wheelIntentRef.current = { direction: null, total: 0, lastTs: 0 }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now()
      sectionWheelLockUntilRef.current = now + SECTION_WHEEL_LOCK_MS
      scheduleAnimationEnd()
      syncUrlSection(nextSection)
    },
    [scheduleAnimationEnd, syncUrlSection],
  )

  const goToAdjacentSection = useCallback(
    (delta: -1 | 1) => {
      const currentIndex = VISIBLE_CANVAS_NAV.findIndex((item) => item.id === activeSectionRef.current)
      if (currentIndex < 0) return

      const targetIndex = currentIndex + delta
      if (targetIndex < 0 || targetIndex >= VISIBLE_CANVAS_NAV.length) return
      changeSection(VISIBLE_CANVAS_NAV[targetIndex].id)
    },
    [changeSection],
  )

  useEffect(() => {
    const next = parseInitialSection(initialSection)
    const transition = resolveHomeCanvasSectionTransition(activeSectionRef.current, next)
    if (!transition.shouldChange) return

    if (transition.direction) {
      setDirection(transition.direction)
    }
    activeSectionRef.current = next
    setActiveSection(next)
  }, [initialSection])

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const aliasSection = resolveSectionAlias(initialSection)
    if (!aliasSection) return
    syncUrlSection(aliasSection)
  }, [initialSection, syncUrlSection])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (resolveCanvasSectionBehavior(activeSection).lockNavigationGestures) {
        return
      }

      if (hasOpenDialog()) {
        event.preventDefault()
        return
      }

      const activePanel = panelRefs.current[activeSection]
      const panelMetrics = activePanel
        ? {
            scrollTop: activePanel.scrollTop,
            scrollHeight: activePanel.scrollHeight,
            clientHeight: activePanel.clientHeight,
          }
        : null
      const delta = resolveWheelSectionDelta({
        deltaY: event.deltaY,
        isAnimating: isAnimatingRef.current,
        panel: panelMetrics,
      })
      if (!delta) return

      const now = typeof performance !== "undefined" ? performance.now() : Date.now()
      if (now < sectionWheelLockUntilRef.current) {
        event.preventDefault()
        return
      }

      const wheelIntent = wheelIntentRef.current
      const wheelDirection: -1 | 1 = event.deltaY >= 0 ? 1 : -1
      const isStaleGesture = now - wheelIntent.lastTs > WHEEL_INTENT_RESET_MS
      if (isStaleGesture || wheelIntent.direction !== wheelDirection) {
        wheelIntent.direction = wheelDirection
        wheelIntent.total = 0
      }
      wheelIntent.total += Math.abs(event.deltaY)
      wheelIntent.lastTs = now
      if (wheelIntent.total < WHEEL_INTENT_THRESHOLD) {
        event.preventDefault()
        return
      }

      // Reset intent once we commit to a section change so momentum doesn't skip sections.
      wheelIntentRef.current = { direction: null, total: 0, lastTs: 0 }
      event.preventDefault()
      goToAdjacentSection(delta)
    },
    [activeSection, goToAdjacentSection],
  )

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (resolveCanvasSectionBehavior(activeSection).lockNavigationGestures) {
      return
    }

    if (hasOpenDialog()) return
    const touch = event.touches[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [activeSection])

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (resolveCanvasSectionBehavior(activeSection).lockNavigationGestures) {
        return
      }

      if (hasOpenDialog()) return
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start) return

      const touch = event.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y

      const activePanel = panelRefs.current[activeSection]
      const delta = resolveSwipeSectionDelta({
        deltaX,
        deltaY,
        isAnimating: isAnimatingRef.current,
        panel: activePanel
          ? {
              scrollTop: activePanel.scrollTop,
              scrollHeight: activePanel.scrollHeight,
              clientHeight: activePanel.clientHeight,
            }
          : null,
      })
      if (!delta) return
      goToAdjacentSection(delta)
    },
    [activeSection, goToAdjacentSection],
  )

  const setActivePanelRef = useCallback((section: CanvasSectionId, node: HTMLDivElement | null) => {
    panelRefs.current[section] = node
  }, [])

  return {
    activeSection,
    direction,
    activeLabel,
    activeSectionBehavior,
    setActivePanelRef,
    changeSection,
    goToAdjacentSection,
    handleWheel,
    handleTouchStart,
    handleTouchEnd,
  }
}
