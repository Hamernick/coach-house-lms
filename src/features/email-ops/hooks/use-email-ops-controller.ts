import { useMemo } from "react"
import type { EmailOpsDashboardInput } from "../types"

export function useEmailOpsController(input: EmailOpsDashboardInput) {
  return useMemo(() => ({ input }), [input])
}
