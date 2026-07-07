import { useMemo } from "react"
import type { PageHealthMonitorInput } from "../types"

export function usePageHealthMonitorController(input: PageHealthMonitorInput) {
  return useMemo(() => ({ input }), [input])
}
