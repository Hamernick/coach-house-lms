"use client"

import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "./workspace-board-types"

type WorkspaceBoardDebugPayload = Record<string, unknown>

export type WorkspaceBoardDebugPhase =
  | "click"
  | "toggle_reduced"
  | "graph_composed"
  | "flow_rendered"
  | "fit_view_started"
  | "fit_view_done"
  | "paint_observed"

export type WorkspaceBoardToggleSource = "dock" | "context-menu" | "unknown"

export type WorkspaceBoardToggleContext = {
  source: WorkspaceBoardToggleSource
  interactionId?: string
}

type WorkspaceBoardDebugEvent = {
  event: string
  at: string
  sessionId: string
  payload: WorkspaceBoardDebugPayload
}

type WorkspaceBoardInteraction = {
  id: string
  source: WorkspaceBoardToggleSource
  cardId: WorkspaceCardId
  startedAtMs: number
}

const WORKSPACE_DEBUG_QUERY_KEYS = ["workspaceDebug", "workspace_debug", "workspace-debug"] as const
const MAX_DEBUG_EVENTS = 500
const WORKSPACE_DEBUG_THROTTLED_EVENTS = new Set<string>([
  "dock_render",
])
const WORKSPACE_DEBUG_THROTTLE_WINDOW_MS = 250
const WORKSPACE_DEBUG_ALWAYS_EVENTS = new Set<string>([])
const WORKSPACE_BOARD_DEBUG_ENV_FLAG =
  process.env.NEXT_PUBLIC_ENABLE_WORKSPACE_BOARD_DEBUG === "1"

declare global {
  interface Window {
    __workspaceBoardDebugEnabled?: boolean
    __workspaceBoardDebugEvents?: WorkspaceBoardDebugEvent[]
    __workspaceBoardDebugSessionId?: string
    __workspaceBoardActiveInteraction?: WorkspaceBoardInteraction | null
    __workspaceBoardDebugDump?: () => WorkspaceBoardDebugEvent[]
    __workspaceBoardDebugThrottleState?: Record<
      string,
      {
        signature: string
        at: number
      }
    >
  }
}

function readDebugQueryFlag(searchParams: URLSearchParams) {
  for (const key of WORKSPACE_DEBUG_QUERY_KEYS) {
    const value = searchParams.get(key)
    if (!value) continue
    if (value === "1" || value === "true" || value === "on") return true
    if (value === "0" || value === "false" || value === "off") return false
  }
  return null
}

function readNowMs() {
  if (typeof performance !== "undefined" && Number.isFinite(performance.now())) {
    return performance.now()
  }
  return Date.now()
}

function createDebugId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

function readDebugSessionId() {
  if (typeof window === "undefined") return "server"
  if (!window.__workspaceBoardDebugSessionId) {
    window.__workspaceBoardDebugSessionId = createDebugId("workspace")
  }
  return window.__workspaceBoardDebugSessionId
}

function ensureDebugDumpAccessor() {
  if (typeof window === "undefined") return
  if (typeof window.__workspaceBoardDebugDump === "function") return
  window.__workspaceBoardDebugDump = () => {
    if (!Array.isArray(window.__workspaceBoardDebugEvents)) return []
    return [...window.__workspaceBoardDebugEvents]
  }
}

export function isWorkspaceBoardDebugEnabled() {
  if (typeof window === "undefined") return false

  if (window.__workspaceBoardDebugEnabled !== undefined) {
    return window.__workspaceBoardDebugEnabled
  }

  if (!WORKSPACE_BOARD_DEBUG_ENV_FLAG) {
    window.__workspaceBoardDebugEnabled = false
    return false
  }

  const queryFlag = readDebugQueryFlag(new URLSearchParams(window.location.search))
  const enabled = queryFlag === true
  window.__workspaceBoardDebugEnabled = enabled
  return enabled
}

export function beginWorkspaceBoardInteraction({
  source,
  cardId,
}: {
  source: WorkspaceBoardToggleSource
  cardId: WorkspaceCardId
}) {
  const nextInteraction: WorkspaceBoardInteraction = {
    id: createDebugId("ws-interaction"),
    source,
    cardId,
    startedAtMs: readNowMs(),
  }
  if (typeof window !== "undefined") {
    window.__workspaceBoardActiveInteraction = nextInteraction
  }
  return nextInteraction
}

export function getWorkspaceBoardActiveInteraction() {
  if (typeof window === "undefined") return null
  return window.__workspaceBoardActiveInteraction ?? null
}

export function clearWorkspaceBoardInteraction(interactionId?: string) {
  if (typeof window === "undefined") return
  const activeInteraction = window.__workspaceBoardActiveInteraction
  if (!activeInteraction) return
  if (interactionId && activeInteraction.id !== interactionId) return
  window.__workspaceBoardActiveInteraction = null
}

