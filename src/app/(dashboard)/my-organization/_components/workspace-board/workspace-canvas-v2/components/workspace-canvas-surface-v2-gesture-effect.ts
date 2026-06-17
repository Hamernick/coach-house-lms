"use client"

import { useEffect } from "react"

import {
  shouldPreventWorkspaceCanvasTouchZoom,
  shouldPreventWorkspaceCanvasWheelZoom,
} from "./workspace-canvas-surface-v2-gesture-guards"

export function useWorkspaceCanvasSurfaceGestureGuards({
  surfaceContainer,
}: {
  surfaceContainer: HTMLDivElement | null
}) {
  useEffect(() => {
    const surface = surfaceContainer
    if (!surface) return

    const handleWheel = (event: WheelEvent) => {
      if (shouldPreventWorkspaceCanvasWheelZoom(event.ctrlKey)) {
        event.preventDefault()
      }
    }
    const handleTouchMove = (event: TouchEvent) => {
      if (shouldPreventWorkspaceCanvasTouchZoom(event.touches.length)) {
        event.preventDefault()
      }
    }
    const handleGestureEvent = (event: Event) => {
      event.preventDefault()
    }
    const listenerOptions = { passive: false, capture: true } as const

    surface.addEventListener("wheel", handleWheel, listenerOptions)
    surface.addEventListener("touchmove", handleTouchMove, listenerOptions)
    surface.addEventListener(
      "gesturestart",
      handleGestureEvent,
      listenerOptions
    )
    surface.addEventListener(
      "gesturechange",
      handleGestureEvent,
      listenerOptions
    )
    surface.addEventListener("gestureend", handleGestureEvent, listenerOptions)

    return () => {
      surface.removeEventListener("wheel", handleWheel, listenerOptions)
      surface.removeEventListener("touchmove", handleTouchMove, listenerOptions)
      surface.removeEventListener(
        "gesturestart",
        handleGestureEvent,
        listenerOptions
      )
      surface.removeEventListener(
        "gesturechange",
        handleGestureEvent,
        listenerOptions
      )
      surface.removeEventListener(
        "gestureend",
        handleGestureEvent,
        listenerOptions
      )
    }
  }, [surfaceContainer])
}
