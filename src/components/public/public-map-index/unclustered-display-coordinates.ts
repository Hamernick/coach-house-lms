import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  normalizeCoordinatesForMap,
  resolveFeatureCoordinatesForMap,
} from "./map-coordinate-normalization"
import {
  isClusterFeature,
  resolveOrganizationId,
} from "./public-map-cluster-runtime"

const OVERLAP_COORDINATE_PRECISION = 6

function resolveOverlapBucketAngleOffset(key: string) {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 33 + key.charCodeAt(index)) >>> 0
  }
  return ((hash % 360) * Math.PI) / 180
}

function resolveOverlapCoordinateKey(coordinates: [number, number]) {
  return `${coordinates[0].toFixed(OVERLAP_COORDINATE_PRECISION)}:${coordinates[1].toFixed(OVERLAP_COORDINATE_PRECISION)}`
}

export function resolveUnclusteredDisplayCoordinates({
  map,
  features,
  organizationById,
}: {
  map: mapboxgl.Map
  features: mapboxgl.MapboxGeoJSONFeature[]
  organizationById: Map<string, PublicMapOrganization>
}) {
  const buckets = new Map<
    string,
    {
      coordinates: [number, number]
      members: string[]
    }
  >()

  for (const feature of features) {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    if (isClusterFeature(properties)) continue
    const organizationId = resolveOrganizationId(properties.organizationId)
    if (!organizationId) continue
    const organization = organizationById.get(organizationId)
    const canonicalOrganizationCoordinates =
      organization &&
      typeof organization.longitude === "number" &&
      Number.isFinite(organization.longitude) &&
      typeof organization.latitude === "number" &&
      Number.isFinite(organization.latitude)
        ? normalizeCoordinatesForMap({
            map,
            coordinates: [organization.longitude, organization.latitude],
          })
        : null
    const resolvedCoordinates =
      canonicalOrganizationCoordinates ??
      resolveFeatureCoordinatesForMap({
        map,
        feature,
      })
    if (!resolvedCoordinates) continue

    const key = resolveOverlapCoordinateKey(resolvedCoordinates)
    const bucket = buckets.get(key)
    if (!bucket) {
      buckets.set(key, {
        coordinates: resolvedCoordinates,
        members: [organizationId],
      })
      continue
    }
    if (!bucket.members.includes(organizationId)) {
      bucket.members.push(organizationId)
    }
  }

  const displayCoordinatesById = new Map<string, [number, number]>()
  for (const [key, bucket] of buckets.entries()) {
    const members = bucket.members.slice().sort((left, right) => left.localeCompare(right))
    if (members.length < 2) {
      const [onlyId] = members
      if (onlyId) {
        displayCoordinatesById.set(onlyId, bucket.coordinates)
      }
      continue
    }

    const centerPoint = map.project(bucket.coordinates)
    const radius = Math.max(18, Math.min(34, 16 + members.length * 2.1))
    const angleOffset = resolveOverlapBucketAngleOffset(key) - Math.PI / 2
    members.forEach((organizationId, index) => {
      const angle = angleOffset + (index * (2 * Math.PI)) / members.length
      const lngLat = map.unproject([
        centerPoint.x + Math.cos(angle) * radius,
        centerPoint.y + Math.sin(angle) * radius,
      ])
      displayCoordinatesById.set(organizationId, [lngLat.lng, lngLat.lat])
    })
  }

  return displayCoordinatesById
}
