import { describe, expect, it } from "vitest"

import { selectHomeMapPreviewFeatures } from "@/lib/public-map/home-map-preview"
import type { PublicMapPointFeature } from "@/lib/public-map/public-map-geojson"
import type { PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"

function buildFeature({
  id,
  latitude,
  longitude,
  category = "community",
}: {
  category?: PublicMapResourceCategoryKey
  id: string
  latitude: number
  longitude: number
}): PublicMapPointFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [longitude, latitude] },
    properties: {
      designation: "Resource",
      itemId: id,
      itemType: "external_resource",
      markerAccentColor: "#2563eb",
      markerImageKey: `marker-${id}`,
      markerImageUrl: null,
      markerStyleKey: "standard",
      name: id,
      organizationId: id,
      organizationIds: id,
      primaryGroup: "community",
      primaryResourceCategory: category,
      sameLocationCount: 1,
      sameLocationKey: id,
      sameLocationLabel: null,
      verificationStatus: "external_data",
    },
  }
}

describe("public home map preview selection", () => {
  it("chooses a deterministic geographically anchored preview", () => {
    const corners = [
      buildFeature({ id: "northwest", latitude: 60, longitude: -120 }),
      buildFeature({ id: "northeast", latitude: 60, longitude: 120 }),
      buildFeature({ id: "southwest", latitude: 20, longitude: -120 }),
      buildFeature({ id: "southeast", latitude: 20, longitude: 120 }),
    ]
    const clustered = Array.from({ length: 12 }, (_, index) =>
      buildFeature({
        id: `center-${index}`,
        latitude: 40 + index / 1_000,
        longitude: -95 + index / 1_000,
      })
    )

    const selected = selectHomeMapPreviewFeatures([...clustered, ...corners], 4)
    const repeated = selectHomeMapPreviewFeatures([...clustered, ...corners], 4)

    expect(selected.map((feature) => feature.properties.itemId)).toEqual(
      repeated.map((feature) => feature.properties.itemId)
    )
    expect(
      new Set(selected.map((feature) => feature.properties.itemId))
    ).toEqual(new Set(corners.map((feature) => feature.properties.itemId)))
    expect(
      selected.map((feature) => feature.properties.markerOverviewOffsetIndex)
    ).toEqual([0, 0, 0, 0])
  })

  it("excludes invalid coordinates", () => {
    const selected = selectHomeMapPreviewFeatures([
      buildFeature({ id: "valid", latitude: 41.88, longitude: -87.63 }),
      buildFeature({ id: "origin", latitude: 0, longitude: 0 }),
      buildFeature({ id: "invalid", latitude: 95, longitude: -87.63 }),
    ])

    expect(selected.map((feature) => feature.properties.itemId)).toEqual([
      "valid",
    ])
  })

  it("prioritizes geographic spread over category balancing", () => {
    const selected = selectHomeMapPreviewFeatures(
      [
        buildFeature({
          category: "food_food_pantries",
          id: "food-west",
          latitude: 40,
          longitude: -120,
        }),
        buildFeature({
          category: "food_food_pantries",
          id: "food-east",
          latitude: 40,
          longitude: -70,
        }),
        buildFeature({
          category: "health_primary_care",
          id: "health",
          latitude: 40,
          longitude: -95,
        }),
        buildFeature({
          category: "legal_legal_aid",
          id: "legal",
          latitude: 40.01,
          longitude: -95.01,
        }),
      ],
      2
    )

    expect(
      new Set(selected.map((feature) => feature.properties.itemId))
    ).toEqual(new Set(["food-west", "food-east"]))
  })
})
