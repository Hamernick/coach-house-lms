import { useMemo } from "react"
import type { FiscalSponsorshipInput } from "../types"

export function useFiscalSponsorshipController(input: FiscalSponsorshipInput) {
  return useMemo(() => ({ input }), [input])
}
