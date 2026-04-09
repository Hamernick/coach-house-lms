import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { CLUSTER_PREVIEW_MAX_MEMBERS, type ClusterMarkerPreviewMember } from "./map-markers"
import {
  normalizeCoordinatesForMap,
  resolveFeatureCoordinates,
} from "./map-coordinate-normalization"
import type { ClusteredMarkerEntry } from "./public-map-cluster-runtime"

export function buildClusterPreviewMembers({
  leaves,
  organizationById,
  resolveOrganizationId,
}: {
  leaves: mapboxgl.MapboxGeoJSONFeature[]
  organizationById: Map<string, PublicMapOrganization>
  resolveOrganizationId: (value: unknown) => string | null
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
      const imageUrl =
        organization.logoUrl?.trim() || organization.headerUrl?.trim() || null
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

export function buildPreviewSignature(
  previewMembers: ClusterMarkerPreviewMember[],
) {
  return previewMembers
    .map((member) => `${member.id}:${member.imageUrl ?? ""}`)
    .join("|")
}

function resolveViewportReferencePoint(map: mapboxgl.Map) {
  const canvas = map.getCanvas()
  if (!canvas) {
    return {
      x: 0,
      y: 0,
    }
  }
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
      Math.abs(projected.x - referencePoint.x) +
      Math.abs(projected.y - referencePoint.y),
    centerDistance:
      Math.abs(projected.x - viewportCenter.x) +
      Math.abs(projected.y - viewportCenter.y),
    wrapPenalty: Math.abs(rawCoordinates[0] - coordinates[0]),
  }
}

function resolveLogicalFeatureKey({
  properties,
  isClusterFeature,
  resolveClusterId,
  resolveOrganizationId,
}: {
  properties: Record<string, unknown>
  isClusterFeature: (properties: Record<string, unknown>) => boolean
  resolveClusterId: (value: unknown) => number | null
  resolveOrganizationId: (value: unknown) => string | null
}) {
  if (isClusterFeature(properties)) {
    const clusterId = resolveClusterId(properties.cluster_id)
    return clusterId === null ? null : `cluster:${clusterId}`
  }
  const organizationId = resolveOrganizationId(properties.organizationId)
  return organizationId ? `organization:${organizationId}` : null
}

export function coalesceClusterReconcileFeaturesFromSupport({
  map,
  features,
  markersByKey,
  isClusterFeature,
  resolveClusterId,
  resolveOrganizationId,
}: {
  map: mapboxgl.Map
  features: mapboxgl.MapboxGeoJSONFeature[]
  markersByKey: Map<string, ClusteredMarkerEntry>
  isClusterFeature: (properties: Record<string, unknown>) => boolean
  resolveClusterId: (value: unknown) => number | null
  resolveOrganizationId: (value: unknown) => string | null
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
    const key = resolveLogicalFeatureKey({
      properties,
      isClusterFeature,
      resolveClusterId,
      resolveOrganizationId,
    })
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
