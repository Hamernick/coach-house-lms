import { readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const MODULE = join(
  process.cwd(),
  "scripts/resource-map/lib/community-resource-enrichment.mjs"
)
const NOW = "2026-07-14T21:00:00.000Z"

function record(overrides: Record<string, unknown> = {}) {
  return {
    extractedFields: {
      address: "4537 South Ashland Avenue",
      description: "social_facility",
      organizationName: "Casa Catalina",
      primaryResourceCategory: "food_food_pantries",
      resourceCategories: ["food_food_pantries", "food"],
      sourceUrl: "https://overpass-api.de/api/interpreter?data=food",
      title: "Casa Catalina",
      websiteUrl: null,
    },
    lastVerifiedAt: null,
    needsReview: true,
    qualityFlags: [{ code: "low_trust", severity: "review" }],
    rawSnapshot: {
      amenity: "social_facility",
      category: "food_bank; social_facility",
      name: "Casa Catalina",
      social_facility: "food_bank",
    },
    reasonCodes: ["community_source", "recent_fetch"],
    sourceId: "chicago-osm-food-access",
    sourceRecordId: "osm:node:4641398471",
    sourceUrl: "https://overpass-api.de/api/interpreter?data=food",
    ...overrides,
  }
}

describe("community and reference source enrichment", () => {
  it("recognizes only the supported source cohorts and leaves other records untouched", async () => {
    const { enrichCommunityResourceRecord, isCommunityResourceRecord } =
      await import(pathToFileURL(MODULE).href)
    const other = record({ sourceId: "chicago-socrata-public-libraries" })

    expect(isCommunityResourceRecord(record())).toBe(true)
    expect(isCommunityResourceRecord(other)).toBe(false)
    expect(enrichCommunityResourceRecord({ now: NOW, record: other })).toBe(
      other
    )
  })

  it("turns retained OSM tags into useful fields without approving the record", async () => {
    const { enrichCommunityResourceRecord } = await import(
      pathToFileURL(MODULE).href
    )
    const original = record({
      rawSnapshot: {
        amenity: "social_facility",
        category: "food_bank; social_facility",
        name: "Casa Catalina",
        phone: "  (773) 555-0100  ",
        social_facility: "food_bank",
        website: "https://casacatalina.org/",
      },
    })
    const enriched = enrichCommunityResourceRecord({
      now: NOW,
      record: original,
    })

    expect(enriched).toMatchObject({
      lastEnrichedAt: NOW,
      lastVerifiedAt: null,
      needsReview: true,
      qualityFlags: original.qualityFlags,
      reasonCodes: original.reasonCodes,
      extractedFields: {
        accessInstructions: expect.stringContaining("before visiting"),
        description: expect.stringContaining("retained OpenStreetMap data"),
        phone: "(773) 555-0100",
        primaryResourceCategory: "food_food_pantries",
        resourceCategories: ["food_food_pantries", "food"],
        serviceTitle: "Casa Catalina",
        websiteUrl: "https://casacatalina.org",
        enrichment: {
          sourceComparisonCount: 1,
          verification: {
            status: "needs_review",
            requiredCorrections: expect.arrayContaining([
              expect.stringContaining("administrator must verify"),
            ]),
          },
        },
      },
    })
    expect(enriched.fieldEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceType: "derived",
          sourceUrl: original.sourceUrl,
          transformation: "retained_evidence_community_enrichment",
        }),
      ])
    )
  })

  it("normalizes OSM community centres separately from libraries", async () => {
    const { enrichCommunityResourceRecord } = await import(
      pathToFileURL(MODULE).href
    )
    const enriched = enrichCommunityResourceRecord({
      now: NOW,
      record: record({
        extractedFields: {
          address: "100 South State Street",
          description: "community_centre",
          title: "Neighborhood Hub",
        },
        rawSnapshot: {
          amenity: "community_centre",
          category: "sports_centre; community_centre",
          name: "Neighborhood Hub",
        },
        sourceId: "chicago-osm-community-libraries",
      }),
    })

    expect(enriched.extractedFields).toMatchObject({
      category: "community",
      primaryResourceCategory: "community_community_centers",
      resourceCategories: [
        "community_community_centers",
        "community_sports",
        "community",
      ],
    })
  })

  it("uses distinct Wikidata provider contacts but not the Wikidata entity URL", async () => {
    const { enrichCommunityResourceRecord } = await import(
      pathToFileURL(MODULE).href
    )
    const enriched = enrichCommunityResourceRecord({
      now: NOW,
      record: record({
        extractedFields: {
          description: "public high school in Chicago",
          sourceUrl: "http://www.wikidata.org/entity/Q1",
          title: "Example High School",
          websiteUrl: "http://school.example.org/",
        },
        rawSnapshot: {
          category: "school",
          description: "public high school in Chicago",
          name: "Example High School",
          sourceUrl: "http://www.wikidata.org/entity/Q1",
          website: "http://school.example.org/",
        },
        sourceId: "chicago-wikidata-public-resources",
        sourceUrl: "http://www.wikidata.org/entity/Q1",
      }),
    })

    expect(enriched.extractedFields).toMatchObject({
      description: expect.stringContaining("Retained Wikidata data"),
      primaryResourceCategory: "education",
      resourceCategories: ["education"],
      websiteUrl: "http://school.example.org",
      enrichment: { verification: { status: "needs_review" } },
    })
    expect(enriched.extractedFields.websiteUrl).not.toContain("wikidata.org")
  })

  it("keeps stale or closed Fridge Finder records manually review-blocked", async () => {
    const { enrichCommunityResourceRecord } = await import(
      pathToFileURL(MODULE).href
    )
    const enriched = enrichCommunityResourceRecord({
      now: NOW,
      record: record({
        extractedFields: {
          address: "98 Richards Street",
          title: "Example Community Fridge",
          websiteUrl: null,
        },
        rawSnapshot: {
          address: "98 Richards Street",
          availabilityStatus: "closed",
          category: "Community Fridges",
          latestFridgeReport: {
            condition: "ghost",
            timestamp: "2026-01-30T23:06:53Z",
          },
          sourceUrl: "https://www.fridgefinder.app/fridge/example",
          title: "Example Community Fridge",
          verified: true,
        },
        reasonCodes: ["community_source", "stale_source"],
        sourceId: "nyc-fridgefinder-community-fridges",
        sourceUrl: "https://www.fridgefinder.app/fridge/example",
      }),
    })

    expect(enriched).toMatchObject({
      needsReview: true,
      reasonCodes: ["community_source", "stale_source"],
      extractedFields: {
        accessInstructions: expect.stringContaining("Do not rely"),
        description: expect.stringContaining('marked it "ghost" on 2026-01-30'),
        primaryResourceCategory: "food_community_fridges",
        websiteUrl: null,
        enrichment: {
          verification: {
            status: "needs_review",
            requiredCorrections: expect.arrayContaining([
              "Refresh the stale source evidence before publication.",
            ]),
          },
        },
      },
    })
    expect(enriched.lastVerifiedAt).toBeNull()
  })

  it("keeps source and locator URLs as private evidence rather than public actions", async () => {
    const { enrichCommunityResourceRecord } = await import(
      pathToFileURL(MODULE).href
    )
    const sourceUrl = "https://www.thelovefridge.com/find-a-fridge"
    const enriched = enrichCommunityResourceRecord({
      now: NOW,
      record: record({
        extractedFields: {
          address: "S Bishop St & W 72nd St",
          title: "West Englewood Fridge",
          websiteUrl: sourceUrl,
        },
        rawSnapshot: {
          address: "S Bishop St & W 72nd St",
          category: "Community Fridges",
          organizationName: "The Love Fridge Chicago",
          sourceUrl,
          title: "West Englewood Fridge",
          websiteUrl: sourceUrl,
        },
        sourceId: "chicago-love-fridge-community-fridges",
        sourceUrl,
      }),
    })

    expect(enriched.extractedFields).toMatchObject({
      intakeUrl: null,
      organizationName: "The Love Fridge Chicago",
      providerName: "The Love Fridge Chicago",
      websiteUrl: null,
    })
    expect(
      enriched.extractedFields.enrichment.draft.citations[0].sourceUrl
    ).toBe(sourceUrl)
  })

  it("is deterministic and contains no network or approval path", () => {
    const source = readFileSync(MODULE, "utf8")

    expect(source).not.toContain("fetch(")
    expect(source).not.toContain("OPENAI_API_KEY")
    expect(source).not.toContain('status: "approved"')
    expect(source).toContain(
      "export const COMMUNITY_RESOURCE_ENRICHMENT_METHOD_VERSION"
    )
  })
})
