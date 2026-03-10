import { useMemo } from "react"
import type { BoardNotificationsInput } from "../types"

export function useBoardNotificationsController(input: BoardNotificationsInput) {
  return useMemo(() => ({ input }), [input])
}
