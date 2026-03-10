import type { WorkspaceCanvasEventName } from "../contracts/workspace-canvas-events"

const WORKSPACE_CANVAS_LOG_PREFIX = "[workspace-canvas]"

function nowIso() {
  return new Date().toISOString()
}

export function logWorkspaceCanvasEvent(
  event: WorkspaceCanvasEventName,
  payload: Record<string, unknown> = {},
) {
  if (process.env.NODE_ENV !== "development") return
  console.info(`${WORKSPACE_CANVAS_LOG_PREFIX} ${event}`, {
    event,
    ts: nowIso(),
    ...payload,
  })
}

export function logWorkspaceCanvasWarning(
  event: WorkspaceCanvasEventName,
  payload: Record<string, unknown> = {},
) {
  if (process.env.NODE_ENV !== "development") return
  console.warn(`${WORKSPACE_CANVAS_LOG_PREFIX} ${event}`, {
    event,
    ts: nowIso(),
    ...payload,
  })
}

export function logWorkspaceCanvasError(
  event: WorkspaceCanvasEventName,
  payload: Record<string, unknown> = {},
) {
  if (process.env.NODE_ENV !== "development") return
  console.error(`${WORKSPACE_CANVAS_LOG_PREFIX} ${event}`, {
    event,
    ts: nowIso(),
    ...payload,
  })
}
