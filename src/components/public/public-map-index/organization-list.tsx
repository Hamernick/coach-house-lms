"use client"

import { memo, useMemo } from "react"

import {
  buildPlatformOrganizationMapItem,
  resolvePublicMapItemSelectableId,
  type PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { PublicMapPlatformOrganizationListCard } from "./organization-list-platform-card"
import { PublicMapResourceListCard } from "./organization-list-resource-card"
import {
  PUBLIC_MAP_LIST_INITIAL_PAGE_SIZE,
  PUBLIC_MAP_LIST_PAGE_SIZE,
  PublicMapOrganizationListPaginationFooter,
  usePublicMapOrganizationListPagination,
} from "./organization-list-pagination"
import { PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME } from "./sidebar-theme"

function buildPublicMapListItems({
  favoriteIds,
  items,
  organizations,
}: {
  favoriteIds: Set<string>
  items?: PublicMapItem[]
  organizations: PublicMapOrganization[]
}) {
  if (items) return items

  return organizations
    .map(buildPlatformOrganizationMapItem)
    .sort((left, right) => {
      const leftFavorite = favoriteIds.has(left.organization.id)
      const rightFavorite = favoriteIds.has(right.organization.id)
      if (leftFavorite === rightFavorite) return 0
      return leftFavorite ? -1 : 1
    })
}

function PublicMapOrganizationListComponent({
  favorites = [],
  items,
  organizations,
  selectedItemId,
  selectedOrgId,
  query,
  constrainedLayout = false,
  incrementalLoading = false,
  initialVisibleCount = PUBLIC_MAP_LIST_INITIAL_PAGE_SIZE,
  pageSize = PUBLIC_MAP_LIST_PAGE_SIZE,
  onSelectItem,
  onSelectOrg,
  onOpenDetails,
}: {
  favorites?: string[]
  items?: PublicMapItem[]
  organizations: PublicMapOrganization[]
  selectedItemId?: string | null
  selectedOrgId: string | null
  query?: string
  constrainedLayout?: boolean
  incrementalLoading?: boolean
  initialVisibleCount?: number
  pageSize?: number
  onSelectItem?: (id: string) => void
  onSelectOrg: (id: string) => void
  onOpenDetails?: (id: string) => void
}) {
  const favoriteIds = useMemo(() => new Set(favorites), [favorites])
  const listItems = useMemo(
    () => buildPublicMapListItems({ favoriteIds, items, organizations }),
    [favoriteIds, items, organizations]
  )
  const resolvedSelectedItemId = selectedItemId ?? selectedOrgId
  const {
    hasMoreOrganizations,
    loadMoreSentinelRef,
    loadNextPage,
    nextPageCount,
    paginationEnabled,
    visibleItems,
  } = usePublicMapOrganizationListPagination({
    getItemId: resolvePublicMapItemSelectableId,
    items: listItems,
    selectedItemId: resolvedSelectedItemId,
    query,
    incrementalLoading,
    initialVisibleCount,
    pageSize,
  })

  if (listItems.length === 0) {
    const hasSearchQuery = Boolean(query?.trim().length)
    return (
      <div
        className={cn(
          "flex flex-col gap-1 px-4 py-6 text-center",
          PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME
        )}
      >
        <p className="text-foreground text-sm font-medium">No resources yet</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {hasSearchQuery
            ? "No results matched your search."
            : "Public organizations and reviewed resources will appear here once they are ready. Map markers appear when a location is available."}
        </p>
      </div>
    )
  }

  return (
    <div
      data-public-map-organization-list-section="list-stack"
      className="flex w-full max-w-full min-w-0 flex-col gap-2"
    >
      {visibleItems.map((item) => {
        const selectableItemId = resolvePublicMapItemSelectableId(item)
        const selected = resolvedSelectedItemId === selectableItemId

        if (item.itemType === "external_resource") {
          return (
            <PublicMapResourceListCard
              key={item.id}
              item={item}
              selected={selected}
              constrainedLayout={constrainedLayout}
              onSelectItem={onSelectItem}
            />
          )
        }

        return (
          <PublicMapPlatformOrganizationListCard
            key={item.id}
            item={item}
            selected={selected}
            constrainedLayout={constrainedLayout}
            onSelectOrg={onSelectOrg}
            onOpenDetails={onOpenDetails}
          />
        )
      })}
      <PublicMapOrganizationListPaginationFooter
        hasMoreOrganizations={hasMoreOrganizations}
        loadMoreSentinelRef={loadMoreSentinelRef}
        loadNextPage={loadNextPage}
        nextPageCount={nextPageCount}
        organizationCount={listItems.length}
        paginationEnabled={paginationEnabled}
        visibleCount={visibleItems.length}
      />
    </div>
  )
}

export const PublicMapOrganizationList = memo(
  PublicMapOrganizationListComponent
)
