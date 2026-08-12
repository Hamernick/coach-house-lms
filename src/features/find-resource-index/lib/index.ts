import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { isPublicMapTechnicalSourceUrl } from "@/lib/public-map/resource-link-visibility"

import type { FindResourceIndexItem, FindResourceIndexResponse } from "../types"

export const FIND_RESOURCE_INDEX_VERSION = 2 as const
export const FIND_RESOURCE_INDEX_DEFAULT_PAGE_LIMIT = 200
export const FIND_RESOURCE_INDEX_MAX_PAGE_LIMIT = 500
export const FIND_RESOURCE_INDEX_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=600"
const FIND_RESOURCE_INDEX_CURSOR_PATTERN =
  /^(?:resource_map:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|local_resource_map:.+)$/i

export function parseFindResourceIndexLimit(value: string | null) {
  if (value === null) return FIND_RESOURCE_INDEX_DEFAULT_PAGE_LIMIT
  if (!/^\d+$/.test(value)) return null

  const limit = Number(value)
  if (limit < 1 || limit > FIND_RESOURCE_INDEX_MAX_PAGE_LIMIT) return null
  return limit
}

export function parseFindResourceIndexCursor(value: string | null) {
  if (value === null || value.trim() === "") return null
  const cursor = value.trim()
  return cursor.length <= 256 && FIND_RESOURCE_INDEX_CURSOR_PATTERN.test(cursor)
    ? cursor
    : undefined
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

function serializeFindResourceDetailAvailability(
  availability: ExternalResourceMapItem["availability"]
) {
  if (!availability) return undefined
  if (availability.status === "unknown" && !availability.notes) {
    return undefined
  }
  if (availability.status === "unknown") {
    return {
      notes: availability.notes,
      status: availability.status,
      statusLabel: availability.statusLabel,
    } as ExternalResourceMapItem["availability"]
  }

  return availability
}

function serializeFindResourceDetailServices(
  services: ExternalResourceMapItem["services"],
  itemDescription: string | null
) {
  return (services ?? []).flatMap((service) => {
    const description =
      service.description === itemDescription ? null : service.description
    const hasUsefulDetails = Boolean(
      description ||
      service.whoItHelps ||
      service.eligibility ||
      service.cost ||
      service.languages?.length ||
      service.intakeUrl ||
      service.appointmentInfo ||
      service.documentsNeeded?.length ||
      service.accessibilityNotes ||
      service.urgentAvailability ||
      service.ageRange ||
      service.serviceArea?.length
    )
    if (!hasUsefulDetails) return []

    return [{ ...service, description }]
  })
}

export function serializeFindResourceDetailItem(
  item: ExternalResourceMapItem
): ExternalResourceMapItem {
  const {
    aliases,
    availability,
    deliveryModes,
    faviconUrl,
    logoUrl,
    markerImageUrl,
    mission,
    services,
    sourceUrl,
    values,
    vision,
    ...rest
  } = item
  const publicAvailability =
    serializeFindResourceDetailAvailability(availability)
  const publicServices = serializeFindResourceDetailServices(
    services,
    rest.description
  )
  const publicSourceUrl =
    sourceUrl && isPublicMapTechnicalSourceUrl(sourceUrl) ? null : sourceUrl

  return {
    ...rest,
    ...(aliases?.length ? { aliases } : null),
    ...(publicAvailability ? { availability: publicAvailability } : null),
    ...(deliveryModes?.length ? { deliveryModes } : null),
    ...(markerImageUrl ? { markerImageUrl } : null),
    ...(publicServices.length ? { services: publicServices } : null),
    sourceUrl: publicSourceUrl,
  }
}

export function resolveFindResourceDetailItem(
  items: ExternalResourceMapItem[],
  id: string
) {
  const matched = items.find((item) => item.id === id)
  return matched ? serializeFindResourceDetailItem(matched) : null
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
