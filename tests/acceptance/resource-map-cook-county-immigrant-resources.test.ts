import { describe, expect, it } from "vitest"

import {
  buildCensusGeocodeUrl,
  buildCookCountyImmigrantResourceRecord,
} from "../../scripts/resource-map/lib/cook-county-immigrant-resources.mjs"

describe("Cook County immigrant-service directory ingestion", () => {
  it("maps current directory rows into provider-linked resource records", () => {
    const record = buildCookCountyImmigrantResourceRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      geocode: {
        addressComponents: { city: "CHICAGO", state: "IL", zip: "60618" },
        coordinates: { x: -87.69, y: 41.96 },
      },
      row: {
        address: "4300 N California Ave, Chicago, IL 60618",
        communityServed: "Korean, Asian American, Multi-ethnic",
        name: "Hana Center",
        serviceArea: "Cook and Northwest Suburbs",
        services:
          "Immigration and legal services\nWorkforce empowerment\nPublic benefits assistance\nHousing counseling\nMental health counseling",
        website: "https://hanacenter.org",
      },
    })

    expect(record).toMatchObject({
      sourceId: "cook-county-immigrant-refugee-organizations",
      sourceType: "government_provider_directory",
      extractedFields: {
        city: "Chicago",
        latitude: 41.96,
        longitude: -87.69,
        primaryResourceCategory: "legal_immigration",
        resourceCategories: expect.arrayContaining([
          "legal_immigration",
          "finance_public_benefits",
          "health_mental_health",
          "employment_workforce_development",
        ]),
        title: "Hana Center",
        websiteUrl: "https://hanacenter.org",
      },
    })
    expect(record.extractedFields.description.length).toBeGreaterThanOrEqual(80)
    expect(record.extractedFields.enrichment.verification.status).toBe(
      "needs_review"
    )
  })

  it("builds deterministic public Census geocoder URLs", () => {
    const url = buildCensusGeocodeUrl(
      "115 West Chicago Avenue, Chicago, IL 60654"
    )
    expect(url).toContain("geocoding.geo.census.gov")
    expect(url).toContain("benchmark=Public_AR_Current")
    expect(url).toContain("format=json")
  })

  it("classifies New Americans and advocacy work with useful categories", () => {
    const newAmericans = buildCookCountyImmigrantResourceRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      row: {
        name: "Immigrant Family Network",
        services: "Healthcare Access New Americans Democracy Project",
        website: "https://example.org/new-americans",
      },
    })
    const advocacy = buildCookCountyImmigrantResourceRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      row: {
        name: "Community Voice",
        services: "Policy advocacy and civic engagement",
        website: "https://example.org/advocacy",
      },
    })

    expect(newAmericans.extractedFields.primaryResourceCategory).toBe(
      "legal_immigration"
    )
    expect(advocacy.extractedFields.primaryResourceCategory).toBe(
      "community_community_organizing"
    )
  })

  it("holds directory identities that do not name a specific service", () => {
    const record = buildCookCountyImmigrantResourceRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      row: {
        name: "Community Organization",
        website: "https://example.org",
      },
    })

    expect(record.extractedFields.enrichment.publicResourceEligible).toBe(false)
  })
})
