import { describe, expect, it } from "vitest"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  resolveSpiderfyCandidateBucket,
  resolveSpiderfyCandidateBuckets,
} from "@/components/public/public-map-index/overlap-expansion"

function buildOrganization(
  id: string,
  longitude: number,
  latitude: number,
): PublicMapOrganization {
  return {
    id,
    name: `Organization ${id}`,
    tagline: null,
    description: null,
    boilerplate: null,
    vision: null,
    mission: null,
    values: null,
    needStatement: null,
    formationStatus: null,
    contactName: null,
    logoUrl: null,
    brandMarkUrl: null,
    headerUrl: null,
    website: null,
    email: null,
    phone: null,
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    brandPrimary: null,
    brandColors: [],
    brandThemePresetId: null,
    brandAccentPresetId: null,
    brandTypographyPresetId: null,
    brandTypography: null,
    brandKitAvailable: false,
    latitude,
    longitude,
    address: null,
    addressStreet: null,
    addressPostal: null,
    city: "Chicago",
    state: "IL",
    country: "United States",
    locationUrl: null,
    publicSlug: id,
    programPreview: null,
    programs: [],
    programCount: 0,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
  }
}

function buildFeature({
  organizationId,
  name,
  longitude,
  latitude,
}: {
  organizationId: string
  name: string
  longitude: number
  latitude: number
}) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      organizationId,
      name,
    },
  } as unknown as mapboxgl.MapboxGeoJSONFeature
}

function resolveOrganizationId(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function resolveFeatureCoordinates(feature: mapboxgl.MapboxGeoJSONFeature) {
  if (!feature.geometry || feature.geometry.type !== "Point") return null
  const [longitude, latitude] = feature.geometry.coordinates as [number, number]
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude] as [number, number]
}

describe("resolveSpiderfyCandidateBuckets", () => {
  it("returns multiple duplicate-coordinate buckets sorted by density then distance", () => {
    const organizationById = new Map<string, PublicMapOrganization>([
      ["a-1", buildOrganization("a-1", -87.63, 41.88)],
      ["a-2", buildOrganization("a-2", -87.63, 41.88)],
      ["b-1", buildOrganization("b-1", -87.64, 41.89)],
      ["b-2", buildOrganization("b-2", -87.64, 41.89)],
      ["b-3", buildOrganization("b-3", -87.64, 41.89)],
      ["solo", buildOrganization("solo", -87.7, 41.91)],
    ])

    const leaves = [
      buildFeature({
        organizationId: "a-1",
        name: "A1",
        longitude: -87.63,
        latitude: 41.88,
      }),
      buildFeature({
        organizationId: "a-2",
        name: "A2",
        longitude: -87.63,
        latitude: 41.88,
      }),
      buildFeature({
        organizationId: "b-1",
        name: "B1",
        longitude: -87.64,
        latitude: 41.89,
      }),
      buildFeature({
        organizationId: "b-2",
        name: "B2",
        longitude: -87.64,
        latitude: 41.89,
      }),
      buildFeature({
        organizationId: "b-3",
        name: "B3",
        longitude: -87.64,
        latitude: 41.89,
      }),
      buildFeature({
        organizationId: "solo",
        name: "Solo",
        longitude: -87.7,
        latitude: 41.91,
      }),
    ]

    const buckets = resolveSpiderfyCandidateBuckets({
      leaves,
      organizationById,
      targetCoordinates: [-87.63, 41.88],
      resolveOrganizationId,
      resolveFeatureCoordinates,
      maxBuckets: 3,
    })

    expect(buckets).toHaveLength(2)
    expect(buckets[0]?.organizations.map((organization) => organization.id)).toEqual([
      "b-1",
      "b-2",
      "b-3",
    ])
    expect(buckets[1]?.organizations.map((organization) => organization.id)).toEqual([
      "a-1",
      "a-2",
    ])

    const primary = resolveSpiderfyCandidateBucket({
      leaves,
      organizationById,
      targetCoordinates: [-87.63, 41.88],
      resolveOrganizationId,
      resolveFeatureCoordinates,
    })
    expect(primary?.organizations.map((organization) => organization.id)).toEqual([
      "b-1",
      "b-2",
      "b-3",
    ])
  })
})
