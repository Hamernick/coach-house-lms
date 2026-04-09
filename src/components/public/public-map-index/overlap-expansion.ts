import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  createOrganizationMarkerElement,
} from "./map-markers"
import {
  getMapLayerSafely,
  getMapSourceSafely,
  isMapStyleAccessError,
} from "./map-style-guards"

type MapboxApi = typeof import("mapbox-gl")["default"]

export type SpiderfyBucket = {
  key: string
  coordinates: [number, number]
  organizations: PublicMapOrganization[]
}

export type SpiderfyOverlayState = {
  markers: mapboxgl.Marker[]
}

export const PUBLIC_MAP_SPIDERFY_RAILS_SOURCE_ID = "public-map-spiderfy-rails"
export const PUBLIC_MAP_SPIDERFY_RAILS_LAYER_ID = "public-map-spiderfy-rails-layer"
export const SPIDERFY_MAX_LEAVES = 180
const SPIDERFY_COORDINATE_PRECISION = 6
const SPIDERFY_MAX_BUCKET_ITEMS = 10
const SPIDERFY_MAX_BUCKETS = 6

const EMPTY_SPIDERFY_RAILS: {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    properties: Record<string, never>
    geometry: {
      type: "LineString"
      coordinates: [[number, number], [number, number]]
    }
  }>
} = {
  type: "FeatureCollection",
  features: [],
}

function resolveCoordinateKey(longitude: number, latitude: number) {
  return `${longitude.toFixed(SPIDERFY_COORDINATE_PRECISION)}:${latitude.toFixed(SPIDERFY_COORDINATE_PRECISION)}`
}

function resolveBucketDistance({
  coordinates,
  targetCoordinates,
}: {
  coordinates: [number, number]
  targetCoordinates: [number, number]
}) {
  return (
    Math.abs(coordinates[0] - targetCoordinates[0]) +
    Math.abs(coordinates[1] - targetCoordinates[1])
  )
}

function resolveBucketAngleOffset(key: string) {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 33 + key.charCodeAt(index)) >>> 0
  }
  const degrees = hash % 360
  return (degrees * Math.PI) / 180
}

export function ensureSpiderfyRailLayer(map: mapboxgl.Map) {
  const existingSource = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    map,
    PUBLIC_MAP_SPIDERFY_RAILS_SOURCE_ID,
  )
  if (isMapStyleAccessError(existingSource)) return
  if (!existingSource) {
    try {
      map.addSource(PUBLIC_MAP_SPIDERFY_RAILS_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_SPIDERFY_RAILS,
      })
    } catch {
      return
    }
  }

  const existingLayer = getMapLayerSafely(map, PUBLIC_MAP_SPIDERFY_RAILS_LAYER_ID)
  if (isMapStyleAccessError(existingLayer)) return
  if (!existingLayer) {
    try {
      map.addLayer({
        id: PUBLIC_MAP_SPIDERFY_RAILS_LAYER_ID,
        type: "line",
        source: PUBLIC_MAP_SPIDERFY_RAILS_SOURCE_ID,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "rgba(255, 255, 255, 0.56)",
          "line-width": 1.6,
          "line-opacity": 0.82,
        },
      })
    } catch {
      return
    }
  }
}

export function clearSpiderfyOverlay({
  map,
  state,
}: {
  map: mapboxgl.Map
  state: SpiderfyOverlayState
}) {
  for (const marker of state.markers) {
    marker.remove()
  }
  state.markers = []

  const source = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    map,
    PUBLIC_MAP_SPIDERFY_RAILS_SOURCE_ID,
  )
  if (isMapStyleAccessError(source)) return
  source?.setData(EMPTY_SPIDERFY_RAILS)
}

