"use client"

import { useLayoutEffect, useState } from "react"

// Vaul measures custom-container snap offsets on render, but only subscribes to
// window resize. Canvas layout can change independently during shell startup.
export function useWorkspaceDrawerCanvasHeight(container: HTMLElement | null) {
  const [measurement, setMeasurement] = useState<{
    container: HTMLElement
    height: number
  } | null>(null)

  useLayoutEffect(() => {
    if (!container) return
    const measure = () => {
      const height = container.getBoundingClientRect().height
      setMeasurement((current) =>
        current?.container === container && current.height === height
          ? current
          : { container, height }
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [container])

  return measurement?.container === container ? measurement?.height ?? 0 : 0
}
