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

const PublicMapClaimDialog = lazy(() =>
  import("@/features/public-map-claims").then((module) => ({
    default: module.PublicMapClaimDialog,
  }))
)

export function PublicMapDirectoryHome({
  counts,
  featuredGuides,
  onCategorySelect,
  onGuideSelect,
  onToggleSavedGuide,
  resourceItemsLoadStatus,
  savedGuideIds,
}: {
  counts: PublicMapGroupFilterCounts
  featuredGuides: PublicMapResourceGuide[]
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
          <PublicMapClaimDialog />
        </Suspense>
      </div>
    </div>
  )
}
