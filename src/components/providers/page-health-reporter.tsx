"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import type {
  PageHealthEventInput,
  PageHealthEventType,
  PageHealthSeverity,
} from "@/features/page-health-monitor"

const PAGE_HEALTH_ENDPOINT = "/api/telemetry/page-health"
const SLOW_PAGE_LOAD_MS = 3500
const STUCK_PAGE_LOAD_MS = 10000
const reportedSignatures = new Set<string>()

function sanitizePageHealthPath(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed, "https://coachhouse.local")
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.pathname.slice(0, 300)
  } catch {
    return trimmed.split(/[?#]/)[0]?.slice(0, 300) ?? null
  }
}

function currentPath() {
  if (typeof window === "undefined") return null
  return sanitizePageHealthPath(window.location.href)
}

function hashString(value: string | null | undefined) {
  if (!value) return null
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

function reportSignature(input: PageHealthEventInput) {
  return [
    input.eventType,
    input.routePath,
    input.errorName,
    input.errorMessage,
    input.errorDigest,
    input.durationMs,
  ].join(":")
}

function sendPageHealthPayload(input: PageHealthEventInput) {
  const body = JSON.stringify(input)

  if (navigator.sendBeacon) {
    const payload = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(PAGE_HEALTH_ENDPOINT, payload)) return
  }

  void fetch(PAGE_HEALTH_ENDPOINT, {
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined)
}

export function reportPageHealthEvent(input: PageHealthEventInput) {
  if (typeof window === "undefined") return

  const routePath = sanitizePageHealthPath(input.routePath) ?? currentPath()
  const targetHref = sanitizePageHealthPath(input.targetHref)
  const payload: PageHealthEventInput = {
    ...input,
    routePath,
    targetHref,
    metadata: {
      viewport: {
        height: window.innerHeight,
        width: window.innerWidth,
      },
      visibilityState: document.visibilityState,
      ...(input.metadata ?? {}),
    },
  }
  const signature = reportSignature(payload)
  if (reportedSignatures.has(signature)) return
  reportedSignatures.add(signature)
  sendPageHealthPayload(payload)
}

export function reportPageHealthError({
  error,
  eventType,
  severity = "critical",
  source = "client",
}: {
  error: unknown
  eventType: PageHealthEventType
  severity?: PageHealthSeverity
  source?: PageHealthEventInput["source"]
}) {
  const errorRecord =
    error && typeof error === "object" ? (error as Record<string, unknown>) : {}
  const message =
    typeof errorRecord.message === "string"
      ? errorRecord.message
      : typeof error === "string"
        ? error
        : "Unknown client error"

  reportPageHealthEvent({
    errorDigest:
      typeof errorRecord.digest === "string" ? errorRecord.digest : null,
    errorMessage: message,
    errorName:
      typeof errorRecord.name === "string" ? errorRecord.name : "Error",
    eventType,
    severity,
    source,
    stackHash:
      typeof errorRecord.stack === "string"
        ? hashString(errorRecord.stack)
        : null,
  })
}

function reportInitialNavigationTiming() {
  const [navigation] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[]
  const durationMs = navigation?.duration
  if (!durationMs) return

  const eventType =
    durationMs >= STUCK_PAGE_LOAD_MS ? "stuck_page_load" : "slow_page_load"
  const thresholdMs =
    eventType === "stuck_page_load" ? STUCK_PAGE_LOAD_MS : SLOW_PAGE_LOAD_MS

  if (durationMs < thresholdMs) return

  reportPageHealthEvent({
    durationMs,
    eventType,
    severity: eventType === "stuck_page_load" ? "critical" : "warning",
    source: "client",
    thresholdMs,
  })
}

export function PageHealthReporter() {
  const pathname = usePathname()

  useEffect(() => {
    reportInitialNavigationTiming()
  }, [])

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      reportPageHealthError({
        error: event.error ?? event.message,
        eventType: "route_error",
      })
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      reportPageHealthError({
        error: event.reason,
        eventType: "unhandled_rejection",
      })
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    if (!pathname) return
    reportedSignatures.clear()
  }, [pathname])

  return null
}
