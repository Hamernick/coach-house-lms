"use client"

import { useEffect, useRef } from "react"

type WorkspaceRuntimeDebugPayload = Record<string, unknown>

type WorkspaceRuntimeDebugEvent = {
  kind: string
  at: string
  timestampMs: number
  payload: WorkspaceRuntimeDebugPayload
}

const WORKSPACE_DEBUG_QUERY_KEYS = [
  "workspaceDebug",
  "workspace_debug",
  "workspace-debug",
] as const
const MAX_RUNTIME_DEBUG_EVENTS = 400
const WORKSPACE_RUNTIME_DEBUG_ENV_FLAG =
  process.env.NEXT_PUBLIC_ENABLE_WORKSPACE_RUNTIME_DEBUG === "1"

declare global {
  interface Window {
    __workspaceRuntimeDebugEnabled?: boolean
    __workspaceRuntimeDebugEvents?: WorkspaceRuntimeDebugEvent[]
    __workspaceRuntimeDebugDump?: () => WorkspaceRuntimeDebugEvent[]
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

function ensureRuntimeDebugDumpAccessor() {
  if (typeof window === "undefined") return
  if (typeof window.__workspaceRuntimeDebugDump === "function") return
  window.__workspaceRuntimeDebugDump = () => {
    if (!Array.isArray(window.__workspaceRuntimeDebugEvents)) return []
    return [...window.__workspaceRuntimeDebugEvents]
  }
}

export function isWorkspaceRuntimeDebugEnabled() {
  if (typeof window === "undefined") return false

  if (window.__workspaceRuntimeDebugEnabled !== undefined) {
    return window.__workspaceRuntimeDebugEnabled
  }

  if (!WORKSPACE_RUNTIME_DEBUG_ENV_FLAG) {
    window.__workspaceRuntimeDebugEnabled = false
    return false
  }

  const queryFlag = readDebugQueryFlag(new URLSearchParams(window.location.search))
  const enabled = queryFlag === true
  window.__workspaceRuntimeDebugEnabled = enabled
  return enabled
}

export function logWorkspaceRuntimeDebug(
  kind: string,
  payload: WorkspaceRuntimeDebugPayload = {},
) {
  if (!isWorkspaceRuntimeDebugEnabled()) return
  if (typeof window === "undefined") return

  ensureRuntimeDebugDumpAccessor()

  if (!Array.isArray(window.__workspaceRuntimeDebugEvents)) {
    window.__workspaceRuntimeDebugEvents = []
  }

  window.__workspaceRuntimeDebugEvents.push({
    kind,
    at: new Date().toISOString(),
    timestampMs:
      typeof performance !== "undefined" && Number.isFinite(performance.now())
        ? performance.now()
        : Date.now(),
    payload,
  })

  if (window.__workspaceRuntimeDebugEvents.length > MAX_RUNTIME_DEBUG_EVENTS) {
    window.__workspaceRuntimeDebugEvents = window.__workspaceRuntimeDebugEvents.slice(
      -MAX_RUNTIME_DEBUG_EVENTS,
    )
  }
}

export function useWorkspaceRenderRateWatchdog({
  label,
  warnAt = 80,
  windowMs = 1000,
}: {
  label: string
  warnAt?: number
  windowMs?: number
}) {
  const debugEnabled = isWorkspaceRuntimeDebugEnabled()
  const windowStartRef = useRef<number>(0)
  const renderCountRef = useRef(0)

  if (debugEnabled) {
    renderCountRef.current += 1
  }

  useEffect(() => {
    if (!debugEnabled) {
      renderCountRef.current = 0
      windowStartRef.current = 0
      return
    }
    const now =
      typeof performance !== "undefined" && Number.isFinite(performance.now())
        ? performance.now()
        : Date.now()

    if (windowStartRef.current <= 0) {
      windowStartRef.current = now
      return
    }

    if (now - windowStartRef.current > windowMs) {
      windowStartRef.current = now
      renderCountRef.current = 0
      return
    }

    if (renderCountRef.current === warnAt) {
      const payload = {
        label,
        renderCount: renderCountRef.current,
        windowMs,
      }
      console.warn("[workspace-runtime-debug] render_rate", payload)
      logWorkspaceRuntimeDebug("render_rate", payload)
    }
  }, [debugEnabled, label, warnAt, windowMs])
}
