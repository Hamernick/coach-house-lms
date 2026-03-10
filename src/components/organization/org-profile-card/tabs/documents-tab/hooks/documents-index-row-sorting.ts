import {
  SOURCE_SORT_RANK,
  STATUS_SORT_RANK,
  VISIBILITY_SORT_RANK,
} from "../constants"
import { getPrimaryCategory, toTimestamp } from "../helpers"
import type { DocumentIndexRow, SortColumn, SortDirection } from "../types"

function compareRowsByColumn(
  a: DocumentIndexRow,
  b: DocumentIndexRow,
  sortColumn: SortColumn,
) {
  switch (sortColumn) {
    case "status":
      return STATUS_SORT_RANK[a.status] - STATUS_SORT_RANK[b.status]
    case "name":
      return a.name.localeCompare(b.name)
    case "category":
      return getPrimaryCategory(a).localeCompare(getPrimaryCategory(b))
    case "source":
      return SOURCE_SORT_RANK[a.source] - SOURCE_SORT_RANK[b.source]
    case "visibility":
      return VISIBILITY_SORT_RANK[a.visibility] - VISIBILITY_SORT_RANK[b.visibility]
    case "updatedAt":
      return toTimestamp(a.updatedAt) - toTimestamp(b.updatedAt)
    default:
      return 0
  }
}

export function sortDocumentRows(
  rows: DocumentIndexRow[],
  sortColumn: SortColumn,
  sortDirection: SortDirection,
) {
  const direction = sortDirection === "asc" ? 1 : -1

  return [...rows].sort((a, b) => {
    const compare = compareRowsByColumn(a, b, sortColumn)
    if (compare !== 0) return compare * direction

    const updatedDelta = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt)
    if (updatedDelta !== 0) return updatedDelta
    return a.name.localeCompare(b.name)
  })
}
