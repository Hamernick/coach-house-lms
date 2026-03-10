"use client"

import * as React from "react"

import { RESERVED_SLUGS } from "../constants"
import type { OnboardingSlugStatus } from "../types"

type UseSlugAvailabilityOptions = {
  open: boolean
  slugValue: string
}

export function useSlugAvailability({
  open,
  slugValue,
}: UseSlugAvailabilityOptions): {
  slugStatus: OnboardingSlugStatus
  slugHint: string | null
} {
  const [slugStatus, setSlugStatus] =
    React.useState<OnboardingSlugStatus>("idle")
  const [slugHint, setSlugHint] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    const normalized = slugValue
    if (!normalized) {
      setSlugStatus("idle")
      setSlugHint(null)
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
      setSlugStatus("unavailable")
      setSlugHint("Use letters, numbers, and hyphens.")
      return
    }
    if (RESERVED_SLUGS.has(normalized)) {
      setSlugStatus("unavailable")
      setSlugHint("That URL is reserved.")
      return
    }

    let mounted = true
    const controller = new AbortController()
    setSlugStatus("checking")
    setSlugHint(null)

    const timeoutId = window.setTimeout(() => {
      void fetch(
        `/api/public/organizations/slug-available?slug=${encodeURIComponent(normalized)}`,
        {
          method: "GET",
          signal: controller.signal,
        },
      )
        .then(async (res) => {
          const payload = (await res.json().catch(() => ({}))) as {
            available?: boolean
            error?: string
          }
          if (!mounted) return
          if (!res.ok) {
            setSlugStatus("unavailable")
            setSlugHint(payload.error ?? "Unable to check URL right now.")
            return
          }
          if (payload.available) {
            setSlugStatus("available")
            setSlugHint(null)
          } else {
            setSlugStatus("unavailable")
            setSlugHint(payload.error ?? "That URL is not available.")
          }
        })
        .catch((error: unknown) => {
          if (!mounted) return
          if (error instanceof Error && error.name === "AbortError") return
          setSlugStatus("unavailable")
          setSlugHint("Unable to check URL right now.")
        })
    }, 350)

    return () => {
      mounted = false
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [open, slugValue])

  return { slugStatus, slugHint }
}
