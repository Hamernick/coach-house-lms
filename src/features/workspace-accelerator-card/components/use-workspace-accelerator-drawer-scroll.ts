"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useWorkspaceAcceleratorDrawerScroll(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [hasScrollableOverflow, setHasScrollableOverflow] = useState(false)
  const updateScrollableOverflow = useCallback(() => {
    const viewport = viewportRef.current
    const next = Boolean(
      enabled && viewport && viewport.scrollHeight > viewport.clientHeight + 1
    )

    setHasScrollableOverflow((current) => (current === next ? current : next))
  }, [enabled])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!enabled || !viewport) {
      setHasScrollableOverflow(false)
      return
    }

    updateScrollableOverflow()
    const frameId = window.requestAnimationFrame(updateScrollableOverflow)
    window.addEventListener("resize", updateScrollableOverflow)

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateScrollableOverflow)
    resizeObserver?.observe(viewport)
    Array.from(viewport.children).forEach((child) =>
      resizeObserver?.observe(child)
    )

    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(updateScrollableOverflow)
    mutationObserver?.observe(viewport, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("resize", updateScrollableOverflow)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [enabled, updateScrollableOverflow])

  return { hasScrollableOverflow, viewportRef }
}
