import type mapboxgl from "mapbox-gl"

const MARKER_MOTION_EASING = "cubic-bezier(0.22,1,0.36,1)"
const MARKER_MOVE_MIN_DURATION_MS = 180
const MARKER_MOVE_MAX_DURATION_MS = 320
const MARKER_ENTER_DURATION_MS = 220
const MARKER_MOVE_DISTANCE_MULTIPLIER = 2.2
const MARKER_ENTER_INITIAL_SCALE = 0.94
const MARKER_ENTER_INITIAL_OPACITY = 0.18

type MarkerMotionState = {
  frame: number | null
  cleanupTimeout: number | null
}

const markerMotionState = new WeakMap<HTMLElement, MarkerMotionState>()

function clearMarkerMotionState(element: HTMLElement) {
  const current = markerMotionState.get(element)
  if (!current) return
  if (current.frame !== null) {
    cancelAnimationFrame(current.frame)
  }
  if (current.cleanupTimeout !== null) {
    window.clearTimeout(current.cleanupTimeout)
  }
  markerMotionState.delete(element)
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function roundMotionValue(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.5) return 0
  return Math.round(value * 100) / 100
}

function applyMarkerMotion({
  element,
  fromTransform,
  toTransform,
  fromOpacity,
  duration,
}: {
  element: HTMLElement
  fromTransform: string
  toTransform: string
  fromOpacity: number | null
  duration: number
}) {
  if (typeof window === "undefined") return
  clearMarkerMotionState(element)

  element.style.willChange = fromOpacity === null ? "transform" : "transform, opacity"
  element.style.transition = "none"
  element.style.transform = fromTransform
  if (fromOpacity !== null) {
    element.style.opacity = `${fromOpacity}`
  }

  const state: MarkerMotionState = {
    frame: null,
    cleanupTimeout: null,
  }

  state.frame = requestAnimationFrame(() => {
    element.style.transition = [
      `transform ${duration}ms ${MARKER_MOTION_EASING}`,
      fromOpacity === null ? null : `opacity ${duration}ms ${MARKER_MOTION_EASING}`,
    ]
      .filter(Boolean)
      .join(", ")
    element.style.transform = toTransform
    if (fromOpacity !== null) {
      element.style.opacity = "1"
    }

    state.cleanupTimeout = window.setTimeout(() => {
      element.style.transition = ""
      element.style.transform = ""
      element.style.opacity = ""
      element.style.willChange = ""
      markerMotionState.delete(element)
    }, duration + 32)
  })

  markerMotionState.set(element, state)
}

function resolveProjectedDelta({
  map,
  previousCoordinates,
  nextCoordinates,
}: {
  map: mapboxgl.Map
  previousCoordinates: [number, number]
  nextCoordinates: [number, number]
}) {
  const previousPoint = map.project(previousCoordinates)
  const nextPoint = map.project(nextCoordinates)
  return {
    deltaX: roundMotionValue(previousPoint.x - nextPoint.x),
    deltaY: roundMotionValue(previousPoint.y - nextPoint.y),
  }
}

export function animateMarkerPositionTransition({
  map,
  marker,
  previousCoordinates,
  nextCoordinates,
  entering = false,
}: {
  map: mapboxgl.Map
  marker: mapboxgl.Marker
  previousCoordinates: [number, number]
  nextCoordinates: [number, number]
  entering?: boolean
}) {
  if (prefersReducedMotion()) return

  const { deltaX, deltaY } = resolveProjectedDelta({
    map,
    previousCoordinates,
    nextCoordinates,
  })
  const distance = Math.hypot(deltaX, deltaY)

  if (distance < 1 && !entering) return

  const duration = entering
    ? MARKER_ENTER_DURATION_MS
    : Math.max(
        MARKER_MOVE_MIN_DURATION_MS,
        Math.min(
          MARKER_MOVE_MAX_DURATION_MS,
          Math.round(MARKER_MOVE_MIN_DURATION_MS + distance * MARKER_MOVE_DISTANCE_MULTIPLIER),
        ),
      )

  const initialScale = entering ? MARKER_ENTER_INITIAL_SCALE : 1
  const initialOpacity =
    entering && distance < 1 ? MARKER_ENTER_INITIAL_OPACITY : entering ? 0.52 : null

  applyMarkerMotion({
    element: marker.getElement(),
    fromTransform: `translate(${deltaX}px, ${deltaY}px) scale(${initialScale})`,
    toTransform: "translate(0px, 0px) scale(1)",
    fromOpacity: initialOpacity,
    duration,
  })
}

export function animateMarkerEntrance({
  marker,
}: {
  marker: mapboxgl.Marker
}) {
  if (prefersReducedMotion()) return

  applyMarkerMotion({
    element: marker.getElement(),
    fromTransform: `translate(0px, 0px) scale(${MARKER_ENTER_INITIAL_SCALE})`,
    toTransform: "translate(0px, 0px) scale(1)",
    fromOpacity: MARKER_ENTER_INITIAL_OPACITY,
    duration: MARKER_ENTER_DURATION_MS,
  })
}
