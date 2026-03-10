"use client"

import Plus from "lucide-react/dist/esm/icons/plus"
import Search from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SHOW_NEW_POLICY_BUTTON,
} from "../constants"
import { DocumentsToolbarFilterMenu } from "./documents-toolbar-filter-menu"
import type { DocumentsToolbarProps } from "./documents-toolbar-types"

export function DocumentsToolbar({
  searchQuery,
  activeFilters,
  hasRoadmapDocuments,
  categoryOptions,
  sortColumn,
  sortDirection,
  needsAttentionEnabled,
  updated30dEnabled,
  canEdit,
  editMode,
  onSearchQueryChange,
  onToggleFilter,
  onClearFilters,
  onSortColumnChange,
  onSortDirectionChange,
  onOpenNewPolicy,
}: DocumentsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search documents…"
          className="h-10 pl-9"
          aria-label="Search documents"
          data-tour="documents-search"
        />
      </div>

      <DocumentsToolbarFilterMenu
        activeFilters={activeFilters}
        hasRoadmapDocuments={hasRoadmapDocuments}
        categoryOptions={categoryOptions}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        needsAttentionEnabled={needsAttentionEnabled}
        updated30dEnabled={updated30dEnabled}
        onToggleFilter={onToggleFilter}
        onSortColumnChange={onSortColumnChange}
        onSortDirectionChange={onSortDirectionChange}
      />

      {activeFilters.length > 0 || searchQuery.trim().length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10"
          onClick={onClearFilters}
        >
          Reset
        </Button>
      ) : null}

      {SHOW_NEW_POLICY_BUTTON && canEdit && editMode ? (
        <Button type="button" size="sm" className="h-10" onClick={onOpenNewPolicy}>
          <Plus className="h-4 w-4" aria-hidden />
          New policy
        </Button>
      ) : null}
    </div>
  )
}
