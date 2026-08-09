"use client"

import { useId, useRef } from "react"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  PublicMapCategoryFilter,
  type PublicMapGroupFilterCounts,
  type PublicMapGroupFilterKey,
} from "./category-filter"
import { PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME } from "./sidebar-theme"

export type PublicMapSearchCardProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchEngage?: () => void
  onHidePanel?: () => void
  activeGroup?: PublicMapGroupFilterKey
  groupCounts?: PublicMapGroupFilterCounts
  onActiveGroupChange?: (group: PublicMapGroupFilterKey) => void
  compact?: boolean
  searchPending?: boolean
}

export function PublicMapSearchCard({
  query,
  onQueryChange,
  onSearchEngage,
  activeGroup = "all",
  groupCounts,
  onActiveGroupChange,
  compact = false,
  searchPending = false,
}: PublicMapSearchCardProps) {
  const showCategoryFilter = Boolean(groupCounts && onActiveGroupChange)
  const searchInputId = useId()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div
      className={cn(
        "text-card-foreground flex flex-col gap-3 bg-transparent pt-0 pb-3",
        "border-border/60 border-b"
      )}
    >
      <div className="relative mx-auto w-full max-w-xl">
        <label htmlFor={searchInputId} className="sr-only">
          Find organizations and resources
        </label>
        <SearchIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={searchInputRef}
          id={searchInputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          onFocus={onSearchEngage}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !query) return
            event.preventDefault()
            onQueryChange("")
          }}
          className={cn(
            cn(
              "placeholder:text-muted-foreground rounded-full pl-8 text-base [&::-webkit-search-cancel-button]:appearance-none",
              PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
            ),
            compact ? "h-10" : "h-11",
            query && "pr-10"
          )}
          placeholder="Find organizations and resources"
          aria-label="Find organizations and resources"
          aria-busy={searchPending}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-8 -translate-y-1/2 rounded-full"
            aria-label="Clear search"
            onClick={() => {
              onQueryChange("")
              searchInputRef.current?.focus()
            }}
          >
            <XIcon aria-hidden />
          </Button>
        ) : null}
      </div>
      {showCategoryFilter && groupCounts && onActiveGroupChange ? (
        <PublicMapCategoryFilter
          activeGroup={activeGroup}
          counts={groupCounts}
          compact={compact}
          onActiveGroupChange={onActiveGroupChange}
        />
      ) : null}
    </div>
  )
}
