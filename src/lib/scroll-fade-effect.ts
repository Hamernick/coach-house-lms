"use client"

import { useCallback, useEffect, useRef } from "react"

export type ScrollFadeOrientation = "horizontal" | "vertical"

function updateScrollFadeState(
  element: HTMLElement,
  orientation: ScrollFadeOrientation
) {
  const scrollPosition =
    orientation === "vertical"
      ? Math.max(0, element.scrollTop)
      : Math.max(0, element.scrollLeft)
  const scrollExtent =
    orientation === "vertical"
      ? element.scrollHeight - element.clientHeight
      : element.scrollWidth - element.clientWidth
  const maxScrollPosition = Math.max(0, scrollExtent)
  const startVisible = scrollPosition > 1
  const endVisible =
    maxScrollPosition > 1 && scrollPosition < maxScrollPosition - 1
  const nextStart = startVisible ? "visible" : "hidden"
  const nextEnd = endVisible ? "visible" : "hidden"

  element.dataset.scrollFadeManaged = "true"
  if (element.dataset.scrollFadeStart !== nextStart) {
    element.dataset.scrollFadeStart = nextStart
  }
  if (element.dataset.scrollFadeEnd !== nextEnd) {
    element.dataset.scrollFadeEnd = nextEnd
  }
}

export function useScrollFadeEffect(
  enabled: boolean,
  orientation: ScrollFadeOrientation = "vertical"
) {
  const cleanupRef = useRef<(() => void) | null>(null)

  const setElement = useCallback(
    (element: HTMLDivElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (!element || !enabled) return

      const update = () => updateScrollFadeState(element, orientation)
      update()
      element.addEventListener("scroll", update, { passive: true })
      window.addEventListener("resize", update)
      const frame = window.requestAnimationFrame(update)

      cleanupRef.current = () => {
        element.removeEventListener("scroll", update)
        window.removeEventListener("resize", update)
        window.cancelAnimationFrame(frame)
        delete element.dataset.scrollFadeManaged
        delete element.dataset.scrollFadeStart
        delete element.dataset.scrollFadeEnd
      }
    },
    [enabled, orientation]
  )

  useEffect(
    () => () => {
      cleanupRef.current?.()
    },
    []
  )

  return setElement
}
