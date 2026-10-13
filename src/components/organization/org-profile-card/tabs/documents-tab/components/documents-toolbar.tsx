"use client"

import Plus from "lucide-react/dist/esm/icons/plus"
import Search from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SHOW_NEW_POLICY_BUTTON } from "../constants"
import { DocumentsToolbarFilterMenu } from "./documents-toolbar-filter-menu"
import type { DocumentsToolbarProps } from "./documents-toolbar-types"

const DOCUMENTS_LIBRARY_SEARCH_WRAPPER_CLASSNAME =
  "relative min-w-[17rem] flex-1 sm:max-w-[26rem]"
const DOCUMENTS_LIBRARY_SEARCH_ICON_CLASSNAME =
  "pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground/80"
const DOCUMENTS_LIBRARY_SEARCH_INPUT_CLASSNAME =
  "h-11 rounded-full border-border/70 bg-muted/70 pl-11 pr-4 text-[15px] shadow-none placeholder:text-muted-foreground/80 transition-[border-color,background-color,box-shadow] hover:bg-muted/80 focus-visible:border-border focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/30 dark:border-white/12 dark:bg-white/10 dark:text-foreground dark:placeholder:text-white/50 dark:hover:bg-white/12 dark:focus-visible:border-white/24 dark:focus-visible:bg-white/12"

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
      <div className={DOCUMENTS_LIBRARY_SEARCH_WRAPPER_CLASSNAME}>
        <Search className={DOCUMENTS_LIBRARY_SEARCH_ICON_CLASSNAME} />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search documents…"
          className={DOCUMENTS_LIBRARY_SEARCH_INPUT_CLASSNAME}
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
        <Button
          type="button"
          size="sm"
          className="h-10"
          onClick={onOpenNewPolicy}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New policy
        </Button>
      ) : null}
    </div>
  )
}