export function resolveSpiderfyCandidateBuckets({
  leaves,
  organizationById,
  targetCoordinates,
  resolveOrganizationId,
  resolveFeatureCoordinates,
  maxBuckets = SPIDERFY_MAX_BUCKETS,
}: {
  leaves: mapboxgl.MapboxGeoJSONFeature[]
  organizationById: Map<string, PublicMapOrganization>
  targetCoordinates: [number, number]
  resolveOrganizationId: (value: unknown) => string | null
  resolveFeatureCoordinates: (feature: mapboxgl.MapboxGeoJSONFeature) => [number, number] | null
  maxBuckets?: number
}) {
  const buckets = new Map<string, SpiderfyBucket>()

  for (const leaf of leaves) {
    const properties = (leaf.properties ?? {}) as Record<string, unknown>
    const organizationId = resolveOrganizationId(properties.organizationId)
    if (!organizationId) continue

    const organization = organizationById.get(organizationId)
    if (!organization) continue

    const leafCoordinates = resolveFeatureCoordinates(leaf)
    const fallbackCoordinates: [number, number] | null =
      typeof organization.longitude === "number" &&
      Number.isFinite(organization.longitude) &&
      typeof organization.latitude === "number" &&
      Number.isFinite(organization.latitude)
        ? [organization.longitude, organization.latitude]
        : null
    const coordinates = leafCoordinates ?? fallbackCoordinates
    if (!coordinates) continue

    const key = resolveCoordinateKey(coordinates[0], coordinates[1])
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.organizations.push(organization)
      continue
    }

    buckets.set(key, {
      key,
      coordinates,
      organizations: [organization],
    })
  }

  const duplicateBuckets = Array.from(buckets.values())
    .filter((bucket) => bucket.organizations.length > 1)
    .map((bucket) => ({
      bucket,
      distance: resolveBucketDistance({
        coordinates: bucket.coordinates,
        targetCoordinates,
      }),
    }))
    .sort((left, right) => {
      if (left.bucket.organizations.length !== right.bucket.organizations.length) {
        return right.bucket.organizations.length - left.bucket.organizations.length
      }
      return left.distance - right.distance
    })

  return duplicateBuckets
    .slice(0, Math.max(1, Math.min(maxBuckets, SPIDERFY_MAX_BUCKETS)))
    .map((entry) => entry.bucket)
}

export function resolveSpiderfyCandidateBucket({
  leaves,
  organizationById,
  targetCoordinates,
  resolveOrganizationId,
  resolveFeatureCoordinates,
}: {
  leaves: mapboxgl.MapboxGeoJSONFeature[]
  organizationById: Map<string, PublicMapOrganization>
  targetCoordinates: [number, number]
  resolveOrganizationId: (value: unknown) => string | null
  resolveFeatureCoordinates: (feature: mapboxgl.MapboxGeoJSONFeature) => [number, number] | null
}) {
  const [primaryBucket] = resolveSpiderfyCandidateBuckets({
    leaves,
    organizationById,
    targetCoordinates,
    resolveOrganizationId,
    resolveFeatureCoordinates,
    maxBuckets: 1,
  })
  return primaryBucket ?? null
}

export function openSpiderfyOverlay({
  map,
  mapbox,
  state,
  buckets,
  selectedOrganizationId,
  onSelectOrganization,
}: {
  map: mapboxgl.Map
  mapbox: MapboxApi
  state: SpiderfyOverlayState
  buckets: SpiderfyBucket[]
  selectedOrganizationId: string | null
  onSelectOrganization: (organizationId: string) => void
}) {
  clearSpiderfyOverlay({ map, state })
  ensureSpiderfyRailLayer(map)

  const candidateBuckets = buckets
    .filter((bucket) => bucket.organizations.length > 1)
    .slice(0, SPIDERFY_MAX_BUCKETS)
  if (candidateBuckets.length === 0) return

  const lineFeatures: Array<{
    type: "Feature"
    properties: Record<string, never>
    geometry: {
      type: "LineString"
      coordinates: [[number, number], [number, number]]
    }
  }> = []

  candidateBuckets.forEach((bucket) => {
    const centerPoint = map.project(bucket.coordinates)
    const organizations = bucket.organizations.slice(0, SPIDERFY_MAX_BUCKET_ITEMS)
    const count = organizations.length
    if (count < 2) return

    const radius = Math.max(30, Math.min(68, 24 + count * 5))
    const angleOffset = resolveBucketAngleOffset(bucket.key) - Math.PI / 2

    organizations.forEach((organization, index) => {
      const angle = angleOffset + (index * (2 * Math.PI)) / count
      const point: [number, number] = [
        centerPoint.x + Math.cos(angle) * radius,
        centerPoint.y + Math.sin(angle) * radius,
      ]
      const lngLat = map.unproject(point)
      const markerCoordinates: [number, number] = [lngLat.lng, lngLat.lat]

      const element = createOrganizationMarkerElement({
        organization,
        selected: organization.id === selectedOrganizationId,
        onSelect: () => {
          clearSpiderfyOverlay({ map, state })
          onSelectOrganization(organization.id)
        },
      })
      element.style.transition =
        "transform 180ms cubic-bezier(0.22,1,0.36,1), opacity 160ms ease"
      element.style.transform = "scale(0.92)"
      element.style.opacity = "0.86"
      requestAnimationFrame(() => {
        element.style.transform = "scale(1)"
        element.style.opacity = "1"
      })

      const marker = new mapbox.Marker({
        element,
        anchor: "center",
        offset: [0, 0],
      })
        .setLngLat(markerCoordinates)
        .addTo(map)
      state.markers.push(marker)

      lineFeatures.push({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [bucket.coordinates, markerCoordinates],
        },
      })
    })
  })

  const source = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    map,
    PUBLIC_MAP_SPIDERFY_RAILS_SOURCE_ID,
  )
  if (isMapStyleAccessError(source)) return
  source?.setData({
    type: "FeatureCollection",
    features: lineFeatures,
  })
}
