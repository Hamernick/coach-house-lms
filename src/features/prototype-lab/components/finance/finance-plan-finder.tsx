"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  searchFinancePlanNodes,
  type FinancePlanSearchEntry,
} from "./finance-plan-search"

export function FinancePlanFinder({
  onSelect,
}: {
  onSelect: (entry: FinancePlanSearchEntry) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const results = useMemo(() => searchFinancePlanNodes(query), [query])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setQuery("")
  }

  return (
    <>
      <Button
        className="min-h-11 rounded-full px-3 text-xs"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <SearchIcon aria-hidden="true" className="size-4" />
        Find step…
      </Button>

      <CommandDialog
        className="w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl"
        description="Search every Finance planning view and jump to an exact node."
        onOpenChange={handleOpenChange}
        open={open}
        title="Find a Finance plan step"
      >
        <CommandInput
          className="text-base sm:text-sm"
          onValueChange={setQuery}
          placeholder="Search finance records, weather, onboarding…"
          value={query}
        />
        <CommandList className="max-h-[min(24rem,calc(100dvh-10rem))]">
          <CommandEmpty>
            No matching plan step. Try a feature, system, or release batch.
          </CommandEmpty>
          <CommandGroup
            heading={query.trim() ? "Matching steps" : "Start points"}
          >
            {results.map((entry) => (
              <CommandItem
                className="items-start gap-3 px-3 py-3"
                key={`${entry.viewId}:${entry.nodeId}`}
                onSelect={() => {
                  onSelect(entry)
                  handleOpenChange(false)
                }}
                value={`${entry.nodeId} ${entry.searchValue}`}
              >
                <SearchIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{entry.title}</span>
                    <Badge className="shrink-0 rounded-full" variant="outline">
                      {entry.viewLabel}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5 text-pretty">
                    {entry.summary}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
