"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

import type { CoachingCoachId, CoachingTier } from "@/lib/meetings"

type CoachingSchedulePayload = {
  url?: string
  tier?: CoachingTier
  coach?: CoachingCoachId
  remaining?: number | null
}

type CoachingBookingOptions = {
  coach?: CoachingCoachId
}

export function useCoachingBooking() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const schedule = useCallback(
    async (_options?: CoachingBookingOptions): Promise<CoachingSchedulePayload | null> => {
      setPending(true)
      router.push("/coaching")
      return null
    },
    [router],
  )

  return { schedule, pending }
}
