import { describe, expect, it } from "vitest"

import {
  buildPublicMapMarkerRelevance,
  resolvePublicMapMarkerRelevanceTier,
} from "@/lib/public-map/public-map-marker-relevance"
import type { PublicMapPointFeature } from "@/lib/public-map/public-map-geojson"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"
import {
  resolveRelevantUnselectedPointFilter,
  resolveSavedPointFilter,
} from "@/components/public/public-map-index/map-layer-filters"

function buildFeature({
  category = "food",
  id,
  latitude,
  longitude,
  organizationIds = id,
  verificationStatus = "external_data",
  weatherEligible = false,
}: {
  category?: PublicMapResourceCategoryKey
  id: string
  latitude: number
  longitude: number
  organizationIds?: string
  verificationStatus?: "external_data" | "verified_platform"
  weatherEligible?: boolean
}): PublicMapPointFeature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties: {
      designation: "Resource",
      itemId: id,
      itemType:
        verificationStatus === "verified_platform"
          ? "platform_organization"
          : "external_resource",
      markerAccentColor: "#2563eb",
      markerImageKey: `marker-${id}`,
      markerImageUrl: null,
      markerStyleKey: "standard",
      name: id,
      organizationId: id,
      organizationIds,
      primaryGroup: "community",
      primaryResourceCategory: category,
      sameLocationCount: 1,
      sameLocationKey: id,
      sameLocationLabel: "Chicago, IL",
      verificationStatus,
      weatherEligible,
    },
  }
}

describe("public map marker relevance", () => {
  it("shows one exact-coordinate category representative on the overview globe", () => {
    const features = [
      buildFeature({ id: "food-a", latitude: 41.88, longitude: -87.63 }),
      buildFeature({ id: "food-b", latitude: 41.881, longitude: -87.631 }),
      buildFeature({ id: "food-c", latitude: 41.882, longitude: -87.632 }),
      buildFeature({ id: "food-d", latitude: 41.883, longitude: -87.633 }),
    ]
    const relevant = buildPublicMapMarkerRelevance({ features })
    const countAtTier = (tier: 0 | 1 | 2 | 3) =>
      relevant.filter(
        (feature) => (feature.properties.markerRelevanceTier ?? 3) <= tier
      ).length

    expect(countAtTier(0)).toBe(1)
    expect(countAtTier(1)).toBe(1)
    expect(countAtTier(2)).toBe(2)
    expect(countAtTier(3)).toBe(4)
    expect(
      relevant.every(
        (feature) => feature.properties.markerOverviewOffsetIndex === undefined
      )
    ).toBe(true)
    expect(relevant.map((feature) => feature.geometry.coordinates)).toEqual(
      features.map((feature) => feature.geometry.coordinates)
    )
  })

  it("reserves overview representation for each resource category", () => {
    const relevant = buildPublicMapMarkerRelevance({
      features: [
        buildFeature({ id: "food-a", latitude: 41.88, longitude: -87.63 }),
        buildFeature({
          category: "health",
          id: "health-a",
          latitude: 41.881,
          longitude: -87.631,
        }),
      ],
    })

    expect(
      relevant.every((feature) => feature.properties.markerRelevanceTier === 0)
    ).toBe(true)
  })

  it("chooses the resource nearest the user as the local representative", () => {
    const relevant = buildPublicMapMarkerRelevance({
      features: [
        buildFeature({ id: "far", latitude: 41.95, longitude: -87.7 }),
        buildFeature({ id: "near", latitude: 41.88, longitude: -87.63 }),
      ],
      userCoordinates: { latitude: 41.879, longitude: -87.629 },
    })

    expect(
      relevant.find((feature) => feature.properties.itemId === "near")
        ?.properties.markerRelevanceTier
    ).toBe(0)
  })

  it("prioritizes only eligible cooling resources during active heat", () => {
    const features = [
      buildFeature({
        category: "environment",
        id: "near-environment",
        latitude: 41.88,
        longitude: -87.63,
      }),
      buildFeature({
        category: "emergency_cooling_centers",
        id: "eligible-cooling",
        latitude: 41.9,
        longitude: -87.65,
        weatherEligible: true,
      }),
    ]
    const inactive = buildPublicMapMarkerRelevance({
      features,
      userCoordinates: { latitude: 41.88, longitude: -87.63 },
    })
    const active = buildPublicMapMarkerRelevance({
      boostCoolingCenters: true,
      features,
      userCoordinates: { latitude: 41.88, longitude: -87.63 },
    })

    expect(
      inactive.find(
        (feature) => feature.properties.itemId === "near-environment"
      )?.properties.markerRelevanceTier
    ).toBe(0)
    expect(
      inactive.find(
        (feature) => feature.properties.itemId === "eligible-cooling"
      )?.properties.markerRelevanceTier
    ).toBeGreaterThan(0)
    expect(
      active.find((feature) => feature.properties.itemId === "eligible-cooling")
        ?.properties.markerRelevanceTier
    ).toBe(0)
    expect(
      active.find((feature) => feature.properties.itemId === "near-environment")
        ?.properties.markerRelevanceTier
    ).toBeGreaterThan(0)
  })

  it("keeps any saved organization in a same-location marker prioritized", () => {
    const [feature] = buildPublicMapMarkerRelevance({
      favoriteOrganizationIds: new Set(["org-b"]),
      features: [
        buildFeature({
          id: "org-a",
          latitude: 41.88,
          longitude: -87.63,
          organizationIds: "org-a|org-b",
          verificationStatus: "verified_platform",
        }),
      ],
    })

    expect(feature?.properties.isSaved).toBe(true)
  })

  it("maps zoom levels to overview, city, neighborhood, and full detail", () => {
    expect(resolvePublicMapMarkerRelevanceTier(4.85)).toBe(0)
    expect(resolvePublicMapMarkerRelevanceTier(8)).toBe(1)
    expect(resolvePublicMapMarkerRelevanceTier(11)).toBe(2)
    expect(resolvePublicMapMarkerRelevanceTier(13)).toBe(2)
    expect(resolvePublicMapMarkerRelevanceTier(15)).toBe(3)
  })

  it("filters normal pins by relevance while keeping saved pins separate", () => {
    expect(
      resolveRelevantUnselectedPointFilter({
        maxRelevanceTier: 1,
        selectedOrganizationId: null,
      })
    ).toEqual([
      "all",
      ["!", ["has", "point_count"]],
      ["<=", ["get", "markerRelevanceTier"], 1],
      ["!=", ["get", "isSaved"], true],
    ])
    expect(resolveSavedPointFilter({ selectedOrganizationId: null })).toEqual([
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "isSaved"], true],
    ])
  })
})
