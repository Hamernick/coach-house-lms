import type mapboxgl from "mapbox-gl"

import {
  normalizeCoordinatesForMap,
  resolveFeatureCoordinatesForMap,
} from "./map-coordinate-normalization"
import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
} from "./map-view-helpers"
import { getMapSourceSafely, isMapStyleAccessError } from "./map-style-guards"
import { parsePublicMapOrganizationIds } from "@/lib/public-map/public-map-layer-api"
import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"

export const PUBLIC_MAP_INTERACTIVE_LAYER_IDS = [
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
] as const

export function resolveClusterId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function resolvePointCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function resolveOrganizationId(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : null
  }
  return null
}

export type PublicMapPointClickAction =
  | {
      type: "organization"
      organizationId: string
    }
  | {
      type: "same-location"
      group: PublicMapSameLocationSelection
    }

export function resolvePublicMapPointClickAction(
  properties: Record<string, unknown>,
): PublicMapPointClickAction | null {
  const organizationId = resolveOrganizationId(properties.organizationId)
  if (!organizationId) return null

  const organizationIds = parsePublicMapOrganizationIds(properties.organizationIds)
  const sameLocationCount = resolvePointCount(properties.sameLocationCount)
  const sameLocationKey =
    typeof properties.sameLocationKey === "string" ? properties.sameLocationKey : ""
  const sameLocationLabel =
    typeof properties.sameLocationLabel === "string" ? properties.sameLocationLabel : null

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

export function bindPublicMapPointerCursor(
  map: mapboxgl.Map,
  layerIds: readonly string[] = PUBLIC_MAP_INTERACTIVE_LAYER_IDS,
) {
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

export function isClusterFeature(properties: Record<string, unknown>) {
  return (
    properties.cluster === true ||
    properties.cluster === 1 ||
    properties.cluster === "1" ||
    properties.cluster === "true"
  )
}

function isLongitudeWithinBounds({
  longitude,
  west,
  east,
}: {
  longitude: number
  west: number
  east: number
}) {
  if (west <= east) return longitude >= west && longitude <= east
  return longitude >= west || longitude <= east
}

export function isCoordinateWithinMapBounds({
  map,
  coordinates,
}: {
  map: mapboxgl.Map
  coordinates: [number, number]
}) {
  const bounds = map.getBounds()
  if (!bounds) return true
  const west = bounds.getWest()
  const east = bounds.getEast()
  const south = bounds.getSouth()
  const north = bounds.getNorth()
  const [longitude, latitude] = coordinates
  if (latitude < south || latitude > north) return false
  if (isLongitudeWithinBounds({ longitude, west, east })) return true
  if (isLongitudeWithinBounds({ longitude: longitude + 360, west, east })) return true
  return isLongitudeWithinBounds({ longitude: longitude - 360, west, east })
}

export function queryVisibleUnclusteredOrganizationFeatures({
  map,
}: {
  map: mapboxgl.Map
}) {
  const source = getMapSourceSafely(map, PUBLIC_MAP_ORGANIZATION_SOURCE_ID)
  if (isMapStyleAccessError(source) || !source) return []

  if (typeof map.querySourceFeatures !== "function") {
    return map
      .queryRenderedFeatures({
        layers: [PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID],
      })
      .filter((feature) => {
        const properties = (feature.properties ?? {}) as Record<string, unknown>
        if (isClusterFeature(properties)) return false
        const coordinates = resolveFeatureCoordinatesForMap({
          map,
          feature,
        })
        return coordinates ? isCoordinateWithinMapBounds({ map, coordinates }) : false
      })
  }

  const featureByOrganizationId = new Map<string, mapboxgl.MapboxGeoJSONFeature>()
  const sourceFeatures = map.querySourceFeatures(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)
  for (const feature of sourceFeatures) {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    if (isClusterFeature(properties)) continue
    const organizationId = resolveOrganizationId(properties.organizationId)
    if (!organizationId || featureByOrganizationId.has(organizationId)) continue
    const coordinates = resolveFeatureCoordinatesForMap({
      map,
      feature,
    })
    if (!coordinates || !isCoordinateWithinMapBounds({ map, coordinates })) continue
    featureByOrganizationId.set(organizationId, feature)
  }

  return [...featureByOrganizationId.values()]
}

export function shouldScheduleClusterRenderFromSourceData({
  map,
  event,
}: {
  map: mapboxgl.Map
  event: mapboxgl.MapSourceDataEvent
}) {
  if (event.sourceId && event.sourceId !== PUBLIC_MAP_ORGANIZATION_SOURCE_ID) return false
  if (event.dataType === "source" && event.isSourceLoaded === false) return false
  const moving = typeof map.isMoving === "function" ? map.isMoving() : false
  return !moving
}

export function resolveClusterClickTarget({
  map,
  clusterId,
  fallbackCoordinates,
}: {
  map: mapboxgl.Map
  clusterId: number
  fallbackCoordinates: [number, number]
}) {
  const normalizedFallbackCoordinates = normalizeCoordinatesForMap({
    map,
    coordinates: fallbackCoordinates,
  })
  const fallbackPoint = map.project(normalizedFallbackCoordinates)
  const rendered = map.queryRenderedFeatures({
    layers: [PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID],
  })
  let bestTarget: { clusterId: number; coordinates: [number, number]; score: number } | null =
    null

  for (const feature of rendered) {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const renderedClusterId = resolveClusterId(properties.cluster_id)
    if (renderedClusterId !== clusterId) continue
    const renderedCoordinates = resolveFeatureCoordinatesForMap({
      map,
      feature,
    })
    if (!renderedCoordinates) continue
    const projected = map.project(renderedCoordinates)
    const score =
      Math.abs(projected.x - fallbackPoint.x) + Math.abs(projected.y - fallbackPoint.y)
    if (!bestTarget || score < bestTarget.score) {
      bestTarget = {
        clusterId: renderedClusterId,
        coordinates: renderedCoordinates,
        score,
      }
    }
  }

  if (bestTarget) {
    return {
      clusterId: bestTarget.clusterId,
      coordinates: bestTarget.coordinates,
    }
  }

  return {
    clusterId,
    coordinates: normalizedFallbackCoordinates,
  }
}
