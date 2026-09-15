"use client"

import SearchIcon from "lucide-react/dist/esm/icons/search"
import XIcon from "lucide-react/dist/esm/icons/x"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DEFAULT_MARKETPLACE_FILTERS,
  MARKETPLACE_RESOURCE_TYPES,
} from "../../lib/marketplace-directory"
import type { MarketplaceFilters } from "../../marketplace-types"
import {
  MARKETPLACE_FILTER_GROUPS,
  MarketplaceFilterMenu,
} from "./marketplace-filter-menu"

export function MarketplaceFiltersPanel({
  filters,
  onChange,
}: {
  filters: MarketplaceFilters
  onChange: (filters: MarketplaceFilters) => void
}) {
  const activeFilters = MARKETPLACE_FILTER_GROUPS.flatMap((group) => {
    const option = group.options.find(
      (option) => option.value === filters[group.key]
    )
    return option ? [{ key: group.key, label: option.label }] : []
  })
  const hasFilters = Boolean(filters.query || activeFilters.length)

  return (
    <div className="grid gap-4" aria-label="Marketplace filters">
      <div className="bg-muted/20 focus-within:border-ring focus-within:ring-ring/20 max-w-3xl rounded-2xl border p-1.5 focus-within:ring-2">
        <InputGroup className="items-center gap-1">
          <InputGroupAddon className="text-muted-foreground pl-2">
            <SearchIcon className="size-5" aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            id="marketplace-search"
            aria-label="Search resources"
            type="search"
            value={filters.query}
            maxLength={100}
            autoComplete="off"
            placeholder="Search tools, offers, and resources…"
            className="min-w-0 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
          />
          <InputGroupAddon>
            <MarketplaceFilterMenu filters={filters} onChange={onChange} />
          </InputGroupAddon>
        </InputGroup>
        {hasFilters && (
          <div
            className="flex flex-wrap items-center gap-2 px-2 pt-1 pb-1"
            aria-label="Active filters"
          >
            {activeFilters.map((filter) => (
              <Button
                key={filter.key}
                type="button"
                variant="secondary"
                className="max-w-full rounded-lg px-2 text-xs"
                aria-label={`Remove ${filter.label} filter`}
                onClick={() => onChange({ ...filters, [filter.key]: "all" })}
              >
                <span className="truncate">{filter.label}</span>
                <XIcon data-icon="inline-end" aria-hidden />
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground rounded-lg px-2 text-xs"
              onClick={() => onChange(DEFAULT_MARKETPLACE_FILTERS)}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
      <ToggleGroup
        type="single"
        value={filters.type}
        onValueChange={(value) =>
          onChange({
            ...filters,
            type: (value || "all") as MarketplaceFilters["type"],
          })
        }
        aria-label="Resource categories"
        spacing={2}
        className="max-w-full flex-wrap justify-start"
      >
        {[
          { value: "all", label: "All resources" },
          ...MARKETPLACE_RESOURCE_TYPES,
        ].map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="bg-muted/60 data-[state=on]:bg-primary/10 data-[state=on]:text-primary h-11 rounded-xl px-3 text-xs font-medium md:h-9"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
