import { describe, expect, it } from "vitest"

import {
  buildPublicMapListItems,
  warmPublicMapListItemSearchCache,
} from "@/components/public/public-map-index/map-items-state"
import {
  resolvePublicMapCategorySearchIntent,
  resolvePublicMapGuideSearchIntent,
} from "@/components/public/public-map-index/search-shortcuts"
import {
  normalizePublicMapSearchText,
  tokenizePublicMapSearchQuery,
} from "@/components/public/public-map-index/search-text"
import type { PublicMapResourceGuide } from "@/components/public/public-map-index/resource-guide-model"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

function buildResource(
  overrides: Partial<ExternalResourceMapItem> = {}
): ExternalResourceMapItem {
  return {
    id: "resource-1",
    itemType: "external_resource",
    title: "Community Resource",
    subtitle: null,
    description: null,
    latitude: 41.8781,
    longitude: -87.6298,
    address: null,
    addressStreet: null,
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["community"],
    primaryResourceCategory: "community",
    verificationStatus: "external_data",
    sourceLabel: null,
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "published",
    ...overrides,
  }
}

describe("public map search quality", () => {
  it("normalizes Unicode, punctuation, diacritics, and repeated terms", () => {
    expect(normalizePublicMapSearchText("  Clínica & Niño’s—Care  ")).toBe(
      "clinica and ninos care"
    )
    expect(tokenizePublicMapSearchQuery("Dental, dental care")).toEqual([
      "dental",
      "care",
    ])
  })

  it("requires all query tokens across indexed fields and ranks exact titles first", () => {
    const exact = buildResource({
      id: "exact",
      title: "Dental Care",
      primaryResourceCategory: "health_dental",
      resourceCategories: ["health", "health_dental"],
    })
    const locationMatch = buildResource({
      id: "location-match",
      title: "Community Dental Clinic",
      city: "New York",
      state: "NY",
      primaryResourceCategory: "health_dental",
      resourceCategories: ["health", "health_dental"],
    })
    const missingLocation = buildResource({
      id: "missing-location",
      title: "Neighborhood Dental Clinic",
      primaryResourceCategory: "health_dental",
      resourceCategories: ["health", "health_dental"],
    })

    const dentalCareResults = buildPublicMapListItems({
      items: [locationMatch, exact, missingLocation],
      query: "dental care",
    })
    expect(dentalCareResults[0]?.id).toBe("exact")
    expect(
      buildPublicMapListItems({
        items: [missingLocation, locationMatch],
        query: "dental new york",
      }).map((item) => item.id)
    ).toEqual(["location-match"])
    expect(
      buildPublicMapListItems({
        items: [exact, locationMatch, missingLocation],
        query: "dental unavailable-term",
      })
    ).toEqual([])
  })

  it("matches diacritic-free queries and resolves category and guide shortcuts", () => {
    const clinic = buildResource({ id: "clinic", title: "Clínica Niño" })
    expect(
      buildPublicMapListItems({ items: [clinic], query: "clinica nino" })
    ).toEqual([clinic])
    expect(resolvePublicMapCategorySearchIntent("Find food nearby")?.key).toBe(
      "food"
    )

    const guides = [
      {
        id: "chicago-health-care",
        title: "Chicago Health Care",
        subtitle: "Health services",
        kicker: "Chicago guide",
        itemCount: 12,
        items: [clinic],
        primaryResourceCategory: "health",
        visualVariant: "city",
      },
    ] satisfies PublicMapResourceGuide[]
    expect(
      resolvePublicMapGuideSearchIntent({
        guides,
        query: "chicago health",
      })?.id
    ).toBe("chicago-health-care")
  })

  it("keeps warmed 5,000-item searches within the local result budget", () => {
    const items = Array.from({ length: 5_000 }, (_, index) =>
      buildResource({
        id: `resource-${index}`,
        title:
          index % 20 === 0
            ? `Dental Care ${index}`
            : `Community Resource ${index}`,
        city: index % 2 === 0 ? "New York" : "Chicago",
        state: index % 2 === 0 ? "NY" : "IL",
        primaryResourceCategory:
          index % 20 === 0 ? "health_dental" : "community",
        resourceCategories:
          index % 20 === 0 ? ["health", "health_dental"] : ["community"],
      })
    )
    warmPublicMapListItemSearchCache(items)

    const startedAt = performance.now()
    const results = buildPublicMapListItems({
      items,
      query: "dental new york",
    })
    const durationMs = performance.now() - startedAt

    expect(results).toHaveLength(250)
    expect(durationMs).toBeLessThan(250)
  })
})
