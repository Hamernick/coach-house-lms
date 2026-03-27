import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  CLUSTER_PREVIEW_MAX_MEMBERS,
  type ClusterMarkerPreviewMember,
  updateOrganizationClusterMarkerElement,
} from "./map-markers"
import {
  normalizeCoordinatesForMap,
  resolveFeatureCoordinates,
  resolveFeatureCoordinatesForMap,
} from "./map-coordinate-normalization"
import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
} from "./map-view-helpers"

export type ClusteredMarkerEntry = {
  marker: mapboxgl.Marker
  kind: "cluster" | "organization"
  pointCount?: number
  previewSignature?: string
  previewRequestId?: number
  missCount?: number
  clusterActionState?: {
    clusterId: number
    pointCount: number
    coordinates: [number, number]
  }
}

export const MARKER_RECONCILE_MIN_INTERVAL_MS = 48
export const MARKER_RECONCILE_MAX_MISSES = 1

export function clearClusteredMarkers(markersByKey: Map<string, ClusteredMarkerEntry>) {
  for (const entry of markersByKey.values()) {
    entry.marker.remove()
  }
  markersByKey.clear()
}

export function resolveClusterId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function buildClusterPreviewMembers({
  leaves,
  organizationById,
}: {
  leaves: mapboxgl.MapboxGeoJSONFeature[]
  organizationById: Map<string, PublicMapOrganization>
}): ClusterMarkerPreviewMember[] {
  const previewMembers: ClusterMarkerPreviewMember[] = []
  const seen = new Set<string>()
  for (const leaf of leaves) {
    const properties = (leaf.properties ?? {}) as Record<string, unknown>
    const organizationId = resolveOrganizationId(properties.organizationId)
    if (!organizationId || seen.has(organizationId)) continue
    seen.add(organizationId)

    const organization = organizationById.get(organizationId)
    if (organization) {
      const imageUrl = organization.logoUrl?.trim() || organization.headerUrl?.trim() || null
      previewMembers.push({
        id: organization.id,
        name: organization.name,
        imageUrl,
      })
    } else {
      const fallbackName =
        typeof properties.name === "string" && properties.name.trim().length > 0
          ? properties.name.trim()
          : "Organization"
      previewMembers.push({
        id: organizationId,
        name: fallbackName,
        imageUrl: null,
      })
    }

    if (previewMembers.length >= CLUSTER_PREVIEW_MAX_MEMBERS) break
  }
  return previewMembers
}

function buildPreviewSignature(previewMembers: ClusterMarkerPreviewMember[]) {
  return previewMembers
    .map((member) => `${member.id}:${member.imageUrl ?? ""}`)
    .join("|")
}

export function syncClusterPreviewForMarker({
  markersByKey,
  markerKey,
  clusterId,
  pointCount,
  source,
  organizationById,
}: {
  markersByKey: Map<string, ClusteredMarkerEntry>
  markerKey: string
  clusterId: number
  pointCount: number
  source: mapboxgl.GeoJSONSource
  organizationById: Map<string, PublicMapOrganization>
}) {
  const currentEntry = markersByKey.get(markerKey)
  if (!currentEntry || currentEntry.kind !== "cluster") return
  if (currentEntry.pointCount === pointCount && currentEntry.previewSignature) return

  const requestId = (currentEntry.previewRequestId ?? 0) + 1
  currentEntry.previewRequestId = requestId
  const leafLimit = Math.max(1, Math.min(pointCount, CLUSTER_PREVIEW_MAX_MEMBERS))

  source.getClusterLeaves(clusterId, leafLimit, 0, (error, leaves) => {
    const entry = markersByKey.get(markerKey)
    if (!entry || entry.kind !== "cluster") return
    if (entry.previewRequestId !== requestId) return
    if (error || !Array.isArray(leaves)) return

    const previewMembers = buildClusterPreviewMembers({
      leaves: leaves as mapboxgl.MapboxGeoJSONFeature[],
      organizationById,
    })
    const previewSignature = buildPreviewSignature(previewMembers)
    if (entry.previewSignature === previewSignature && entry.pointCount === pointCount) return

    updateOrganizationClusterMarkerElement({
      element: entry.marker.getElement(),
      pointCount,
      previewMembers,
    })
    entry.previewSignature = previewSignature
    entry.pointCount = pointCount
  })
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

export function queryClusterReconcileFeatures({
  map,
}: {
  map: mapboxgl.Map
}) {
  if (!map.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)) return []
  const moving = typeof map.isMoving === "function" ? map.isMoving() : false
  if (moving) return []
  return map.queryRenderedFeatures({
    layers: [
      PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
      PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    ],
  })
}

