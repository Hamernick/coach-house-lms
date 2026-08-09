import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const ENRICHMENT = join(
  ROOT,
  "scripts/resource-map/lib/cooling-center-enrichment.mjs"
)
const NOW = "2026-07-14T20:00:00.000Z"
const TECHNICAL_SOURCE =
  "https://services1.arcgis.com/example/arcgis/rest/services/Cooling/FeatureServer/0/query?where=1%3D1&f=json"

function record(overrides: Record<string, unknown> = {}) {
  return {
    attribution: "Baltimore City",
    extractedFields: {
      address: "3601 Eastern Ave",
      hours: {
        exceptions: [],
        label: "Normal business hours varies by site",
        schemaVersion: 1,
        weekly: [],
      },
      latitude: 39.2864,
      longitude: -76.5666,
      title: "Southeast Anchor",
    },
    rawSnapshot: {
      ADDRESS: "3601 Eastern Ave",
      CITY: "BALTIMORE",
      NAME: "Southeast Anchor",
      Open_Hrs: "Normal business hours varies by site",
      URL: "https://health.baltimorecity.gov/coderedinfo",
    },
    sourceId: "baltimore-arcgis-code-red-cooling-centers",
    sourceName: "Baltimore City - Code Red Cooling Centers",
    sourceRecordId: "source-record-1",
    sourceUrl: TECHNICAL_SOURCE,
    termsNotes:
      "Official Baltimore City Code Red cooling-center feature service.",
    ...overrides,
  }
}

