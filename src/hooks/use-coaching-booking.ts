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

function getTierSuccessMessage(payload: CoachingSchedulePayload) {
  if (payload.tier === "free") {
    if (typeof payload.remaining === "number") {
      return `${payload.remaining} included session${payload.remaining === 1 ? "" : "s"} remaining after this booking.`
    }
    return "Opening your included coaching session booking link."
  }
  if (payload.tier === "discounted") {
    return "Included sessions used. Opening your discounted coaching booking link."
  }
  if (payload.tier === "full") {
    return "Opening your coaching booking link."
  }
  return "Opening your scheduling link."
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
      toast.success(getTierSuccessMessage(payload))
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
