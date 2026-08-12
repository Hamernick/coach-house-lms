import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

import type { FindResourceIndexItem } from "../types"

export const FIND_RESOURCE_INDEX_VERSION = 1 as const
export const FIND_RESOURCE_INDEX_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=600"

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
