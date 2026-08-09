import { readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const LIBRARY = join(ROOT, "scripts/resource-map/lib/library-enrichment.mjs")

function evidence(overrides: Record<string, unknown> = {}) {
  return {
    contentSha256: "source-hash",
    evidenceUrl: "https://www.chipublib.org/locations/3/",
    fetchedAt: "2026-07-14T19:11:04.180Z",
    metaDescription: "Albany Park Branch is in the Albany Park neighborhood.",
    pageTitle: "Albany Park | Chicago Public Library",
    recordId: "Albany Park",
    status: "fetched",
    textExcerpt:
      "Albany Park Hours & Information 3401 W. Foster Ave. Chicago, IL 60625 Phone: (773) 539-5450 Email: albanypark@chipublib.org About Albany Park Branch Get a Library Card Getting a library card is easy—and it's free! Facilities Computers Library of Things Meeting room Scanner Study rooms WiFi Features Homework help Mental Health and Social Services Accessibility The building has an accessible entrance, restrooms and drinking fountain. Two ADA computer workstations. New at Albany Park Books Albany Park DVDs Albany Park Music",
    ...overrides,
  }
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    extractedFields: {
      address: "3401 W. Foster Ave.",
      category: "community",
      email: "albanypark@chipublib.org",
      hours: { label: "Mon.-Sat.", weekly: [{ days: ["monday"] }] },
      latitude: 41.9755,
      longitude: -87.7134,
      phone: "(773) 539-5450",
      primaryResourceCategory: "community_libraries",
      resourceCategories: ["community_libraries", "community"],
      title: "Albany Park",
      websiteUrl: "https://www.chipublib.org/locations/3/",
    },
    sourceId: "chicago-socrata-public-libraries",
    sourceRecordId: "Albany Park",
    sourceUrl: "https://www.chipublib.org/locations/3/",
    ...overrides,
  }
}

describe("Chicago Public Library source enrichment", () => {
  it("creates a helpful source-grounded record without an API key", async () => {
    const { enrichLibraryRecord } = await import(pathToFileURL(LIBRARY).href)
    const enriched = enrichLibraryRecord({
      evidence: evidence(),
      now: "2026-07-14T20:00:00.000Z",
      record: record(),
    })

    expect(enriched).toMatchObject({
      lastVerifiedAt: "2026-07-14T20:00:00.000Z",
      extractedFields: {
        accessInstructions: expect.stringContaining("official branch page"),
        appointmentInfo: expect.stringContaining("official branch page"),
        deliveryModes: ["in_person"],
        description: expect.stringContaining("public computers"),
        email: "albanypark@chipublib.org",
        organizationName: "Chicago Public Library",
        primaryResourceCategory: "community_libraries",
        resourceCategories: ["community_libraries", "community"],
        serviceOfferings: expect.arrayContaining([
          "public computers",
          "Wi-Fi",
          "homework help",
        ]),
        serviceTitle: "Albany Park Branch Library",
        timezone: "America/Chicago",
        intakeUrl: null,
        enrichment: {
          sourceComparisonCount: 2,
          verification: {
            contradictions: [],
            status: "approved",
            unsupportedClaims: [],
          },
        },
      },
    })
    expect(enriched.fieldEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceType: "derived",
          fieldPath: "extractedFields.description",
          sourceUrl: "https://www.chipublib.org/locations/3/",
          transformation: "source_specific_deterministic_enrichment",
        }),
      ])
    )
  })

  it("corrects catalog title and email from the official page", async () => {
    const { enrichLibraryRecord } = await import(pathToFileURL(LIBRARY).href)
    const enriched = enrichLibraryRecord({
      evidence: evidence({
        evidenceUrl: "https://www.chipublib.org/locations/61/",
        pageTitle: "Rogers Park | Chicago Public Library",
        recordId: "Rogers Park",
        textExcerpt:
          "Rogers Park Hours & Information 6907 N. Clark St. Chicago, IL 60626 Phone: (312) 744-0156 Email: rogerspark@chipublib.org About Rogers Park Branch Facilities Computers Scanner WiFi Accessibility The building has an accessible entrance. New at Rogers Park Books DVDs Music",
      }),
      record: record({
        extractedFields: {
          ...record().extractedFields,
          address: "6907 N. Clark St.",
          email: "scottsdale@chipublib.org",
          title: "Rogers Park",
        },
        sourceRecordId: "Rogers Park",
      }),
    })

    expect(enriched.extractedFields).toMatchObject({
      email: "rogerspark@chipublib.org",
      serviceTitle: "Rogers Park Branch Library",
      enrichment: { verification: { status: "approved" } },
    })
  })

  it("turns raw regional and Daley dataset names into public titles", async () => {
    const { buildLibraryEnrichmentDraft } = await import(
      pathToFileURL(LIBRARY).href
    )
    const regional = buildLibraryEnrichmentDraft(
      record({ sourceRecordId: "Legler Regional" }),
      evidence({
        pageTitle: "Legler Regional | Chicago Public Library",
        recordId: "Legler Regional",
      })
    )
    const daley = buildLibraryEnrichmentDraft(
      record({ sourceRecordId: "Daley, Richard J." }),
      evidence({
        pageTitle: "Daley, Richard J.-Bridgeport | Chicago Public Library",
        recordId: "Daley, Richard J.",
      })
    )

    expect(regional.displayTitle).toBe("Legler Regional Library")
    expect(daley.displayTitle).toBe("Richard J. Daley Branch Library")
  })

  it("registers a dry-run-first provider-specific command", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    const source = readFileSync(
      "scripts/resource-map/enrich-library-candidates.mjs",
      "utf8"
    )
    expect(packageJson.scripts["resource-map:enrich-library"]).toBe(
      "node scripts/resource-map/enrich-library-candidates.mjs"
    )
    expect(source).toContain('if (!args.has("write"))')
    expect(source).not.toContain("OPENAI_API_KEY")
  })

  it("keeps production sync dry-run-first and exposes only provider contacts and website", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    const source = readFileSync(
      "scripts/resource-map/sync-library-public-records.mjs",
      "utf8"
    )
    expect(packageJson.scripts["resource-map:sync-library"]).toBe(
      "node scripts/resource-map/sync-library-public-records.mjs"
    )
    expect(source).toContain('if (!args.has("apply"))')
    expect(source).toContain("is_public: true")
    expect(source).toContain('const isWebsite = link.link_type === "website"')
    expect(source).toContain("is_public: isWebsite")
    expect(source).toContain("Saved pre-update backup")
    expect(source).toContain(
      'eq("transformation", "source_specific_deterministic_enrichment")'
    )
  })
})
