import type { DocumentIndexRow, SortColumn, SortDirection } from "../types"
import {
  applyDocumentFilters,
  filterRowsBySearchQuery,
} from "./documents-index-row-filtering"
import { sortDocumentRows } from "./documents-index-row-sorting"
import {
  buildDocumentsFilterState,
  type DocumentsFilterState,
} from "./documents-index-filter-state"

export { buildDocumentsFilterState }
export type { DocumentsFilterState }

type FilterAndSortRowsArgs = {
  rows: DocumentIndexRow[]
  filterState: DocumentsFilterState
  searchQuery: string
  sortColumn: SortColumn
  sortDirection: SortDirection
}

export function filterAndSortDocumentRows({
  rows,
  filterState,
  searchQuery,
  sortColumn,
  sortDirection,
}: FilterAndSortRowsArgs): DocumentIndexRow[] {
  const filteredRows = applyDocumentFilters(rows, filterState)
  const searchedRows = filterRowsBySearchQuery(filteredRows, searchQuery)
  return sortDocumentRows(searchedRows, sortColumn, sortDirection)
}