export function getWorkspaceBoardInteractionElapsedMs(interactionId?: string) {
  const activeInteraction = getWorkspaceBoardActiveInteraction()
  if (!activeInteraction) return null
  if (interactionId && activeInteraction.id !== interactionId) return null
  const elapsed = readNowMs() - activeInteraction.startedAtMs
  return Number.isFinite(elapsed) ? Math.max(0, Math.round(elapsed)) : null
}

export function logWorkspaceBoardPhase(
  phase: WorkspaceBoardDebugPhase,
  payload: WorkspaceBoardDebugPayload = {},
) {
  const activeInteraction = getWorkspaceBoardActiveInteraction()
  const elapsedMs = activeInteraction
    ? getWorkspaceBoardInteractionElapsedMs(activeInteraction.id)
    : null

  logWorkspaceBoardDebug("workspace_interaction_phase", {
    phase,
    interactionId: activeInteraction?.id ?? null,
    interactionSource: activeInteraction?.source ?? null,
    interactionCardId: activeInteraction?.cardId ?? null,
    elapsedMs,
    ...payload,
  })
}

export function logWorkspaceBoardDebug(
  event: string,
  payload: WorkspaceBoardDebugPayload = {},
) {
  const debugEnabled = isWorkspaceBoardDebugEnabled()
  const alwaysLog = WORKSPACE_DEBUG_ALWAYS_EVENTS.has(event)
  if (!debugEnabled && !alwaysLog) return
  if (typeof window === "undefined") return

  ensureDebugDumpAccessor()
  const activeInteraction = getWorkspaceBoardActiveInteraction()
  const interactionId =
    typeof payload.interactionId === "string"
      ? payload.interactionId
      : activeInteraction?.id ?? null
  const interactionSource =
    typeof payload.interactionSource === "string"
      ? payload.interactionSource
      : activeInteraction?.source ?? null
  const interactionCardId =
    typeof payload.interactionCardId === "string"
      ? payload.interactionCardId
      : activeInteraction?.cardId ?? null
  const entryPayload: WorkspaceBoardDebugPayload = {
    ...payload,
    sessionId: readDebugSessionId(),
    interactionId,
    interactionSource,
    interactionCardId,
  }

  const entry: WorkspaceBoardDebugEvent = {
    event,
    at: new Date().toISOString(),
    sessionId: readDebugSessionId(),
    payload: entryPayload,
  }

  if (WORKSPACE_DEBUG_THROTTLED_EVENTS.has(event)) {
    let signature = ""
    try {
      const signaturePayload = { ...entryPayload }
      delete signaturePayload.elapsedMs
      signature = JSON.stringify(signaturePayload)
    } catch {
      signature = "[unserializable-payload]"
    }

    if (!window.__workspaceBoardDebugThrottleState) {
      window.__workspaceBoardDebugThrottleState = {}
    }

    const previous = window.__workspaceBoardDebugThrottleState[event]
    const now = Date.now()
    if (
      previous &&
      previous.signature === signature &&
      now - previous.at < WORKSPACE_DEBUG_THROTTLE_WINDOW_MS
    ) {
      return
    }

    window.__workspaceBoardDebugThrottleState[event] = {
      signature,
      at: now,
    }
  }

  if (!Array.isArray(window.__workspaceBoardDebugEvents)) {
    window.__workspaceBoardDebugEvents = []
  }
  window.__workspaceBoardDebugEvents.push(entry)
  if (window.__workspaceBoardDebugEvents.length > MAX_DEBUG_EVENTS) {
    window.__workspaceBoardDebugEvents = window.__workspaceBoardDebugEvents.slice(-MAX_DEBUG_EVENTS)
  }

  if (alwaysLog && !debugEnabled) {
    let payloadSummary = ""
    try {
      payloadSummary = JSON.stringify(entryPayload)
    } catch {
      payloadSummary = "[unserializable-payload]"
    }
    console.warn(`[workspace-debug] ${event} ${payloadSummary}`)
    return
  }
  console.info(`[workspace-debug] ${event}`, entry)
}

export function summarizeWorkspaceBoardVisibility(state: WorkspaceBoardState) {
  const hiddenCardIds = state.hiddenCardIds
  const nodeIds = state.nodes.map((node) => node.id)
  const visibleCardIds = nodeIds.filter((cardId) => !hiddenCardIds.includes(cardId))

  return {
    nodeIds,
    hiddenCardIds,
    visibleCardIds,
    hiddenCount: hiddenCardIds.length,
    visibleCount: visibleCardIds.length,
    allCardsHiddenExplicitly: state.visibility?.allCardsHiddenExplicitly ?? false,
  }
}
