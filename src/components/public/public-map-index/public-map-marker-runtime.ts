import type mapboxgl from "mapbox-gl"

import { parsePublicMapOrganizationIds } from "@/lib/public-map/public-map-geojson"
import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-same-location"

export type PublicMapMarkerClickAction =
  | {
      type: "organization"
      organizationId: string
    }
  | {
      type: "same-location"
      group: PublicMapSameLocationSelection
    }

function resolveString(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function resolveCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function resolvePublicMapMarkerClickAction(
  properties: Record<string, unknown>
): PublicMapMarkerClickAction | null {
  const organizationId = resolveString(properties.organizationId)
  if (!organizationId) return null

  const organizationIds = parsePublicMapOrganizationIds(
    properties.organizationIds
  )
  const sameLocationCount = resolveCount(properties.sameLocationCount)
  const sameLocationKey = resolveString(properties.sameLocationKey)
  const sameLocationLabel = resolveString(properties.sameLocationLabel)

  if (sameLocationCount > 1 && organizationIds.length > 1 && sameLocationKey) {
    return {
      type: "same-location",
      group: {
        key: sameLocationKey,
        organizationIds,
        locationLabel: sameLocationLabel,
      },
    }
  }

  return {
    type: "organization",
    organizationId,
  }
}

export function bindPublicMapMarkerPointerCursor({
  layerIds,
  map,
}: {
  layerIds: readonly string[]
  map: mapboxgl.Map
}) {
  const enable = () => {
    map.getCanvas().style.cursor = "pointer"
  }
  const disable = () => {
    map.getCanvas().style.cursor = ""
  }

  for (const layerId of layerIds) {
    map.on("mouseenter", layerId, enable)
    map.on("mouseleave", layerId, disable)
  }

  return () => {
    for (const layerId of layerIds) {
      map.off("mouseenter", layerId, enable)
      map.off("mouseleave", layerId, disable)
    }
  }
}
