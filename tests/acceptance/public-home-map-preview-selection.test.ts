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
  it("chooses a deterministic geographically spread preview", () => {
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
    ).toEqual([0, 1, 2, 3])
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

  it("balances category groups before repeating them", () => {
    const selected = selectHomeMapPreviewFeatures(
      [
        ...Array.from({ length: 8 }, (_, index) =>
          buildFeature({
            category: "food_food_pantries",
            id: `food-${index}`,
            latitude: 40 + index,
            longitude: -120 + index * 8,
          })
        ),
        buildFeature({
          category: "health_primary_care",
          id: "health",
          latitude: 41.88,
          longitude: -87.63,
        }),
        buildFeature({
          category: "legal_legal_aid",
          id: "legal",
          latitude: 41.89,
          longitude: -87.64,
        }),
      ],
      3
    )

    expect(
      new Set(
        selected.map(
          (feature) => feature.properties.primaryResourceCategory.split("_")[0]
        )
      )
    ).toEqual(new Set(["food", "health", "legal"]))
  })
})
