"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type PublicMapSearchCardProps = {
  query: string
  onQueryChange: (value: string) => void
  onHidePanel?: () => void
}

export function PublicMapSearchCard({
  query,
  onQueryChange,
  onHidePanel,
}: PublicMapSearchCardProps) {
  return (
    <div className="space-y-3 border-b border-white/30 bg-transparent px-3 pb-3 pt-3 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[23px] font-semibold leading-tight tracking-tight">Resource map</p>
        {onHidePanel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onHidePanel}
            className="h-8 w-8 rounded-full border border-white/35 bg-background/48 text-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 hover:bg-background/62"
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
          className="h-11 rounded-xl border-border/70 bg-background/95 pl-8 text-base text-foreground placeholder:text-muted-foreground"
          placeholder="Search organizations, locations, or programs…"
          aria-label="Search public organizations"
        />
      </label>
    </div>
  )
}
