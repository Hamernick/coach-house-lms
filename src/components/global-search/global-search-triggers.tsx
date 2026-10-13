"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"

import { HeaderActionsPortal } from "@/components/header-actions-portal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type GlobalSearchTriggersProps = {
  showCompact: boolean
  showCenterCompact: boolean
  onOpen: () => void
}

export function GlobalSearchTriggers({
  showCompact,
  showCenterCompact,
  onOpen,
}: GlobalSearchTriggersProps) {
  return (
    <>
      {!showCompact ? (
        <HeaderActionsPortal slot="center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpen}
            data-tour="global-search-button"
            className={cn(
              "hidden min-w-[240px] w-full max-w-[520px] items-center justify-between gap-2 pl-3 pr-3 text-xs text-muted-foreground md:inline-flex lg:max-w-[600px]",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate text-foreground">Search</span>
            </span>
            <span className="shrink-0 whitespace-nowrap rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              CMD+K
            </span>
          </Button>
        </HeaderActionsPortal>
      ) : showCenterCompact ? (
        <HeaderActionsPortal slot="center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpen}
            data-tour="global-search-button"
            className="hidden md:inline-flex"
            aria-label="Open search"
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        </HeaderActionsPortal>
      ) : null}
      <HeaderActionsPortal slot="right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpen}
          data-tour="global-search-button"
          className="inline-flex md:hidden"
          aria-label="Open search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
      </HeaderActionsPortal>
    </>
  )
}
