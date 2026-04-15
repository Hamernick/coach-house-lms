"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
        compact
          ? "border-b border-white/20"
          : "border-b border-white/30",
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
            "rounded-xl border-border/70 bg-background/95 pl-8 text-base text-foreground placeholder:text-muted-foreground",
            compact ? "h-10" : "h-11",
          )}
          placeholder="Search organizations, locations, or programs…"
          aria-label="Search public organizations"
        />
      </label>
    </div>
  )
}
