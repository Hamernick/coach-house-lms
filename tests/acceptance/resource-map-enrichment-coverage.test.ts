import { describe, expect, it } from "vitest"

import {
  analyzeRecordCoverage,
  summarizeEnrichmentCoverage,
} from "../../scripts/resource-map/lib/enrichment-coverage.mjs"

function completeRecord(sourceId = "official-source") {
  return {
    sourceId,
    sourceRecordId: `${sourceId}-1`,
    sourceUrl: "https://data.example.gov/records/1",
    extractedFields: {
      accessInstructions: "Visit the listed location during posted hours.",
      description:
        "This official location provides a public cooling space during the schedule published by the provider.",
      eligibility:
        "The source does not state additional eligibility requirements.",
      latitude: 41.88,
      longitude: -87.63,
      phone: "312-555-0100",
      resourceCategories: ["emergency_cooling_centers", "environment"],
      serviceTitle: "Example Cooling Center",
      title: "Example Cooling Center",
      enrichment: {
        sourceComparisonCount: 2,
        verification: {
          contradictions: [],
          status: "approved",
          unsupportedClaims: [],
        },
      },
    },
  }
}

describe("resource map enrichment coverage", () => {
  it("counts a record only when every core field and verification gate is filled", () => {
    const result = analyzeRecordCoverage(completeRecord())

    expect(result.complete).toBe(true)
    expect(result.publishable).toBe(true)
    expect(Object.values(result.metrics).every(Boolean)).toBe(true)
  })

  it("keeps technical source URLs from satisfying contact or provider-link coverage", () => {
    const record: any = completeRecord()
    record.extractedFields.phone = null
    record.extractedFields.websiteUrl =
      "https://services.example.gov/arcgis/rest/services/cooling/query"

    const result = analyzeRecordCoverage(record)

    expect(result.metrics.contactOrLink).toBe(false)
    expect(result.complete).toBe(false)
  })

  it("reports exact totals by source", () => {
    const incomplete: any = completeRecord("second-source")
    incomplete.extractedFields.eligibility = null

    const summary = summarizeEnrichmentCoverage([completeRecord(), incomplete])

    expect(summary.total).toMatchObject({
      complete: 1,
      publishable: 1,
      total: 2,
    })
    expect(summary.total.metrics.eligibility).toBe(1)
    expect(summary.sources).toHaveLength(2)
  })
})
