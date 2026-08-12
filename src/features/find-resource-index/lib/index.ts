import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

import type { FindResourceIndexItem, FindResourceIndexResponse } from "../types"

export const FIND_RESOURCE_INDEX_VERSION = 2 as const
export const FIND_RESOURCE_INDEX_DEFAULT_PAGE_LIMIT = 200
export const FIND_RESOURCE_INDEX_MAX_PAGE_LIMIT = 500
export const FIND_RESOURCE_INDEX_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=600"

export function parseFindResourceIndexLimit(value: string | null) {
  if (value === null) return FIND_RESOURCE_INDEX_DEFAULT_PAGE_LIMIT
  if (!/^\d+$/.test(value)) return null

  const limit = Number(value)
  if (limit < 1 || limit > FIND_RESOURCE_INDEX_MAX_PAGE_LIMIT) return null
  return limit
}

export function paginateFindResourceIndexItems({
  cursor,
  items,
  limit,
}: {
  cursor: string | null
  items: FindResourceIndexItem[]
  limit: number
}): FindResourceIndexResponse {
  const orderedItems = [...items].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  )
  const startIndex = cursor
    ? orderedItems.findIndex((item) => item.id > cursor)
    : 0
  const remainingItems =
    startIndex === -1
      ? []
      : orderedItems.slice(startIndex, startIndex + limit + 1)
  const hasMore = remainingItems.length > limit
  const resourceItems = remainingItems.slice(0, limit)

  return {
    version: FIND_RESOURCE_INDEX_VERSION,
    resourceItems,
    page: {
      hasMore,
      limit,
      nextCursor: hasMore ? (resourceItems.at(-1)?.id ?? null) : null,
      totalCount: orderedItems.length,
    },
  }
}

export function serializeFindResourceIndexItem(
  item: ExternalResourceMapItem
): FindResourceIndexItem {
  const availability =
    item.availability && item.availability.status !== "unknown"
      ? {
          status: item.availability.status,
          statusLabel: item.availability.statusLabel,
          openNow: item.availability.openNow,
        }
      : undefined

  return {
    id: item.id,
    itemType: "external_resource",
    title: item.title,
    subtitle: item.subtitle,
    latitude: item.latitude,
    longitude: item.longitude,
    city: item.city,
    state: item.state,
    country: item.country,
    resourceCategories: item.resourceCategories,
    primaryResourceCategory: item.primaryResourceCategory,
    verificationStatus: item.verificationStatus,
    visibility: item.visibility,
    ...(item.markerImageUrl ? { markerImageUrl: item.markerImageUrl } : null),
    ...(availability ? { availability } : null),
  }
}
