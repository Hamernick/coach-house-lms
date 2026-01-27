"use client"

import { useState } from "react"

import type { CoachingTier } from "@/lib/meetings"
import { toast } from "@/lib/toast"

type CoachingSchedulePayload = {
  error?: string
  url?: string
  tier?: CoachingTier
  remaining?: number | null
}

export function useCoachingBooking() {
  const [pending, setPending] = useState(false)

  const schedule = async () => {
    if (pending) return null
    setPending(true)
    try {
      const response = await fetch("/api/meetings/schedule", { method: "GET" })
      const payload = (await response.json().catch(() => ({}))) as CoachingSchedulePayload
      if (!response.ok) {
        toast.error(payload.error ?? "Unable to schedule a meeting right now.")
        return null
      }
      if (!payload.url) {
        toast.error("Scheduling link unavailable.")
        return null
      }
      window.open(payload.url, "_blank", "noopener,noreferrer")
      toast.success("Opening your scheduling link.")
      return payload
    } catch (error) {
      console.error(error)
      toast.error("Unable to schedule a meeting right now.")
      return null
    } finally {
      setPending(false)
    }
  }

  return { schedule, pending }
}
