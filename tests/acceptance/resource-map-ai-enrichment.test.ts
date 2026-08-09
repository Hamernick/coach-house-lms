import { readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const AI_LIBRARY = join(ROOT, "scripts/resource-map/lib/ai-enrichment.mjs")

function draft(sourceUrl: string) {
  return {
    accessInstructions:
      "Visit during posted hours, call the branch, or use its official page for current details.",
    accessibility:
      "The source lists an accessible entrance, restrooms, drinking fountain, parking space, and ADA computer workstations.",
    address: "3401 W. Foster Avenue, Chicago, IL 60625",
    citations: [
      {
        claimPaths: [
          "displayTitle",
          "providerName",
          "publicSummary",
          "services",
          "eligibility",
          "accessInstructions",
          "address",
          "email",
          "phone",
        ],
        evidenceSnippet:
          "Facilities include computers, meeting rooms, a scanner, study rooms, and WiFi.",
        sourceUrl,
      },
    ],
    cost: "Getting a Chicago Public Library card is free.",
    displayTitle: "Albany Park Branch Library",
    documentsNeeded: [],
    email: "albanypark@chipublib.org",
    eligibility:
      "The branch is open to the public; borrowing requires an eligible Chicago Public Library card.",
    hoursNote: "See the official branch page for current daily hours.",
    intakeUrl: sourceUrl,
    languages: ["Korean", "Spanish"],
    phone: "(773) 539-5450",
    providerName: "Chicago Public Library",
    publicSummary:
      "Albany Park Branch Library offers books, computers, Wi-Fi, meeting and study rooms, homework help, and mental health and social service support.",
    schemaVersion: 1,
    services: [
      {
        description:
          "Public library materials, technology, study space, and learning support.",
        howToAccess: "Visit the branch during posted hours.",
        name: "Library and learning services",
      },
    ],
    unknownFields: ["documentsNeeded"],
  }
}

function verification(sourceUrl: string) {
  return {
    claimChecks: [
      {
        claimPath: "publicSummary",
        note: "The listed facilities and features support the summary.",
        sourceUrls: [sourceUrl],
        status: "supported",
      },
    ],
    contradictions: [],
    requiredCorrections: [],
    schemaVersion: 1,
    status: "approved",
    summary: "All material claims are supported by the provider page.",
    unsupportedClaims: [],
  }
}

describe("resource map AI enrichment", () => {
  it("runs separate structured draft and verification passes", async () => {
    const { runResourceEnrichment } = await import(
      pathToFileURL(AI_LIBRARY).href
    )
    const sourceUrl = "https://www.chipublib.org/locations/3/"
    const calls: unknown[] = []
    const outputs = [draft(sourceUrl), verification(sourceUrl)]
    const client = {
      responses: {
        parse: async (request: unknown) => {
          calls.push(request)
          return {
            id: `response-${calls.length}`,
            output_parsed: outputs[calls.length - 1],
          }
        },
      },
    }
    const record = {
      sourceRecordId: "Albany Park",
      sourceName: "Chicago Data Portal - Public library locations and hours",
      sourceUrl,
      rawSnapshot: { branch_: "Albany Park" },
      extractedFields: {
        email: "albanypark@chipublib.org",
        address: "3401 W. Foster Ave.",
        category: "community_libraries",
        title: "Albany Park",
        websiteUrl: sourceUrl,
      },
    }
    const enriched = await runResourceEnrichment({
      client,
      model: "draft-model",
      now: "2026-07-14T19:00:00.000Z",
      providerEvidence: {
        comparisons: [],
        evidenceUrl: sourceUrl,
        fetchedAt: "2026-07-14T18:00:00.000Z",
        headings: ["Albany Park", "Facilities", "Accessibility"],
        metaDescription: "Albany Park Branch is on Chicago's Northwest Side.",
        pageTitle: "Albany Park | Chicago Public Library",
        status: "fetched",
        textExcerpt:
          "Facilities include computers, meeting rooms, WiFi, and study rooms.",
      },
      record,
      verifierModel: "verifier-model",
    })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toMatchObject({ model: "draft-model", store: false })
    expect(calls[1]).toMatchObject({ model: "verifier-model", store: false })
    expect(enriched).toMatchObject({
      lastEnrichedAt: "2026-07-14T19:00:00.000Z",
      needsReview: true,
      extractedFields: {
        organizationName: "Chicago Public Library",
        serviceTitle: "Albany Park Branch Library",
        title: "Albany Park Branch Library",
        enrichment: {
          sourceComparisonCount: 2,
          verification: { status: "approved" },
        },
      },
    })
    expect(enriched.fieldEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceType: "ai_derived",
          fieldPath: "extractedFields.description",
          transformation: "source_grounded_ai_enrichment",
        }),
      ])
    )
  })

  it("rejects invented citation URLs and inconsistent approvals", async () => {
    const {
      buildResourceEnrichmentEvidence,
      validateResourceEnrichmentDraft,
      validateResourceEnrichmentVerification,
    } = await import(pathToFileURL(AI_LIBRARY).href)
    const sourceUrl = "https://www.chipublib.org/locations/3/"
    const evidence = buildResourceEnrichmentEvidence(
      { sourceUrl, extractedFields: { websiteUrl: sourceUrl } },
      { evidenceUrl: sourceUrl }
    )

    expect(() =>
      validateResourceEnrichmentDraft(
        draft("https://invented.example.org/resource"),
        evidence
      )
    ).toThrow("unprovided source URL")
    expect(() =>
      validateResourceEnrichmentVerification(
        {
          ...verification(sourceUrl),
          unsupportedClaims: ["Unsupported service"],
        },
        evidence
      )
    ).toThrow("Approved verification cannot contain unsupported claims")
  })

  it("downgrades model approval when catalog fields conflict with the provider", async () => {
    const {
      buildResourceEnrichmentEvidence,
      validateResourceEnrichmentVerification,
    } = await import(pathToFileURL(AI_LIBRARY).href)
    const sourceUrl = "https://www.chipublib.org/locations/61/"
    const evidence = buildResourceEnrichmentEvidence(
      { sourceUrl, extractedFields: { websiteUrl: sourceUrl } },
      {
        evidenceUrl: sourceUrl,
        comparisons: [
          {
            fieldPath: "email",
            sourceUrl,
            status: "not_found",
            value: "scottsdale@chipublib.org",
          },
        ],
      }
    )
    const result = validateResourceEnrichmentVerification(
      verification(sourceUrl),
      evidence
    )

    expect(result).toMatchObject({
      status: "needs_review",
      contradictions: ["Catalog email was not found on the provider page."],
    })
  })

  it("registers a dry-run-first enrichment command", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    const source = readFileSync(
      "scripts/resource-map/enrich-candidates.mjs",
      "utf8"
    )
    expect(packageJson.scripts["resource-map:enrich"]).toBe(
      "node scripts/resource-map/enrich-candidates.mjs"
    )
    expect(source).toContain('String(args.get("network")) !== "true"')
    expect(source).toContain("createResourceEnrichmentClient()")
  })
})
