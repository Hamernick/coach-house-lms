"use client"

import Filter from "lucide-react/dist/esm/icons/filter"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CategoryFiltersSection,
  SourceFiltersSection,
  StatusFiltersSection,
  VisibilityFiltersSection,
} from "./documents-toolbar-filter-sections"
import {
  QuickFiltersSection,
  SortSection,
} from "./documents-toolbar-sort-sections"
import type { DocumentsToolbarProps } from "./documents-toolbar-types"

type DocumentsToolbarFilterMenuProps = Pick<
  DocumentsToolbarProps,
  | "activeFilters"
  | "categoryOptions"
  | "hasRoadmapDocuments"
  | "needsAttentionEnabled"
  | "onSortColumnChange"
  | "onSortDirectionChange"
  | "onToggleFilter"
  | "sortColumn"
  | "sortDirection"
  | "updated30dEnabled"
>

export function DocumentsToolbarFilterMenu({
  activeFilters,
  hasRoadmapDocuments,
  categoryOptions,
  sortColumn,
  sortDirection,
  needsAttentionEnabled,
  updated30dEnabled,
  onToggleFilter,
  onSortColumnChange,
  onSortDirectionChange,
}: DocumentsToolbarFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-10">
          <Filter className="h-4 w-4" aria-hidden />
          Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <SourceFiltersSection
          activeFilters={activeFilters}
          hasRoadmapDocuments={hasRoadmapDocuments}
          onToggleFilter={onToggleFilter}
        />

        <DropdownMenuSeparator />
        <StatusFiltersSection
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
        />

        <DropdownMenuSeparator />
        <VisibilityFiltersSection
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
        />

        <DropdownMenuSeparator />
        <CategoryFiltersSection
          activeFilters={activeFilters}
          categoryOptions={categoryOptions}
          onToggleFilter={onToggleFilter}
        />

        <DropdownMenuSeparator />
        <SortSection
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortColumnChange={onSortColumnChange}
          onSortDirectionChange={onSortDirectionChange}
        />

        <DropdownMenuSeparator />
        <QuickFiltersSection
          needsAttentionEnabled={needsAttentionEnabled}
          updated30dEnabled={updated30dEnabled}
          onToggleFilter={onToggleFilter}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