export function queryVisibleUnclusteredOrganizationFeatures({
  map,
}: {
  map: mapboxgl.Map
}) {
  if (!map.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)) return []

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

function resolveLogicalFeatureKey(properties: Record<string, unknown>) {
  if (isClusterFeature(properties)) {
    const clusterId = resolveClusterId(properties.cluster_id)
    return clusterId === null ? null : `cluster:${clusterId}`
  }
  const organizationId = resolveOrganizationId(properties.organizationId)
  return organizationId ? `organization:${organizationId}` : null
}

function resolveViewportReferencePoint(map: mapboxgl.Map) {
  const canvas = map.getCanvas()
  return {
    x: canvas.clientWidth / 2,
    y: canvas.clientHeight / 2,
  }
}

function resolveMarkerReferencePoint({
  map,
  entry,
}: {
  map: mapboxgl.Map
  entry: ClusteredMarkerEntry | undefined
}) {
  if (!entry) return null
  const markerElement = entry.marker.getElement()
  const canvasContainer = map.getCanvasContainer()
  const markerRect = markerElement.getBoundingClientRect()
  const containerRect = canvasContainer.getBoundingClientRect()
  if (
    markerRect.width <= 0 ||
    markerRect.height <= 0 ||
    containerRect.width <= 0 ||
    containerRect.height <= 0
  ) {
    return null
  }
  return {
    x: markerRect.left - containerRect.left + markerRect.width / 2,
    y: markerRect.top - containerRect.top + markerRect.height / 2,
  }
}

function resolveFeatureSelectionScore({
  map,
  coordinates,
  rawCoordinates,
  referencePoint,
}: {
  map: mapboxgl.Map
  coordinates: [number, number]
  rawCoordinates: [number, number]
  referencePoint: { x: number; y: number }
}) {
  const projected = map.project(coordinates)
  const viewportCenter = resolveViewportReferencePoint(map)
  return {
    referenceDistance:
      Math.abs(projected.x - referencePoint.x) + Math.abs(projected.y - referencePoint.y),
    centerDistance:
      Math.abs(projected.x - viewportCenter.x) + Math.abs(projected.y - viewportCenter.y),
    wrapPenalty: Math.abs(rawCoordinates[0] - coordinates[0]),
  }
}

export function coalesceClusterReconcileFeatures({
  map,
  features,
  markersByKey,
}: {
  map: mapboxgl.Map
  features: mapboxgl.MapboxGeoJSONFeature[]
  markersByKey: Map<string, ClusteredMarkerEntry>
}) {
  const featureByKey = new Map<
    string,
    {
      feature: mapboxgl.MapboxGeoJSONFeature
      score: ReturnType<typeof resolveFeatureSelectionScore>
    }
  >()
  const defaultReferencePoint = resolveViewportReferencePoint(map)

  for (const feature of features) {
    const rawCoordinates = resolveFeatureCoordinates(feature)
    if (!rawCoordinates) continue
    const coordinates = normalizeCoordinatesForMap({
      map,
      coordinates: rawCoordinates,
    })
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const key = resolveLogicalFeatureKey(properties)
    if (!key) continue

    const existingEntry = markersByKey.get(key)
    const referencePoint =
      resolveMarkerReferencePoint({
        map,
        entry: existingEntry,
      }) ?? defaultReferencePoint
    const score = resolveFeatureSelectionScore({
      map,
      coordinates,
      rawCoordinates,
      referencePoint,
    })

    const currentBest = featureByKey.get(key)
    if (
      !currentBest ||
      score.referenceDistance < currentBest.score.referenceDistance ||
      (score.referenceDistance === currentBest.score.referenceDistance &&
        (score.centerDistance < currentBest.score.centerDistance ||
          (score.centerDistance === currentBest.score.centerDistance &&
            score.wrapPenalty < currentBest.score.wrapPenalty)))
    ) {
      featureByKey.set(key, {
        feature,
        score,
      })
    }
  }

  return Array.from(featureByKey.values()).map((entry) => entry.feature)
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
  let bestTarget: { clusterId: number; coordinates: [number, number]; score: number } | null = null

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
