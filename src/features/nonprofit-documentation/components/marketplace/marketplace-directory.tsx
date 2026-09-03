"use client"

import { useEffect, useMemo, useState } from "react"
import SearchXIcon from "lucide-react/dist/esm/icons/search-x"

import { Empty } from "@/components/ui/empty"

import { useMarketplaceShortlist } from "../../hooks/use-marketplace-shortlist"
import {
  DEFAULT_MARKETPLACE_FILTERS,
  MARKETPLACE_RESOURCES,
  filterMarketplaceResources,
} from "../../lib/marketplace-directory"
import type { MarketplaceFilters } from "../../marketplace-types"
import { MarketplaceFiltersPanel } from "./marketplace-filters"
import { MarketplaceResourceCard } from "./marketplace-resource-card"
import { MarketplaceShortlist } from "./marketplace-shortlist"

function syncFilterUrl(filters: MarketplaceFilters) {
  const url = new URL(window.location.href)
  const values: Array<[string, string]> = [
    ["q", filters.query],
    ["type", filters.type],
    ["function", filters.function],
    ["stage", filters.stage],
    ["cost", filters.cost],
  ]
  for (const [key, value] of values) {
    if (!value || value === "all") url.searchParams.delete(key)
    else url.searchParams.set(key, value)
  }
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`
  )
}

export function MarketplaceDirectory({
  initialFilters = DEFAULT_MARKETPLACE_FILTERS,
}: {
  initialFilters?: MarketplaceFilters
}) {
  const [filters, setFilters] = useState(initialFilters)
  const shortlist = useMarketplaceShortlist()
  const resources = useMemo(
    () => filterMarketplaceResources(MARKETPLACE_RESOURCES, filters),
    [filters]
  )

  useEffect(() => syncFilterUrl(filters), [filters])

  return (
    <section
      id="directory"
      className="scroll-mt-8 py-12"
      aria-labelledby="directory-title"
    >
      <div className="grid gap-8 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.48fr)] lg:items-end">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
            Interactive directory
          </p>
          <h2
            id="directory-title"
            className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-balance"
          >
            Start with the need, then verify the offer.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
            Filter a small, source-backed catalog. Inclusion is not an
            endorsement, ranking, procurement decision, or guarantee of
            eligibility, availability, safety, accessibility, or final cost.
          </p>
        </div>
        <p className="text-muted-foreground text-sm leading-6 lg:text-right">
          Every listing links to an official page and shows when Coach House
          last reviewed it. Recheck terms with the provider before acting.
        </p>
      </div>

      <div className="grid gap-8 py-8">
        <MarketplaceFiltersPanel filters={filters} onChange={setFilters} />
        <MarketplaceShortlist
          resources={shortlist.resources}
          ready={shortlist.ready}
          onClear={shortlist.clear}
          onDownload={shortlist.download}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-y py-4">
        <p
          className="text-sm font-medium"
          aria-live="polite"
          data-marketplace-results-count
        >
          {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </p>
        <p className="text-muted-foreground text-xs">Reviewed 2026-09-03</p>
      </div>

      {resources.length > 0 ? (
        <div className="bg-border grid gap-px py-px sm:mt-6 sm:grid-cols-2 sm:gap-4 sm:bg-transparent sm:py-0 xl:grid-cols-3">
          {resources.map((resource) => (
            <MarketplaceResourceCard
              key={resource.id}
              resource={resource}
              selected={shortlist.ids.includes(resource.id)}
              onToggle={shortlist.toggle}
            />
          ))}
        </div>
      ) : (
        <Empty
          className="mt-6 min-h-72"
          icon={<SearchXIcon className="size-5" aria-hidden />}
          title="No resources match these filters"
          description="Clear a filter or search for a broader need. The directory intentionally does not invent fallback results."
        />
      )}
    </section>
  )
}
