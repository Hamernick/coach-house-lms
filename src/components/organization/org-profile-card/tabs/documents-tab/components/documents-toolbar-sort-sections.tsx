"use client"

import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  FILTER_SPECIAL_NEEDS_ATTENTION,
  FILTER_SPECIAL_UPDATED_30_DAYS,
  SORT_COLUMN_LABELS,
} from "../constants"
import type { SortColumn, SortDirection } from "../types"

type SortSectionProps = {
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSortColumnChange: (column: SortColumn) => void
  onSortDirectionChange: (direction: SortDirection) => void
}

export function SortSection({
  sortColumn,
  sortDirection,
  onSortColumnChange,
  onSortDirectionChange,
}: SortSectionProps) {
  return (
    <>
      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={sortColumn}
        onValueChange={(value) => onSortColumnChange(value as SortColumn)}
      >
        {(Object.keys(SORT_COLUMN_LABELS) as SortColumn[]).map((column) => (
          <DropdownMenuRadioItem key={column} value={column}>
            {SORT_COLUMN_LABELS[column]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuLabel>Direction</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={sortDirection}
        onValueChange={(value) => onSortDirectionChange(value as SortDirection)}
      >
        <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  )
}

type QuickFiltersSectionProps = {
  needsAttentionEnabled: boolean
  updated30dEnabled: boolean
  onToggleFilter: (token: string) => void
}

export function QuickFiltersSection({
  needsAttentionEnabled,
  updated30dEnabled,
  onToggleFilter,
}: QuickFiltersSectionProps) {
  return (
    <>
      <DropdownMenuLabel>Quick filters</DropdownMenuLabel>
      <DropdownMenuCheckboxItem
        checked={needsAttentionEnabled}
        onCheckedChange={() => onToggleFilter(FILTER_SPECIAL_NEEDS_ATTENTION)}
      >
        Needs attention
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={updated30dEnabled}
        onCheckedChange={() => onToggleFilter(FILTER_SPECIAL_UPDATED_30_DAYS)}
      >
        Updated last 30 days
      </DropdownMenuCheckboxItem>
    </>
  )
}
