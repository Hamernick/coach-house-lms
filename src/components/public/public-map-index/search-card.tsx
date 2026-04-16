"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME } from "./sidebar-theme"

export type PublicMapSearchCardProps = {
  query: string
  onQueryChange: (value: string) => void
  onHidePanel?: () => void
  compact?: boolean
}

export function PublicMapSearchCard({
  query,
  onQueryChange,
  compact = false,
}: PublicMapSearchCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 bg-transparent pb-3 pt-3 text-card-foreground",
        "border-b border-border/60",
      )}
    >
      <div className="flex items-center gap-2">
        <p
          className={cn(
            "font-semibold leading-tight tracking-tight",
            compact ? "text-[20px] sm:text-[21px]" : "text-[23px]",
          )}
        >
          Resource map
        </p>
      </div>

      <label className="relative block">
        <SearchIcon
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          className={cn(
            cn("rounded-xl pl-8 text-base placeholder:text-muted-foreground", PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME),
            compact ? "h-10" : "h-11",
          )}
          placeholder="Search organizations, locations, or programs…"
          aria-label="Search public organizations"
        />
      </label>
    </div>
  )
}
