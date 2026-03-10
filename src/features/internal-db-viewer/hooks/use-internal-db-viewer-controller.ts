import { useMemo } from "react"
import type { InternalDbViewerSnapshot } from "../types"

export function useInternalDbViewerController(snapshot: InternalDbViewerSnapshot) {
  return useMemo(
    () => ({
      selectedTable: snapshot.selectedTable,
      rowCount: snapshot.rowCount,
      hasError: Boolean(snapshot.error),
    }),
    [snapshot.error, snapshot.rowCount, snapshot.selectedTable],
  )
}
