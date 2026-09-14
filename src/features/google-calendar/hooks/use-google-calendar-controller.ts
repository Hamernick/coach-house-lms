"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "@/lib/toast"
import { calendarErrorMessage } from "../lib"
import type { CalendarSummary } from "../types"
const CHANGED = "coachhouse:google-calendar-changed"
export async function calendarClientRequest<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch("/api/integrations/google-calendar/" + path, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
  })
  const result = await response.json()
  if (!response.ok)
    throw new Error(calendarErrorMessage(result.code ?? "provider_unavailable"))
  return result as T
}
export function useGoogleCalendarController() {
  const [summary, setSummary] = useState<CalendarSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const requestState = useRef({ version: 0 })
  const version = requestState.current
  const mounted = useRef(false)
  const refresh = useCallback(async () => {
    const request = ++version.version
    try {
      const result = await calendarClientRequest<CalendarSummary>("connection")
      if (mounted.current && request === version.version) {
        setSummary(result)
        setError(null)
      }
    } catch (cause) {
      if (mounted.current && request === version.version)
        setError(
          cause instanceof Error ? cause.message : "Could not load Calendar."
        )
    }
  }, [version])
  useEffect(() => {
    mounted.current = true
    void refresh()
    const onRefresh = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    window.addEventListener(CHANGED, onRefresh)
    window.addEventListener("focus", onRefresh)
    const timer = window.setInterval(onRefresh, 30000)
    return () => {
      mounted.current = false
      version.version++
      window.clearInterval(timer)
      window.removeEventListener(CHANGED, onRefresh)
      window.removeEventListener("focus", onRefresh)
    }
  }, [refresh, version])
  const perform = useCallback(
    async (path: string, body: unknown = {}) => {
      if (busy.current) return false
      busy.current = true
      setPending(true)
      setError(null)
      try {
        const result = await calendarClientRequest<{
          url?: string
          complete?: boolean
        }>(path, body)
        if (path === "connect" && result.url) {
          const url = new URL(result.url)
          if (url.origin !== "https://accounts.google.com")
            throw new Error("Invalid Google connection.")
          window.location.assign(url.toString())
        } else {
          await refresh()
          window.dispatchEvent(new Event(CHANGED))
          if (path === "sync")
            toast.success(
              result.complete
                ? "Calendar synced"
                : "Sync started. Remaining events will continue in the background."
            )
        }
        return true
      } catch (cause) {
        if (mounted.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not update Calendar."
          )
        return false
      } finally {
        busy.current = false
        if (mounted.current) setPending(false)
      }
    },
    [refresh]
  )
  return { summary, error, pending, refresh, perform }
}
export type CalendarController = ReturnType<typeof useGoogleCalendarController>
