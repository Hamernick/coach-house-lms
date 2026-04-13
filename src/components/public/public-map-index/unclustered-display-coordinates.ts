import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  normalizeCoordinatesForMap,
  resolveFeatureCoordinatesForMap,
} from "./map-coordinate-normalization"
import {
  resolveMarkerOverlapBuckets,
} from "./marker-overlap-buckets"
import {
  isClusterFeature,
  resolveOrganizationId,
} from "./public-map-cluster-runtime"

function resolveOverlapBucketAngleOffset(key: string) {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 33 + key.charCodeAt(index)) >>> 0
  }
  return ((hash % 360) * Math.PI) / 180
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
  const coordinateCandidates = new Map<
    string,
    {
      organizationId: string
      coordinates: [number, number]
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

    coordinateCandidates.set(organizationId, {
      organizationId,
      coordinates: resolvedCoordinates,
    })
  }

  const displayCoordinatesById = new Map<string, [number, number]>()
  const overlapBuckets = resolveMarkerOverlapBuckets({
    map,
    items: Array.from(coordinateCandidates.values()),
    getKey: (item) => item.organizationId,
    getCoordinates: (item) => item.coordinates,
  })

  for (const bucket of overlapBuckets) {
    if (bucket.members.length < 2) {
      const [onlyMember] = bucket.members
      if (onlyMember) {
        displayCoordinatesById.set(onlyMember.item.organizationId, onlyMember.coordinates)
      }
      continue
    }

    const radius = Math.max(18, Math.min(34, 16 + bucket.members.length * 2.1))
    const angleOffset = resolveOverlapBucketAngleOffset(bucket.key) - Math.PI / 2
    bucket.members.forEach((member, index) => {
      const angle = angleOffset + (index * (2 * Math.PI)) / bucket.members.length
      const lngLat = map.unproject([
        bucket.point.x + Math.cos(angle) * radius,
        bucket.point.y + Math.sin(angle) * radius,
      ])
      displayCoordinatesById.set(member.item.organizationId, [lngLat.lng, lngLat.lat])
    })
  }

  return displayCoordinatesById
}
