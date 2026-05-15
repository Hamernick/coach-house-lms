import { useMemo } from "react"
import type { UserJourneyAtlasInput } from "../types"

export function useUserJourneyAtlasController(input: UserJourneyAtlasInput) {
  return useMemo(() => ({ input }), [input])
}
