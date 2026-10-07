"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"

import { HeaderActionsPortal } from "@/components/header-actions-portal"
import { Button } from "@/components/ui/button"

export function GlobalSearchTriggers({ onOpen }: { onOpen: () => void }) {
  return (
    <HeaderActionsPortal slot="search">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpen}
        data-tour="global-search-button"
        aria-label="Open search"
        aria-keyshortcuts="Meta+K Control+K"
        title="Search (⌘K / Ctrl+K)"
      >
        <SearchIcon className="h-4 w-4" aria-hidden />
      </Button>
    </HeaderActionsPortal>
  )
}
