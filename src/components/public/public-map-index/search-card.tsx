"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
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
  onHidePanel,
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
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "font-semibold leading-tight tracking-tight",
            compact ? "text-[20px] sm:text-[21px]" : "text-[23px]",
          )}
        >
          Resource map
        </p>
        {onHidePanel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onHidePanel}
            className={cn(
              "rounded-full text-foreground shadow-sm backdrop-blur-xl",
              compact
                ? "h-9 w-9 border border-white/25 bg-background/72 supports-[backdrop-filter]:bg-background/64 hover:bg-background/80"
                : "h-8 w-8 border border-white/35 bg-background/48 supports-[backdrop-filter]:bg-background/40 hover:bg-background/62",
            )}
            aria-label="Hide search panel"
          >
            <XIcon className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
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
