import { useCallback, useEffect, useRef, useState } from "react"

import type { RoadmapSection } from "@/lib/roadmap"

type UseRoadmapEditorLayoutMetricsArgs = {
  activeId: string
  openGroups: Record<string, boolean>
  sections: RoadmapSection[]
  headerTitle: string
  headerSubtitle: string
}

export function useRoadmapEditorLayoutMetrics({
  activeId,
  openGroups,
  sections,
  headerTitle,
  headerSubtitle,
}: UseRoadmapEditorLayoutMetricsArgs) {
  const [tocIndicator, setTocIndicator] = useState({ top: 0, height: 0, visible: false })
  const [headerIconSize, setHeaderIconSize] = useState<number | null>(null)
  const sectionsListRef = useRef<HTMLDivElement | null>(null)
  const headerTextRef = useRef<HTMLDivElement | null>(null)

  const updateTocIndicator = useCallback(() => {
    const element = sectionsListRef.current
    if (!element) return
    const activeElement = element.querySelector<HTMLElement>("[data-toc-item][data-active='true']")
    if (!activeElement) {
      setTocIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }
    const listRect = element.getBoundingClientRect()
    const activeRect = activeElement.getBoundingClientRect()
    const nextTop = Math.max(0, activeRect.top - listRect.top)
    const nextHeight = Math.max(12, activeRect.height)
    setTocIndicator({ top: nextTop, height: nextHeight, visible: true })
  }, [])

  useEffect(() => {
    const element = sectionsListRef.current
    if (!element || typeof ResizeObserver === "undefined") return
    updateTocIndicator()
    const observer = new ResizeObserver(() => {
      updateTocIndicator()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [updateTocIndicator])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      updateTocIndicator()
    })
    return () => cancelAnimationFrame(frame)
  }, [activeId, openGroups, sections, updateTocIndicator])

  useEffect(() => {
    const element = headerTextRef.current
    if (!element) return
    const measure = () => {
      const next = Math.round(element.offsetHeight)
      if (!next) return
      setHeaderIconSize((prev) => (prev === next ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(element)
    return () => observer.disconnect()
  }, [headerTitle, headerSubtitle])

  return {
    tocIndicator,
    headerIconSize,
    sectionsListRef,
    headerTextRef,
  }
}
