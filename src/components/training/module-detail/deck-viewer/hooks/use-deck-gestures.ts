"use client"

import { useCallback, useRef, type TouchEvent } from "react"

export function useDeckGestures({
  swipeThreshold,
  onNavigate,
}: {
  swipeThreshold: number
  onNavigate: (delta: number) => void
}) {
  const touchStart = useRef<number | null>(null)

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) {
      touchStart.current = event.touches[0].clientX
    }
  }, [])

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStart.current === null || event.changedTouches.length === 0) {
        touchStart.current = null
        return
      }
      const delta = event.changedTouches[0].clientX - touchStart.current
      touchStart.current = null
      if (Math.abs(delta) < swipeThreshold) {
        return
      }
      if (delta > 0) {
        onNavigate(-1)
      } else {
        onNavigate(1)
      }
    },
    [onNavigate, swipeThreshold],
  )

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return { handleTouchStart, handleTouchEnd, handleWheel }
}
