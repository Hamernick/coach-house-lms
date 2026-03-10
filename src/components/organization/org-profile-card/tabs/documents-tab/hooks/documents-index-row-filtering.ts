import { NEEDS_ATTENTION_STATUSES, SOURCE_LABEL, STATUS_META } from "../constants"
import { toTimestamp } from "../helpers"
import type { DocumentIndexRow } from "../types"
import type { DocumentsFilterState } from "./documents-index-filter-state"

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30

export function applyDocumentFilters(
  rows: DocumentIndexRow[],
  filterState: DocumentsFilterState,
): DocumentIndexRow[] {
  const now = Date.now()
  const {
    activeCategoryFilters,
    activeSourceFilters,
    activeStatusFilters,
    activeVisibilityFilters,
    needsAttentionEnabled,
    updated30dEnabled,
  } = filterState

  let nextRows = [...rows]

  if (activeSourceFilters.size > 0) {
    nextRows = nextRows.filter((row) => activeSourceFilters.has(row.source))
  }

  if (activeStatusFilters.size > 0) {
    nextRows = nextRows.filter((row) => activeStatusFilters.has(row.status))
  }

  if (activeVisibilityFilters.size > 0) {
    nextRows = nextRows.filter((row) => activeVisibilityFilters.has(row.visibility))
  }

  if (activeCategoryFilters.size > 0) {
    nextRows = nextRows.filter((row) =>
      row.categories.some((category) => activeCategoryFilters.has(category)),
    )
  }

  if (needsAttentionEnabled) {
    nextRows = nextRows.filter((row) => NEEDS_ATTENTION_STATUSES.has(row.status))
  }

  if (updated30dEnabled) {
    nextRows = nextRows.filter((row) => {
      const timestamp = toTimestamp(row.updatedAt)
      if (!timestamp) return false
      return now - timestamp <= THIRTY_DAYS_IN_MS
    })
  }

  return nextRows
}

export function filterRowsBySearchQuery(
  rows: DocumentIndexRow[],
  searchQuery: string,
): DocumentIndexRow[] {
  const q = searchQuery.trim().toLowerCase()
  if (q.length === 0) return rows

  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.description,
      row.categories.join(" "),
      SOURCE_LABEL[row.source],
      STATUS_META[row.status].label,
    ]
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })
}
