import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { analyzeResourceEnrichmentReadiness } from "../../scripts/resource-map/lib/enrichment-quality.mjs"

const ROOT = process.cwd()
const AUDIT_SCRIPT = join(
  ROOT,
  "scripts/resource-map/audit-enrichment-readiness.mjs"
)
const PROMOTION_SCRIPT = join(
  ROOT,
  "scripts/resource-map/promote-approved-records.mjs"
)

function withFixture(callback: (input: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "resource-enrichment-"))
  const input = join(directory, "records.jsonl")
  const records = [
    {
      sourceRecordId: "library-incomplete",
      sourceName: "Chicago Data Portal - Public library locations and hours",
      sourceUrl: "https://data.cityofchicago.org/resource/x8fc-8rcq.json",
      extractedFields: {
        title: "Humboldt Park",
        address: "1605 N. Troy Street, Chicago, IL 60647",
        category: "community_libraries",
      },
    },
    {
      sourceRecordId: "library-verified",
      sourceName: "Chicago Public Library",
      sourceUrl: "https://www.chipublib.org/locations/36/",
      extractedFields: {
        serviceTitle: "Humboldt Park Branch",
        description:
          "Chicago Public Library's Humboldt Park Branch provides books, computers, Wi-Fi, printing, study space, and local learning support.",
        eligibility:
          "The branch is open to the public; borrowing requires an eligible library card.",
        accessInstructions:
          "Visit during posted hours, call the branch, or use the official branch page for current services and appointments.",
        websiteUrl: "https://www.chipublib.org/locations/36/",
        address: "1605 N. Troy Street, Chicago, IL 60647",
        hours: { label: "See the official branch page for current hours." },
        enrichment: {
          sourceComparisonCount: 2,
          verification: {
            status: "approved",
            contradictions: [],
            unsupportedClaims: [],
          },
        },
      },
    },
  ]
  writeFileSync(
    input,
    records.map((record) => JSON.stringify(record)).join("\n")
  )

  try {
    callback(input)
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

describe("resource map enrichment quality", () => {
  it("holds provider identities that do not name a public service", () => {
    const result = analyzeResourceEnrichmentReadiness({
      sourceUrl: "https://example.org/directory",
      extractedFields: {
        accessInstructions: "Review the provider website before visiting.",
        city: "Chicago",
        description:
          "This provider appears in an official directory, but the directory does not identify an individual public service.",
        eligibility: "The source does not state eligibility.",
        enrichment: {
          publicResourceEligible: false,
          sourceComparisonCount: 2,
          verification: {
            contradictions: [],
            status: "approved",
            unsupportedClaims: [],
          },
        },
        serviceTitle: "Provider identity",
        websiteUrl: "https://example.org",
      },
    })

    expect(result.publishable).toBe(false)
    expect(result.blockingGaps.map((gap) => gap.code)).toContain(
      "missing_specific_public_service"
    )
  })

  it("audits ambiguous raw records and accepts verified source-backed records", () => {
    withFixture((input) => {
      const output = execFileSync(
        process.execPath,
        [AUDIT_SCRIPT, "--input", input, "--json"],
        { cwd: ROOT, encoding: "utf8" }
      )
      const report = JSON.parse(output)

      expect(report.summary).toMatchObject({
        publishableRecords: 1,
        totalRecords: 2,
      })
      expect(report.summary.gapCounts).toMatchObject({
        ambiguous_library_title: 1,
        enrichment_not_verified: 1,
        insufficient_source_comparisons: 1,
        missing_access_instructions: 1,
        missing_eligibility: 1,
        missing_public_summary: 1,
      })
      expect(report.results[0].publishable).toBe(false)
      expect(report.results[1].publishable).toBe(true)
    })
  })

  it("fails strict publication audits when any record remains incomplete", () => {
    withFixture((input) => {
      expect(() =>
        execFileSync(
          process.execPath,
          [AUDIT_SCRIPT, "--input", input, "--require-publishable"],
          { cwd: ROOT, encoding: "utf8" }
        )
      ).toThrow()
    })
  })

  it("locks every promotion behind the enrichment contract", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    const promotionSource = readFileSync(PROMOTION_SCRIPT, "utf8")

    expect(packageJson.scripts["resource-map:audit-enrichment"]).toBe(
      "node scripts/resource-map/audit-enrichment-readiness.mjs"
    )
    expect(promotionSource).toContain(
      "assertRecordsReadyForPublication(records)"
    )
    expect(promotionSource).toContain(
      "complete draft, verification, and admin review before promotion"
    )
  })
})
