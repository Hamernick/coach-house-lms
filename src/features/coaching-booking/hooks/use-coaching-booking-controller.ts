import { useMemo } from "react"
import type { CoachingBookingInput } from "../types"

export function useCoachingBookingController(input: CoachingBookingInput) {
  return useMemo(() => ({ input }), [input])
}
