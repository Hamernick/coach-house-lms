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
}: {
  category?: PublicMapResourceCategoryKey
  id: string
  latitude: number
  longitude: number
  organizationIds?: string
  verificationStatus?: "external_data" | "verified_platform"
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
    },
  }
}

describe("public map marker relevance", () => {
  it("shows three nearby category markers on the overview globe", () => {
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

    expect(countAtTier(0)).toBe(3)
    expect(countAtTier(1)).toBe(3)
    expect(countAtTier(2)).toBe(3)
    expect(countAtTier(3)).toBe(4)
    expect(
      new Set(
        relevant.map((feature) => feature.properties.markerOverviewOffsetIndex)
      ).size
    ).toBe(4)
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
