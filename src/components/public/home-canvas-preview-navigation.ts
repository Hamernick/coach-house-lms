import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  CANVAS_NAV,
  VISIBLE_CANVAS_NAV,
  parseInitialSection,
  resolveSectionAlias,
  type CanvasSectionId,
} from "@/components/public/home-canvas-preview-config"
import { resolveCanvasSectionBehavior } from "@/components/public/home-canvas-behavior"

type UseHomeCanvasNavigationArgs = {
  initialSection?: string
}

export function resolveHomeCanvasSectionTransition(
  currentSection: CanvasSectionId,
  nextSection: CanvasSectionId
) {
  if (currentSection === nextSection) {
    return {
      shouldChange: false,
      direction: null as 1 | -1 | null,
    }
  }

  const currentIndex = VISIBLE_CANVAS_NAV.findIndex(
    (item) => item.id === currentSection
  )
  const nextIndex = VISIBLE_CANVAS_NAV.findIndex(
    (item) => item.id === nextSection
  )
  const direction: 1 | -1 | null =
    currentIndex >= 0 && nextIndex >= 0
      ? nextIndex > currentIndex
        ? 1
        : -1
      : null

  return {
    shouldChange: true,
    direction,
  }
}

export function useHomeCanvasNavigation({
  initialSection,
}: UseHomeCanvasNavigationArgs) {
  const parsedInitialSection = parseInitialSection(initialSection)
  const [activeSection, setActiveSection] = useState<CanvasSectionId>(
    () => parsedInitialSection
  )
  const [direction, setDirection] = useState<1 | -1>(1)
  const activeSectionRef = useRef<CanvasSectionId>(parsedInitialSection)

  const activeLabel = useMemo(
    () =>
      CANVAS_NAV.find((item) => item.id === activeSection)?.label ?? "Welcome",
    [activeSection]
  )
  const activeSectionBehavior = useMemo(
    () => resolveCanvasSectionBehavior(activeSection),
    [activeSection]
  )

  const syncUrlSection = useCallback((nextSection: CanvasSectionId) => {
    if (typeof window === "undefined") return

    const nextUrl = new URL(window.location.href)
    nextUrl.pathname =
      nextUrl.pathname === "/home-canvas" ? "/" : nextUrl.pathname
    nextUrl.searchParams.set("section", nextSection)
    window.history.replaceState(
      null,
      "",
      `${nextUrl.pathname}${nextUrl.search}`
    )
  }, [])

  const changeSection = useCallback(
    (nextSection: CanvasSectionId) => {
      const currentSection = activeSectionRef.current
      const transition = resolveHomeCanvasSectionTransition(
        currentSection,
        nextSection
      )
      if (!transition.shouldChange) return

      if (transition.direction) {
        setDirection(transition.direction)
      }

      activeSectionRef.current = nextSection
      setActiveSection(nextSection)
      syncUrlSection(nextSection)
    },
    [syncUrlSection]
  )

  useEffect(() => {
    const next = parseInitialSection(initialSection)
    const transition = resolveHomeCanvasSectionTransition(
      activeSectionRef.current,
      next
    )
    if (!transition.shouldChange) return

    if (transition.direction) {
      setDirection(transition.direction)
    }
    activeSectionRef.current = next
    setActiveSection(next)
  }, [initialSection])

  useEffect(() => {
    const aliasSection = resolveSectionAlias(initialSection)
    if (!aliasSection) return
    syncUrlSection(aliasSection)
  }, [initialSection, syncUrlSection])

  return {
    activeSection,
    direction,
    activeLabel,
    activeSectionBehavior,
    changeSection,
  }
}
