import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import { logWorkspaceCanvasError } from "../runtime/workspace-canvas-logger"

export const WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS = Object.freeze({
  padding: 0.24,
  minZoom: 0.2,
  maxZoom: 1.25,
  duration: 220,
})

export const WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS = Object.freeze({
  padding: 0.3,
  minZoom: 0.24,
  maxZoom: 1.14,
  duration: 280,
})

export const WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS = Object.freeze({
  padding: 0.28,
  minZoom: 0.2,
  maxZoom: 1.1,
  duration: 260,
})

export const WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS = Object.freeze({
  padding: 0.34,
  minZoom: 0.24,
  maxZoom: 1.15,
  duration: 240,
})

function normalizeWorkspaceReactFlowErrorPart(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function handleWorkspaceReactFlowError(
  errorCode: string | null | undefined,
  message: string | null | undefined,
) {
  const normalizedErrorCode = normalizeWorkspaceReactFlowErrorPart(errorCode)
  const normalizedMessage = normalizeWorkspaceReactFlowErrorPart(message)

  // React DevTools can trip the callback with empty arguments during refresh.
  if (!normalizedErrorCode && !normalizedMessage) {
    return
  }

  logWorkspaceCanvasError(WORKSPACE_CANVAS_EVENTS.REACTFLOW_ERROR, {
    ...(normalizedErrorCode ? { errorCode: normalizedErrorCode } : {}),
    ...(normalizedMessage ? { message: normalizedMessage } : {}),
  })
}
