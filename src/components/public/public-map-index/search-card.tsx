"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"

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
  onHidePanel?: () => void
  activeGroup?: PublicMapGroupFilterKey
  groupCounts?: PublicMapGroupFilterCounts
  onActiveGroupChange?: (group: PublicMapGroupFilterKey) => void
  compact?: boolean
}

export function PublicMapSearchCard({
  query,
  onQueryChange,
  activeGroup = "all",
  groupCounts,
  onActiveGroupChange,
  compact = false,
}: PublicMapSearchCardProps) {
  const showCategoryFilter = Boolean(groupCounts && onActiveGroupChange)

  return (
    <div
      className={cn(
        "text-card-foreground flex flex-col gap-3 bg-transparent pt-0 pb-3",
        "border-border/60 border-b"
      )}
    >
      <label className="relative block">
        <SearchIcon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          className={cn(
            cn(
              "placeholder:text-muted-foreground rounded-xl pl-8 text-base",
              PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
            ),
            compact ? "h-10" : "h-11"
          )}
          placeholder="Find organizations and resources"
          aria-label="Find organizations and resources"
        />
      </label>
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
