import { NextResponse } from "next/server"

import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { isPublicMapTechnicalSourceUrl } from "@/lib/public-map/resource-link-visibility"
import { fetchPublicResourceMapItems } from "@/lib/queries/resource-map-public-items"

export const revalidate = 300

const PUBLIC_RESOURCE_MAP_ITEMS_CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=600"

function serializePublicResourceAvailability(
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

function serializePublicResourceServices(
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

export function serializePublicResourceMapItem(
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
  const publicAvailability = serializePublicResourceAvailability(availability)
  const publicServices = serializePublicResourceServices(
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

export async function GET() {
  const resourceItems = await fetchPublicResourceMapItems()

  return NextResponse.json(
    {
      resourceItems: resourceItems.map(serializePublicResourceMapItem),
    },
    {
      headers: {
        "Cache-Control": PUBLIC_RESOURCE_MAP_ITEMS_CACHE_CONTROL,
      },
    }
  )
}
