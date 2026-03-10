import type { SortColumn, SortDirection } from "../types"

export type DocumentsToolbarProps = {
  searchQuery: string
  activeFilters: string[]
  hasRoadmapDocuments: boolean
  categoryOptions: string[]
  sortColumn: SortColumn
  sortDirection: SortDirection
  needsAttentionEnabled: boolean
  updated30dEnabled: boolean
  canEdit: boolean
  editMode: boolean
  onSearchQueryChange: (value: string) => void
  onToggleFilter: (token: string) => void
  onClearFilters: () => void
  onSortColumnChange: (column: SortColumn) => void
  onSortDirectionChange: (direction: SortDirection) => void
  onOpenNewPolicy: () => void
}
