"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"
import {
  buildPublicMapItems,
  type ExternalResourceMapItem,
  type PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { PublicMapGroupFilterKey } from "./category-filter"
import type { SidebarMode } from "./constants"
import { usePublicMapListItems } from "./map-items-state"
import {
  buildPublicMapResourceGuides,
  type PublicMapResourceGuide,
} from "./resource-guide-model"

export {
  buildPublicMapResourceGuides,
  type PublicMapResourceGuide,
} from "./resource-guide-model"

export type PublicMapResourceGuideSearchContext = {
  title: string
  description?: string | null
  items: PublicMapItem[]
  onClear: () => void
}

export function usePublicMapResourceGuideState({
  activeGroup,
  deferredQuery,
  filteredMapItems,
  filteredOrganizations,
  includeSeedResources,
  resourceItems,
  setSameLocationSelection,
  setSelectedListItemId,
  setSelectedOrgId,
  setSidebarMode,
}: {
  activeGroup: PublicMapGroupFilterKey
  deferredQuery: string
  filteredMapItems: PublicMapItem[]
  filteredOrganizations: PublicMapOrganization[]
  includeSeedResources: boolean
  resourceItems: ExternalResourceMapItem[]
  setSameLocationSelection: (
    selection: PublicMapSameLocationSelection | null
  ) => void
  setSelectedListItemId: (itemId: string | null) => void
  setSelectedOrgId: (organizationId: string | null) => void
  setSidebarMode: (mode: SidebarMode) => void
}) {
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null)

  useEffect(() => {
    setActiveGuideId(null)
  }, [activeGroup, deferredQuery])

  const guideSourceMapItems = useMemo(
    () =>
      buildPublicMapItems({
        organizations: filteredOrganizations,
        includeSeedItems: includeSeedResources,
        resourceItems,
      }),
    [filteredOrganizations, includeSeedResources, resourceItems]
  )
  const resourceGuides = useMemo(
    () => buildPublicMapResourceGuides(guideSourceMapItems),
    [guideSourceMapItems]
  )
  const activeGuide = useMemo<PublicMapResourceGuide | null>(
    () => resourceGuides.find((guide) => guide.id === activeGuideId) ?? null,
    [activeGuideId, resourceGuides]
  )
  const visibleMapItems = activeGuide?.items ?? filteredMapItems
  const filteredListItems = usePublicMapListItems({
    items: visibleMapItems,
    query: activeGuide ? "" : deferredQuery,
  })
  const clearActiveGuide = useCallback(() => {
    setActiveGuideId(null)
    setSelectedListItemId(null)
  }, [setActiveGuideId, setSelectedListItemId])
  const activeGuideSearchContext =
    useMemo<PublicMapResourceGuideSearchContext | null>(
      () =>
        activeGuide
          ? {
              title: activeGuide.title,
              description: `${activeGuide.itemCount.toLocaleString()} places from the current resource map data.`,
              items: activeGuide.items,
              onClear: clearActiveGuide,
            }
          : null,
      [activeGuide, clearActiveGuide]
    )
  const handleGuideSelect = useCallback(
    (guideId: string) => {
      if (!resourceGuides.some((guide) => guide.id === guideId)) return
      setSameLocationSelection(null)
      setSelectedOrgId(null)
      setSelectedListItemId(null)
      setActiveGuideId(guideId)
      setSidebarMode("search")
    },
    [
      resourceGuides,
      setActiveGuideId,
      setSameLocationSelection,
      setSelectedListItemId,
      setSelectedOrgId,
      setSidebarMode,
    ]
  )

  return {
    activeGuideSearchContext,
    clearActiveGuide,
    filteredListItems,
    handleGuideSelect,
    resourceGuides,
    visibleMapItems,
  }
}

const PUBLIC_MAP_RESOURCE_GUIDE_CARD_CLASSNAME =
  "group relative aspect-[0.82] h-auto min-w-0 items-stretch justify-start overflow-hidden rounded-xl border border-input bg-input/30 p-0 text-left whitespace-normal text-foreground shadow-sm backdrop-blur transition-[background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-input hover:bg-input/50 hover:text-foreground hover:shadow-sm focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none dark:border-input dark:bg-input/30 dark:hover:bg-input/50"

function PublicMapResourceGuidesHeader({ guideCount }: { guideCount: number }) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        <p className="text-foreground text-base leading-none font-semibold">
          Guides
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Cooling centers and heat relief groups
        </p>
      </div>
      <p className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
        {guideCount.toLocaleString()}
      </p>
    </div>
  )
}

export function PublicMapResourceGuides({
  guides,
  onGuideSelect,
  showHeader = true,
}: {
  guides: PublicMapResourceGuide[]
  onGuideSelect: (guideId: string) => void
  showHeader?: boolean
}) {
  if (guides.length === 0) return null

  return (
    <section
      data-public-map-sidebar-section="resource-guides"
      className="flex min-w-0 flex-col gap-2"
      aria-label="Resource guides"
    >
      {showHeader ? (
        <PublicMapResourceGuidesHeader guideCount={guides.length} />
      ) : null}
      <div className="grid min-w-0 grid-cols-2 gap-2">
        {guides.map((guide) => (
          <Button
            key={guide.id}
            type="button"
            variant="ghost"
            className={PUBLIC_MAP_RESOURCE_GUIDE_CARD_CLASSNAME}
            onClick={() => onGuideSelect(guide.id)}
          >
            {guide.imageUrl ? (
              <>
                <span
                  className="absolute inset-0 bg-cover bg-center"
                  style={
                    {
                      backgroundImage: `url(${guide.imageUrl})`,
                    } satisfies CSSProperties
                  }
                  aria-hidden
                />
                <span
                  className="bg-background/60 absolute inset-0"
                  aria-hidden
                />
              </>
            ) : null}
            <span className="relative flex h-full min-w-0 flex-col justify-end p-3">
              <span className="min-w-0">
                <span className="text-muted-foreground block text-[10px] leading-none font-semibold tracking-normal">
                  {guide.kicker}
                </span>
                <span className="text-foreground mt-1.5 line-clamp-3 block text-[18px] leading-[1.05] font-bold">
                  {guide.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-[11px] leading-tight font-medium">
                  {guide.itemCount.toLocaleString()} places
                </span>
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  )
}

export function PublicMapGuidesRail({
  guides,
  onGuideSelect,
}: {
  guides: PublicMapResourceGuide[]
  onGuideSelect: (guideId: string) => void
}) {
  return (
    <div
      data-public-map-member-rail-section="guides-panel"
      className="flex h-full min-h-0 flex-col gap-2 overflow-hidden"
    >
      <div
        data-public-map-member-rail-section="guides-header"
        className="shrink-0"
      >
        <PublicMapResourceGuidesHeader guideCount={guides.length} />
      </div>
      <ScrollArea
        data-public-map-member-rail-section="guides-scroll"
        className="h-full min-h-0 flex-1 overflow-hidden pr-2"
        viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
        contentClassName="pb-2"
      >
        <PublicMapResourceGuides
          guides={guides}
          onGuideSelect={onGuideSelect}
          showHeader={false}
        />
      </ScrollArea>
    </div>
  )
}
