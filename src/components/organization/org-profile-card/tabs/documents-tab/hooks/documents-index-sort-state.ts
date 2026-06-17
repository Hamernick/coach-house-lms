import type { SortColumn, SortDirection } from "../types"

export type DocumentsSortState = {
  sortColumn: SortColumn
  sortDirection: SortDirection
}

export const DEFAULT_DOCUMENTS_SORT_STATE: DocumentsSortState = {
  sortColumn: "status",
  sortDirection: "asc",
}

export function getDefaultDocumentsSortDirection(
  column: SortColumn
): SortDirection {
  return column === "updatedAt" ? "desc" : "asc"
}

export function resolveNextDocumentsSortState(
  currentState: DocumentsSortState,
  column: SortColumn
): DocumentsSortState {
  if (currentState.sortColumn === column) {
    return {
      sortColumn: column,
      sortDirection: currentState.sortDirection === "asc" ? "desc" : "asc",
    }
  }

  return {
    sortColumn: column,
    sortDirection: getDefaultDocumentsSortDirection(column),
  }
}