describe("official cooling and heat source enrichment", () => {
  it("selects only the intended non-NYC ArcGIS and Socrata cohort", async () => {
    const { isCoolingCenterRecord } = await import(
      pathToFileURL(ENRICHMENT).href
    )

    expect(isCoolingCenterRecord(record())).toBe(true)
    expect(
      isCoolingCenterRecord(
        record({ sourceId: "chicago-socrata-cooling-centers" })
      )
    ).toBe(true)
    expect(
      isCoolingCenterRecord(record({ sourceId: "nyc-arcgis-cooling-centers" }))
    ).toBe(false)
    expect(
      isCoolingCenterRecord(
        record({ sourceId: "chicago-socrata-public-libraries" })
      )
    ).toBe(false)
    expect(
      isCoolingCenterRecord(record({ sourceId: "chicago-osm-food-access" }))
    ).toBe(false)
    expect(
      isCoolingCenterRecord(
        record({ sourceId: "chicago-wikidata-public-resources" })
      )
    ).toBe(false)
    expect(
      isCoolingCenterRecord(
        record({ sourceId: "chicago-love-fridge-community-fridges" })
      )
    ).toBe(false)
  })

  it("builds a source-grounded current-season record without current-state claims", async () => {
    const {
      COOLING_CENTER_ENRICHMENT_METHOD_VERSION,
      enrichCoolingCenterRecord,
    } = await import(pathToFileURL(ENRICHMENT).href)
    const enriched = enrichCoolingCenterRecord({ now: NOW, record: record() })

    expect(COOLING_CENTER_ENRICHMENT_METHOD_VERSION).toBe(
      "official-cooling-heat-source-v1"
    )
    expect(enriched).toMatchObject({
      lastVerifiedAt: NOW,
      extractedFields: {
        accessInstructions: expect.stringContaining(
          "confirm current activation"
        ),
        availabilityStatus: "seasonal",
        cost: "The source does not state a cost for using this location.",
        description: expect.stringContaining(
          "does not confirm current activation or open status"
        ),
        eligibility:
          "The source does not state eligibility requirements for this location.",
        organizationName: "Baltimore City",
        primaryResourceCategory: "emergency_cooling_centers",
        serviceTitle: "Southeast Anchor — Cooling Center",
        timezone: "America/New_York",
        websiteUrl: "https://health.baltimorecity.gov/coderedinfo",
        enrichment: {
          passes: [
            expect.objectContaining({ name: "retained_raw_field_comparison" }),
            expect.objectContaining({
              name: "claim_and_citation_verification",
            }),
          ],
          publicationBlockers: [],
          sourceComparisonCount: 2,
          verification: {
            contradictions: [],
            status: "approved",
            unsupportedClaims: [],
          },
        },
      },
    })
    expect(enriched.extractedFields.description).not.toMatch(
      /\b(?:currently open|open now|free|no eligibility)\b/iu
    )
    expect(
      enriched.extractedFields.enrichment.draft.citations[0]
    ).toMatchObject({
      sourceUrl: TECHNICAL_SOURCE,
      claimPaths: expect.arrayContaining([
        "publicSummary",
        "eligibility",
        "availability",
        "cost",
      ]),
    })
    expect(enriched.fieldEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldPath: "extractedFields.description",
          sourceUrl: TECHNICAL_SOURCE,
          transformation: "source_specific_deterministic_enrichment",
        }),
      ])
    )
  })

  it("uses explicit eligibility evidence but never treats source Open as current", async () => {
    const { enrichCoolingCenterRecord } = await import(
      pathToFileURL(ENRICHMENT).href
    )
    const enriched = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        attribution: "Palm Springs Region",
        extractedFields: {
          address: "123 Main St",
          latitude: 33.8,
          longitude: -116.5,
          title: "Senior Center",
        },
        rawSnapshot: {
          Additional_Notes: "Seniors only (55+)",
          Address: "123 Main St",
          Name: "Senior Center",
          Phone_Number: "951-555-0100",
          Status: "Open",
        },
        sourceId: "palm-springs-arcgis-cooling-centers",
        sourceName: "Palm Springs Region - Cooling Centers",
      }),
    })

    expect(enriched.extractedFields).toMatchObject({
      availabilityStatus: "seasonal",
      eligibility: "The source limits this location to people age 55 or older.",
      organizationName: "Senior Center",
      phone: "951-555-0100",
    })
    expect(enriched.extractedFields.availabilityNotes).toContain(
      "does not confirm"
    )
    expect(enriched.extractedFields.availabilityNotes).not.toContain("is open")
  })

  it("preserves stale seasonal, explicit closure, and field-conflict blockers", async () => {
    const { enrichCoolingCenterRecord } = await import(
      pathToFileURL(ENRICHMENT).href
    )
    const stale = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        sourceId: "buena-park-arcgis-cooling-centers-2025",
      }),
    })
    const closed = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        rawSnapshot: {
          USER_Address: "100 Main St",
          USER_Name: "Closed Center",
          USER_Phone: "202-555-0100",
          USER_Status: "Closed until further notice.",
        },
        sourceId: "dc-arcgis-cooling-centers",
        sourceName: "District of Columbia - Cooling Centers",
      }),
    })
    const conflicted = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        duplicateCandidate: { conflicts: ["hours"], reviewNeeded: true },
      }),
    })
    const normalizedConflict = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        extractedFields: {
          address: "3601 Eastern Ave",
          dedupe: {
            conflicts: ["hours"],
            reviewNeeded: true,
            status: "candidate",
          },
          latitude: 39.2864,
          longitude: -76.5666,
          title: "Southeast Anchor",
        },
      }),
    })

    expect(stale.lastVerifiedAt).toBeNull()
    expect(stale.extractedFields.enrichment.publicationBlockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "seasonal_source_not_currently_verified",
        }),
      ])
    )
    expect(closed.extractedFields).toMatchObject({
      availabilityStatus: "closed",
      enrichment: {
        verification: {
          contradictions: expect.arrayContaining([
            expect.stringContaining("Closed until further notice"),
          ]),
          status: "needs_review",
        },
      },
    })
    expect(conflicted.extractedFields.enrichment.publicationBlockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unresolved_duplicate_match" }),
        expect.objectContaining({ code: "unresolved_field_conflict" }),
      ])
    )
    expect(
      normalizedConflict.extractedFields.enrichment.publicationBlockers
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unresolved_duplicate_match" }),
        expect.objectContaining({ code: "unresolved_field_conflict" }),
      ])
    )
  })

  it("keeps contactless secondary listings blocked and technical URLs private", async () => {
    const { enrichCoolingCenterRecord } = await import(
      pathToFileURL(ENRICHMENT).href
    )
    const enriched = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        attribution: "PG&E",
        extractedFields: {
          address: "260 W 11th Ave, Delano, CA 93215",
          latitude: 35.76,
          longitude: -119.26,
          title: "City of Delano",
        },
        rawSnapshot: {
          FIELD_NAME_B: "City of Delano",
          FIELD_NAME_E: "260 W 11th Ave, Delano, CA 93215",
          FIELD_NAME_R: "M-F 3PM - 7PM",
        },
        sourceId: "pge-arcgis-california-cooling-centers-2026",
        sourceName: "PG&E - California Cooling Centers 2026",
      }),
    })

    expect(enriched.lastVerifiedAt).toBeNull()
    expect(enriched.extractedFields).toMatchObject({
      links: [],
      websiteUrl: null,
      enrichment: {
        verification: { status: "needs_review" },
      },
    })
    expect(enriched.extractedFields.enrichment.publicationBlockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_actionable_contact" }),
        expect.objectContaining({
          code: "secondary_source_requires_provider_confirmation",
        }),
      ])
    )
  })

  it("does not treat directions or hosted images as provider contact links", async () => {
    const { enrichCoolingCenterRecord } = await import(
      pathToFileURL(ENRICHMENT).href
    )
    const directionsOnly = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        attribution:
          "Cook County Department of Emergency Management and Regional Security",
        extractedFields: {
          address: "7850 W. 183rd St.",
          latitude: 41.55,
          links: [
            {
              type: "resource",
              url: "https://www.google.com/maps/dir/?api=1&destination=7850+W+183rd+St",
            },
          ],
          longitude: -87.81,
          title: "Tinley Park",
        },
        rawSnapshot: { Name: "Tinley Park" },
        sourceId: "cook-county-socrata-cooling-centers",
        sourceName: "Cook County - Cooling Centers",
      }),
    })
    const imageOnly = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        attribution: "Broward County",
        extractedFields: {
          latitude: 26.16,
          longitude: -80.14,
          title: "Example Library",
          websiteUrl:
            "https://lh3.googleusercontent.com/example=s680-w680-h510-rw",
        },
        rawSnapshot: { Name: "Example Library" },
        sourceId: "broward-arcgis-cooling-centers",
        sourceName: "Broward County - Cooling Centers",
      }),
    })

    expect(directionsOnly.extractedFields.links).toEqual([
      expect.objectContaining({ label: "Directions", type: "resource" }),
    ])
    expect(imageOnly.extractedFields.links).toEqual([])
    for (const enriched of [directionsOnly, imageOnly]) {
      expect(enriched.lastVerifiedAt).toBeNull()
      expect(enriched.extractedFields.enrichment.publicationBlockers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "missing_actionable_contact" }),
        ])
      )
    }
  })

  it("labels hydration records accurately without calling them indoor cooling centers", async () => {
    const { enrichCoolingCenterRecord } = await import(
      pathToFileURL(ENRICHMENT).href
    )
    const enriched = enrichCoolingCenterRecord({
      now: NOW,
      record: record({
        extractedFields: {
          address: "OUTDOOR",
          latitude: 40.08,
          longitude: -75.06,
          title: "Park Fountain",
        },
        rawSnapshot: {
          AMENITY_NAME: "Park Fountain",
          LOCATION: "OUTDOOR",
          STATION_TYPE: "FOUNTAIN",
        },
        sourceId: "philadelphia-arcgis-high-heat-cooling-resources",
        sourceName: "Philadelphia - High Heat Cooling Resources",
      }),
    })

    expect(enriched.extractedFields).toMatchObject({
      address: null,
      primaryResourceCategory: "environment",
      resourceCategories: ["environment", "community"],
      serviceTitle: "Park Fountain — Water Fountain",
      serviceOfferings: ["Water Fountain"],
    })
    expect(enriched.extractedFields.description).toContain("water fountain")
    expect(enriched.extractedFields.description).not.toContain(
      "indoor cooling center"
    )
  })
})
