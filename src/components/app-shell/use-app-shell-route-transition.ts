"use client"

import { useEffect, useRef } from "react"

const ROUTE_TRANSITION_TIMING: KeyframeAnimationOptions = {
  duration: 170,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  fill: "both",
}

export function useAppShellRouteTransition({
  enabled = true,
  pathname,
}: {
  enabled?: boolean
  pathname: string | null
}) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const previousPathnameRef = useRef<string | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!enabled || !element) {
      previousPathnameRef.current = pathname
      return
    }

    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname
      return
    }
    if (previousPathnameRef.current === pathname) return

    previousPathnameRef.current = pathname
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const animation = element.animate(
      [
        { opacity: 0.96, transform: "translate3d(0, 3px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ],
      ROUTE_TRANSITION_TIMING,
    )

    return () => animation.cancel()
  }, [enabled, pathname])

  return elementRef
}
