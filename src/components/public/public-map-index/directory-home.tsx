"use client"

import { lazy, Suspense } from "react"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import { PublicMapNearbyCategoryGrid } from "./nearby-category-grid"
import type { PublicMapResourceItemsLoadStatus } from "./use-resource-map-items"
import type { PublicMapResourceGuideId } from "@/lib/public-map/resource-guide-ids"
import {
  PublicMapResourceGuides,
  type PublicMapResourceGuide,
} from "./resource-guides"
import type { PublicMapListItem } from "./map-items-state"

const PublicMapClaimDialog = lazy(() =>
  import("@/features/public-map-claims").then((module) => ({
    default: module.PublicMapClaimDialog,
  }))
)

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function buildClaimListingOptions(items: PublicMapListItem[]) {
  const options = items.flatMap((item) => {
    const id =
      item.itemType === "platform_organization"
        ? item.organization.id
        : item.resourceOrganizationId
    if (!id || !UUID_PATTERN.test(id)) return []
    return [
      {
        id,
        name: item.title,
        targetKind:
          item.itemType === "platform_organization"
            ? ("platform_organization" as const)
            : ("resource_map_organization" as const),
      },
    ]
  })
  return [
    ...new Map(
      options.map((option) => [`${option.targetKind}:${option.id}`, option])
    ).values(),
  ]
}

export function PublicMapDirectoryHome({
  counts,
  featuredGuides,
  items,
  onCategorySelect,
  onGuideSelect,
  onToggleSavedGuide,
  resourceItemsLoadStatus,
  savedGuideIds,
}: {
  counts: PublicMapGroupFilterCounts
  featuredGuides: PublicMapResourceGuide[]
  items: PublicMapListItem[]
  onCategorySelect: (category: PublicMapGroupFilterKey) => void
  onGuideSelect: (guideId: string) => void
  onToggleSavedGuide?: (guideId: PublicMapResourceGuideId) => void
  resourceItemsLoadStatus: PublicMapResourceItemsLoadStatus
  savedGuideIds: PublicMapResourceGuideId[]
}) {
  return (
    <div
      data-public-map-directory-home=""
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pt-1 pb-[max(env(safe-area-inset-bottom),1rem)] [-webkit-overflow-scrolling:touch]"
    >
      <section className="flex flex-col gap-3 pb-4">
        <h2 className="text-foreground px-0.5 text-xl font-semibold tracking-tight">
          Find Nearby
        </h2>
        <PublicMapNearbyCategoryGrid
          counts={counts}
          loading={resourceItemsLoadStatus === "loading"}
          onSelect={onCategorySelect}
        />
      </section>
      {featuredGuides.length > 0 ? (
        <div className="pb-5">
          <PublicMapResourceGuides
            guides={featuredGuides}
            onGuideSelect={onGuideSelect}
            onToggleSavedGuide={onToggleSavedGuide}
            presentation="featured"
            savedGuideIds={savedGuideIds}
          />
        </div>
      ) : null}
      <div className="pt-1">
        <Suspense fallback={<div className="h-[76px]" aria-hidden />}>
          <PublicMapClaimDialog
            listingOptions={buildClaimListingOptions(items)}
          />
        </Suspense>
      </div>
    </div>
  )
}
