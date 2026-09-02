"use client"

import * as React from "react"

import { validatePublicHandle } from "../lib"

export type PublicHandleAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"

type UsePublicHandleAvailabilityOptions = {
  open: boolean
  handleValue: string
  currentHandle?: string | null
}

export function usePublicHandleAvailability({
  open,
  handleValue,
  currentHandle = null,
}: UsePublicHandleAvailabilityOptions) {
  const [status, setStatus] =
    React.useState<PublicHandleAvailabilityStatus>("idle")
  const [hint, setHint] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    const validation = validatePublicHandle(handleValue)
    if (!handleValue.trim()) {
      setStatus("idle")
      setHint(null)
      return
    }
    if (!validation.valid) {
      setStatus("unavailable")
      setHint(
        validation.code === "reserved"
          ? "That username is reserved."
          : "Use 2–48 lowercase letters, numbers, or single hyphens."
      )
      return
    }
    if (validation.handle === currentHandle?.trim().toLowerCase()) {
      setStatus("available")
      setHint(null)
      return
    }

    let mounted = true
    const controller = new AbortController()
    setStatus("checking")
    setHint(null)

    const timeoutId = window.setTimeout(() => {
      void fetch(
        `/api/public/handles/availability?handle=${encodeURIComponent(validation.handle)}`,
        { method: "GET", signal: controller.signal }
      )
        .then(async (response) => {
          const payload = (await response.json().catch(() => ({}))) as {
            available?: boolean
            error?: string
          }
          if (!mounted) return
          if (!response.ok) {
            setStatus("unavailable")
            setHint(payload.error ?? "Unable to check username right now.")
            return
          }
          setStatus(payload.available ? "available" : "unavailable")
          setHint(
            payload.available
              ? null
              : (payload.error ?? "That username is already taken.")
          )
        })
        .catch((error: unknown) => {
          if (!mounted) return
          if (error instanceof Error && error.name === "AbortError") return
          setStatus("unavailable")
          setHint("Unable to check username right now.")
        })
    }, 350)

    return () => {
      mounted = false
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [currentHandle, handleValue, open])

  return { status, hint }
}
