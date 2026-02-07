export type CanvasPanelMetrics = {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

type ScrollEdgeState = {
  canScroll: boolean
  atTop: boolean
  atBottom: boolean
}

const WHEEL_THRESHOLD = 22
const SWIPE_THRESHOLD = 52

function getScrollEdgeState(panel: CanvasPanelMetrics | null | undefined): ScrollEdgeState {
  if (!panel) {
    return { canScroll: false, atTop: true, atBottom: true }
  }

  const maxScrollTop = Math.max(0, panel.scrollHeight - panel.clientHeight)
  const canScroll = maxScrollTop > 1
  const atTop = panel.scrollTop <= 1
  const atBottom = maxScrollTop - panel.scrollTop <= 1

  return { canScroll, atTop, atBottom }
}

export function resolveWheelSectionDelta(options: {
  deltaY: number
  isAnimating: boolean
  panel: CanvasPanelMetrics | null | undefined
}): -1 | 1 | null {
  const { deltaY, isAnimating, panel } = options
  if (isAnimating) return null
  if (Math.abs(deltaY) < WHEEL_THRESHOLD) return null
  if (!panel) return null

  const { canScroll, atTop, atBottom } = getScrollEdgeState(panel)

  if (deltaY > 0) {
    if (canScroll && !atBottom) return null
    return 1
  }

  if (canScroll && !atTop) return null
  return -1
}

export function resolveSwipeSectionDelta(options: {
  deltaX: number
  deltaY: number
  isAnimating: boolean
  panel: CanvasPanelMetrics | null | undefined
}): -1 | 1 | null {
  const { deltaX, deltaY, isAnimating, panel } = options
  if (isAnimating) return null

  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  if (absY < SWIPE_THRESHOLD || absY <= absX) return null

  const { canScroll, atTop, atBottom } = getScrollEdgeState(panel)

  if (deltaY < 0) {
    if (canScroll && !atBottom) return null
    return 1
  }

  if (canScroll && !atTop) return null
  return -1
}
