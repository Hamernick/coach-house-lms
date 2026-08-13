import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SCRIPT = join(ROOT, "scripts/resource-map/import-records.mjs")
const READER = join(ROOT, "scripts/resource-map/lib/read-records.mjs")
const VALIDATOR = join(ROOT, "scripts/resource-map/validate-local-records.mjs")
const RAW_PROVENANCE = join(
  ROOT,
  "scripts/resource-map/lib/import-raw-provenance.mjs"
)
const QUALITY_IMPORT_FIELDS = join(
  ROOT,
  "scripts/resource-map/lib/import-quality-fields.mjs"
)
const REVIEW_IMPORTS = join(
  ROOT,
  "scripts/resource-map/review-import-records.mjs"
)
const REVIEW_MATCHES = join(
  ROOT,
  "scripts/resource-map/review-match-candidates.mjs"
)
const PROMOTION_PAYLOADS = join(
  ROOT,
  "scripts/resource-map/lib/promotion-payloads.mjs"
)
const VERIFY_AND_PUBLISH_SOURCE = join(
  ROOT,
  "scripts/resource-map/verify-and-publish-source-records.mjs"
)

function withTempFile(
  fileName: string,
  content: string,
  callback: (filePath: string) => void
) {
  const directory = mkdtempSync(join(tmpdir(), "resource-map-import-"))
  const filePath = join(directory, fileName)
  writeFileSync(filePath, content)

  try {
    callback(filePath)
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

describe("resource map import records", () => {
  it("documents the ignored local dump directory for future scrape batches", () => {
    const readme = readFileSync(
      join(ROOT, "data/resource-map/README.md"),
      "utf8"
    )
    const gitignore = readFileSync(
      join(ROOT, "data/resource-map/.gitignore"),
      "utf8"
    )

    expect(gitignore).toContain("*")
    expect(gitignore).toContain("!README.md")
    expect(readme).toContain("data/resource-map/<area>-<category-or-source>")
    expect(readme).toContain("Do not upload anything to Supabase")
    expect(readme).toContain("Do not run resource-map:import")
    expect(readme).toContain("pnpm resource-map:validate-local")
    expect(readme).toContain("pnpm resource-map:schema-status -- --strict")
    expect(readme).toContain("pnpm resource-map:schema-setup-sql")
    expect(readme).toContain("pnpm resource-map:review-imports")
    expect(readme).toContain("pnpm resource-map:review-matches")
    expect(readme).toContain("Minimum useful fields")
    expect(readme).toContain("extractedFields.organizationName")
    expect(readme).toContain("extractedFields.description")
    expect(readme).toContain("extractedFields.websiteUrl")
    expect(readme).toContain("extractedFields.timezone")
    expect(readme).toContain("## Field Checklist")
    expect(readme).toContain("sourceRecordId, sourceName, sourceUrl")
    expect(readme).toContain("organizationName, providerName, title")
    expect(readme).toContain("latitude, longitude, address")
    expect(readme).toContain("timezone, appointmentRequired")
    expect(readme).toContain("phone, email, contactEmail")
    expect(readme).toContain("`contacts` entries can use")
    expect(readme).toContain("`links` entries can use")
  })

  it("dry-runs the same wrapped JSON file used for local preview", () => {
    withTempFile(
      "scraped-resources.json",
      JSON.stringify({
        records: [
          {
            sourceRecordId: "food-1",
            sourceUrl: "https://example.org/food",
            extractedFields: {
              organizationName: "Neighborhood Pantry",
              title: "Friday food pantry",
              category: "food",
              latitude: 41.8781,
              longitude: -87.6298,
            },
          },
          {
            sourceRecordId: "health-1",
            sourceUrl: "https://example.org/clinic",
            fields: {
              organizationName: "Community Clinic",
              title: "Walk-in clinic",
              category: "health",
            },
          },
        ],
      }),
      (filePath) => {
        const output = execFileSync(
          process.execPath,
          [SCRIPT, "--input", filePath, "--dry-run"],
          { cwd: ROOT, encoding: "utf8" }
        )

        expect(output).toContain(
          `Dry run: parsed 2 resource records from ${filePath}.`
        )
        expect(output).toContain("would preserve 2 raw payloads")
      }
    )
  })

  it("dry-runs newline-delimited scraper output for staging upload", () => {
    withTempFile(
      "scraped-resources.jsonl",
      [
        JSON.stringify({
          sourceRecordId: "housing-1",
          extractedFields: { title: "Overnight shelter", category: "housing" },
        }),
        JSON.stringify({
          sourceRecordId: "employment-1",
          extractedFields: { title: "Job placement", category: "employment" },
        }),
      ].join("\n"),
      (filePath) => {
        const output = execFileSync(
          process.execPath,
          [SCRIPT, "--input", filePath, "--dry-run"],
          { cwd: ROOT, encoding: "utf8" }
        )

        expect(output).toContain(
          `Dry run: parsed 2 resource records from ${filePath}.`
        )
        expect(output).toContain("would preserve 2 raw payloads")
      }
    )
  })

  it("reconciles corrected staged titles by an unchanged provider URL", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { resolveExistingAssignments } from ${JSON.stringify(pathToFileURL(SCRIPT).href)}
          const existing = [{
            id: "staged-1",
            source_record_id: "old-title-hash",
            promotion_status: "not_promoted",
            review_status: "needs_review",
            extracted_fields: { websiteUrl: "https://provider.example/help" }
          }]
          const payload = [{
            source_record_id: "corrected-title-hash",
            extracted_fields: { websiteUrl: "https://provider.example/help/" }
          }]
          process.stdout.write(JSON.stringify(
            resolveExistingAssignments(existing, payload, true)
          ))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const assignments = JSON.parse(output)

    expect(assignments).toEqual([
      expect.objectContaining({
        reconciled: true,
        record: expect.objectContaining({ id: "staged-1" }),
      }),
    ])
  })

  it("drops explicit evidence whose refreshed field was removed", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { buildFieldEvidenceRecords } from ${JSON.stringify(pathToFileURL(SCRIPT).href)}
          const rows = buildFieldEvidenceRecords(
            {
              extractedFields: { title: "Provider" },
              fieldEvidence: [{
                fieldPath: "extractedFields.websiteUrl",
                sourceUrl: "https://example.org/directory"
              }]
            },
            { id: "import-1", source_url: "https://example.org/directory" },
            "source-1"
          )
          process.stdout.write(JSON.stringify(rows))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )

    expect(JSON.parse(output)).toEqual([])
  })

  it("dedupes raw ingestion rows by checksum before staging import", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { buildRawIngestionPlan } from ${JSON.stringify(pathToFileURL(RAW_PROVENANCE).href)}
          const rows = [
            {
              sourceRecordId: "food-1",
              rawSnapshot: {
                raw_url: "file:///tmp/source.csv",
                raw_text: "name,category\\nPantry,food\\nClinic,health\\n",
                raw_payload: ["not", "an", "object"],
                checksum: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                parser_version: "fixture-parser",
                connector_version: "fixture-connector"
              }
            },
            {
              sourceRecordId: "health-1",
              rawSnapshot: {
                raw_url: "file:///tmp/source.csv",
                raw_text: "name,category\\nPantry,food\\nClinic,health\\n",
                raw_payload: ["not", "an", "object"],
                checksum: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                parser_version: "fixture-parser",
                connector_version: "fixture-connector"
              }
            }
          ]
          const plan = buildRawIngestionPlan(rows, {
            sourceId: "source-1",
            runDbId: "run-db-1",
            batchId: "batch-1",
            input: "records.jsonl",
            now: "2026-06-28T16:00:00.000Z"
          })
          process.stdout.write(JSON.stringify(plan))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const plan = JSON.parse(output)

    expect(plan.rawRows).toHaveLength(1)
    expect(plan.keyByIndex).toHaveLength(2)
    expect(plan.keyByIndex[0]).toBe(plan.keyByIndex[1])
    expect(plan.rawRows[0]).toMatchObject({
      source_id: "source-1",
      run_id: "run-db-1",
      import_batch_id: "batch-1",
      raw_url: "file:///tmp/source.csv",
      raw_payload: { value: ["not", "an", "object"] },
      checksum:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      parser_version: "fixture-parser",
      connector_version: "fixture-connector",
      fetch_status: "fetched",
    })
  })

  it("maps local quality metadata into first-class staging fields", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { buildQualityImportFields } from ${JSON.stringify(pathToFileURL(QUALITY_IMPORT_FIELDS).href)}
          const quality = buildQualityImportFields(
            {
              trustScore: 82,
              freshnessScore: "74",
              qualityFlags: [{ code: "broken_url", severity: "review" }],
              reasonCodes: ["has_contact", "recent_fetch"]
            },
            {
              dataQuality: {
                needsReview: true
              }
            }
          )
          process.stdout.write(JSON.stringify(quality))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const quality = JSON.parse(output)

    expect(quality).toEqual({
      trust_score: 82,
      freshness_score: 74,
      quality_flags: [{ code: "broken_url", severity: "review" }],
      reason_codes: ["has_contact", "recent_fetch"],
      needs_review: true,
    })
  })

  it("maps engine source and dedupe metadata into staging-safe fields", async () => {
    const { buildImportRecord } = await import(pathToFileURL(SCRIPT).href)
    const record = buildImportRecord(
      {
        sourceRecordId: "scraped-1",
        sourceUrl: "https://resources.example.org/food",
        sourceType: "scrape",
        duplicateMatchStatus: "candidate",
        extractedFields: {
          title: "Food help",
          organizationName: "Resource Directory",
          sourceType: "scrape",
          dedupe: {
            status: "candidate",
            duplicateConfidence: 72,
            reviewNeeded: true,
          },
        },
      },
      "source-id",
      "batch-id",
      "raw-id"
    )
    const excelRecord = buildImportRecord(
      {
        sourceRecordId: "excel-1",
        sourceType: "excel",
        extractedFields: {
          title: "Spreadsheet row",
          organizationName: "Manual import",
        },
      },
      "source-id",
      "batch-id",
      null
    )
    const verifiedRecord = buildImportRecord(
      {
        lastEnrichedAt: "2026-07-14T19:00:00.000Z",
        extractedFields: {
          title: "Verified resource",
          organizationName: "Verified provider",
          enrichment: { verification: { status: "approved" } },
        },
      },
      "source-id",
      "batch-id",
      null
    )

    expect(record).toMatchObject({
      source_type: "website",
      duplicate_match_status: "candidate",
    })
    expect(excelRecord.source_type).toBe("manual")
    expect(verifiedRecord.last_verified_at).toBe("2026-07-14T19:00:00.000Z")
  })

  it("chunks large production imports into bounded database requests", async () => {
    const { chunkValues, resolveEvidenceFieldValue } = await import(
      pathToFileURL(SCRIPT).href
    )

    expect(chunkValues([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(
      resolveEvidenceFieldValue(
        { extractedFields: { organizationName: "Neighborhood Pantry" } },
        "extractedFields.organizationName"
      )
    ).toBe("Neighborhood Pantry")

    const source = readFileSync(SCRIPT, "utf8")
    expect(source).toContain("const RECORD_WRITE_CHUNK_SIZE = 10")
    expect(source).toContain("const EVIDENCE_WRITE_CHUNK_SIZE = 200")
    expect(source).toContain("retryTransientFetch")
    expect(source).toContain("fetchExistingImportRecords")
    expect(source).toContain("filterMissingEvidence")
    expect(source).toContain("resumedImportRecordCount")
    expect(source).toContain("insertRowsInChunks")
  })

  it("keeps official-source canaries behind stored review evidence", async () => {
    const source = readFileSync(VERIFY_AND_PUBLISH_SOURCE, "utf8")
    const {
      hasApprovedVerificationLedger,
      storedApprovalGaps,
      summarizeLocalDelta,
    } = await import(pathToFileURL(VERIFY_AND_PUBLISH_SOURCE).href)
    const ledger = [
      {
        issues: [],
        status: "completed",
        structured_result: {
          contradictions: [],
          status: "approved",
          unsupportedClaims: [],
        },
      },
    ]

    expect(hasApprovedVerificationLedger(ledger)).toBe(true)
    expect(
      summarizeLocalDelta(
        [
          {
            extractedFields: {},
            sourceId: "official-source",
            sourceRecordId: "held-1",
          },
        ],
        [{ source_record_id: "held-1" }],
        "official-source"
      )
    ).toMatchObject({
      held: 1,
      matched: [],
      missing: [],
      publishable: 0,
      total: 1,
    })
    expect(
      storedApprovalGaps(
        {
          extracted_fields: {
            enrichment: {
              sourceComparisonCount: 2,
              verification: { status: "needs_review" },
            },
          },
          review_status: "needs_review",
        },
        ledger
      )
    ).toEqual(
      expect.arrayContaining([
        "not_admin_approved",
        "missing_identified_reviewer",
        "missing_verification_time",
        "enrichment_not_verified",
      ])
    )
    expect(source).toContain('source.trust_level !== "official"')
    expect(source).toContain("analyzeResourceEnrichmentReadiness")
    expect(source).toContain("promote_resource_map_import_record")
    expect(source).toContain("--confirm-source")
    expect(source).toContain("Explicit --id values are required")
    expect(source).not.toContain('resource_map_import_records")\n      .update')
    expect(source).not.toContain("exposeVerifiedContactAndLinks")

    const reviewSource = readFileSync(REVIEW_IMPORTS, "utf8")
    expect(reviewSource).toContain("--actor-id is required with --apply")
    expect(reviewSource).toContain('data.role !== "admin"')
  })

  it("links staged imports to raw ingestion records in the DB write path", () => {
    const source = readFileSync(SCRIPT, "utf8")
    const helper = readFileSync(RAW_PROVENANCE, "utf8")
    const migration = readFileSync(
      join(
        ROOT,
        "supabase/migrations/20260628162000_resource_map_data_engine_contract.sql"
      ),
      "utf8"
    )
    const schemaStatus = readFileSync(
      join(ROOT, "scripts/resource-map/check-schema-status.mjs"),
      "utf8"
    )
    const tableContract = readFileSync(
      join(
        ROOT,
        "src/lib/supabase/schema/tables/resource_map_import_records.ts"
      ),
      "utf8"
    )
    const evidenceTableContract = readFileSync(
      join(
        ROOT,
        "src/lib/supabase/schema/tables/resource_map_field_evidence.ts"
      ),
      "utf8"
    )

    expect(source).toContain("resource_map_ingestion_runs")
    expect(source).toContain("resource_map_raw_ingestion_records")
    expect(source).toContain("raw_ingestion_record_id")
    expect(source).toContain("buildRawIngestionPlan")
    expect(source).toContain("buildQualityImportFields")
    expect(source).toContain("rawIngestionRecordCount")
    expect(source).toContain("rawIngestionDuplicateCount")
    expect(source).toContain("flaggedCount")
    expect(source).toContain("evidence_type")
    expect(source).toContain("derived_from")
    expect(source).toContain("transformation")
    expect(source).toContain("evidence_metadata")
    expect(migration).toContain("add column if not exists trust_score")
    expect(migration).toContain("add column if not exists freshness_score")
    expect(migration).toContain("add column if not exists quality_flags")
    expect(migration).toContain("add column if not exists reason_codes")
    expect(migration).toContain("add column if not exists needs_review")
    expect(migration).toContain("add column if not exists evidence_type")
    expect(migration).toContain("add column if not exists derived_from")
    expect(migration).toContain("add column if not exists transformation")
    expect(migration).toContain("add column if not exists evidence_metadata")
    expect(schemaStatus).toContain('"quality_flags"')
    expect(schemaStatus).toContain('"evidence_type"')
    expect(schemaStatus).toContain('"derived_from"')
    expect(schemaStatus).toContain('"transformation"')
    expect(schemaStatus).toContain('"evidence_metadata"')
    expect(tableContract).toContain("quality_flags: Json")
    expect(tableContract).toContain("reason_codes: string[]")
    expect(tableContract).toContain("needs_review: boolean")
    expect(evidenceTableContract).toContain("evidence_type: string")
    expect(evidenceTableContract).toContain("derived_from: string[]")
    expect(evidenceTableContract).toContain("transformation: string | null")
    expect(evidenceTableContract).toContain("evidence_metadata: Json")
    expect(helper).toContain("resolveImportRunId")
    expect(helper).toContain("buildRawIngestionRecord")
  })

  it("keeps parsing reusable for preview and import scripts", () => {
    const reader = execFileSync(process.execPath, ["--check", READER], {
      cwd: ROOT,
      encoding: "utf8",
    })

    expect(reader).toBe("")
  })

  it("keeps staged import review dry-run-first before promotion", () => {
    const help = execFileSync(process.execPath, [REVIEW_IMPORTS, "--help"], {
      cwd: ROOT,
      encoding: "utf8",
    })
    const source = readFileSync(REVIEW_IMPORTS, "utf8")

    expect(help).toContain("resource-map:review-imports")
    expect(help).toContain("--status approved")
    expect(source).toContain("Dry run:")
    expect(source).toContain("resource_map_curation_events")
    expect(source).toContain("--reason is required with --apply")
    expect(source).toContain("--id is required with --apply")
    expect(source).not.toContain("resource_map_public_items")
  })

  it("keeps match review dry-run-first before import approval", () => {
    const help = execFileSync(process.execPath, [REVIEW_MATCHES, "--help"], {
      cwd: ROOT,
      encoding: "utf8",
    })
    const source = readFileSync(REVIEW_MATCHES, "utf8")

    expect(help).toContain("resource-map:review-matches")
    expect(help).toContain("--status accepted")
    expect(source).toContain("Dry run:")
    expect(source).toContain("resource_map_import_record_matches")
    expect(source).toContain("resource_map_curation_events")
    expect(source).toContain("--reason is required with --apply")
    expect(source).toContain("--id is required with --apply")
    expect(source).not.toContain("resource_map_public_items")
  })

  it("builds draft promotion payloads with private contacts links and location", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { buildCanonicalPayload } from ${JSON.stringify(pathToFileURL(PROMOTION_PAYLOADS).href)}
          const payload = buildCanonicalPayload({
            id: "import-1",
            source_id: "source-1",
            source_record_id: "record-1",
            source_url: "https://source.example/record-1",
            confidence_score: 91,
            raw_snapshot: { id: "record-1" },
            extracted_fields: {
              organizationName: "Neighborhood Pantry",
              title: "Friday food pantry",
              category: "food",
              subcategory: "food_food_pantries",
              taxonomyClassification: {
                categories: [
                  { key: "food_food_pantries", confidence: 96 },
                  { key: "food", confidence: 91 }
                ]
              },
              latitude: 41.8781,
              longitude: -87.6298,
              city: "Chicago",
              state: "IL",
              phone: "312-555-0100",
              email: "hello@example.org",
              websiteUrl: "example.org",
              timezone: "America/Chicago",
              appointmentRequired: true,
              availabilityStatus: "appointment_only",
              availabilityNotes: "Call to confirm same-day pickup.",
              hours: {
                label: "Mon-Fri 9-5",
                weekly: [
                  {
                    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                    opensAt: "09:00",
                    closesAt: "17:00"
                  }
                ]
              },
              links: [{ type: "intake", url: "https://example.org/intake" }]
            }
          }, false)
          const published = buildCanonicalPayload({
            id: "import-verified",
            source_id: "source-1",
            source_record_id: "record-verified",
            reviewed_by: "11111111-1111-4111-8111-111111111111",
            last_verified_at: "2026-07-14T19:00:00.000Z",
            extracted_fields: {
              organizationName: "Verified Provider",
              title: "Verified Service"
            }
          }, true)
          process.stdout.write(JSON.stringify({
            organization: payload.organization,
            service: payload.service,
            categoryKeys: payload.categoryKeys,
            categoryConfidenceByKey: payload.categoryConfidenceByKey,
            location: payload.location,
            contacts: payload.contacts,
            links: payload.links,
            published
          }))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const payload = JSON.parse(output)

    expect(payload.organization.visibility).toBe("draft")
    expect(payload.organization.review_status).toBe("pending_review")
    expect(payload.service.visibility).toBe("draft")
    expect(payload.service).toMatchObject({
      timezone: "America/Chicago",
      appointment_required: true,
      availability_status: "appointment_only",
      availability_notes: "Call to confirm same-day pickup.",
      hours: expect.objectContaining({ label: "Mon-Fri 9-5" }),
    })
    expect(payload.categoryKeys).toEqual(["food", "food_food_pantries"])
    expect(payload.categoryConfidenceByKey).toMatchObject({
      food: 91,
      food_food_pantries: 96,
    })
    expect(payload.location).toMatchObject({
      city: "Chicago",
      state: "IL",
      latitude: 41.8781,
      longitude: -87.6298,
      timezone: "America/Chicago",
      appointment_required: true,
      availability_status: "appointment_only",
      is_primary: true,
    })
    expect(payload.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contact_type: "phone",
          is_public: false,
        }),
        expect.objectContaining({
          contact_type: "email",
          is_public: false,
        }),
      ])
    )
    expect(payload.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          link_type: "website",
          is_public: false,
        }),
        expect.objectContaining({
          link_type: "intake",
          is_public: false,
        }),
      ])
    )
    expect(payload.published.organization).toMatchObject({
      approved_by: "11111111-1111-4111-8111-111111111111",
      last_verified_at: "2026-07-14T19:00:00.000Z",
    })
    expect(payload.published.service).toMatchObject({
      approved_by: "11111111-1111-4111-8111-111111111111",
      last_verified_at: "2026-07-14T19:00:00.000Z",
    })
  })

  it("relinks staged field evidence to promoted canonical rows", () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { buildPromotedFieldEvidenceRows } from ${JSON.stringify(pathToFileURL(PROMOTION_PAYLOADS).href)}
          const rows = buildPromotedFieldEvidenceRows([
            {
              id: "evidence-name",
              import_record_id: "import-1",
              source_id: "source-1",
              field_path: "extractedFields.organizationName",
              field_value: "Neighborhood Pantry",
              confidence_score: 96,
              source_url: "https://source.example/record-1",
              evidence_type: "source",
              derived_from: [],
              transformation: null,
              evidence_metadata: { rawField: "NAME" },
              observed_at: "2026-06-30T12:00:00.000Z"
            },
            {
              id: "evidence-lat",
              import_record_id: "import-1",
              source_id: "source-1",
              field_path: "extractedFields.latitude",
              field_value: 41.8781,
              confidence_score: 93,
              evidence_type: "source",
              derived_from: [],
              transformation: null,
              evidence_metadata: {}
            },
            {
              id: "evidence-phone",
              import_record_id: "import-1",
              source_id: "source-1",
              field_path: "extractedFields.phone",
              field_value: "312-555-0100",
              confidence_score: 88,
              evidence_type: "source",
              derived_from: [],
              transformation: null,
              evidence_metadata: {}
            },
            {
              id: "evidence-website",
              import_record_id: "import-1",
              source_id: "source-1",
              field_path: "extractedFields.websiteUrl",
              field_value: "https://example.org",
              confidence_score: 91,
              evidence_type: "source",
              derived_from: [],
              transformation: null,
              evidence_metadata: {}
            }
          ], {
            sourceId: "source-1",
            organization: { id: "org-1" },
            service: { id: "service-1" }
          }, {
            location: { id: "location-1" },
            contacts: [
              { id: "contact-phone", contact_type: "phone", value: "312-555-0100" }
            ],
            links: [
              { id: "link-website", link_type: "website", url: "https://example.org" }
            ]
          })
          process.stdout.write(JSON.stringify(rows))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const rows = JSON.parse(output)

    expect(rows).toHaveLength(4)
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_path: "extractedFields.organizationName",
          organization_id: "org-1",
          service_id: "service-1",
          location_id: null,
          contact_id: null,
          link_id: null,
        }),
        expect.objectContaining({
          field_path: "extractedFields.latitude",
          organization_id: "org-1",
          service_id: "service-1",
          location_id: "location-1",
        }),
        expect.objectContaining({
          field_path: "extractedFields.phone",
          organization_id: "org-1",
          service_id: "service-1",
          contact_id: "contact-phone",
        }),
        expect.objectContaining({
          field_path: "extractedFields.websiteUrl",
          organization_id: "org-1",
          service_id: "service-1",
          link_id: "link-website",
        }),
      ])
    )
    expect(rows[0].evidence_metadata).toMatchObject({
      rawField: "NAME",
      promotedFromImport: true,
      originalEvidenceId: "evidence-name",
      canonicalTarget: {
        organizationId: "org-1",
        serviceId: "service-1",
      },
    })
  })

  it("validates local preview files before import without touching Supabase", () => {
    withTempFile(
      "scraped-resources.jsonl",
      [
        JSON.stringify({
          sourceRecordId: "food-1",
          sourceName: "Local test scrape",
          sourceUrl: "https://example.org/food",
          extractedFields: {
            organizationName: "Neighborhood Pantry",
            title: "Friday food pantry",
            category: "food",
            latitude: 41.8781,
            longitude: -87.6298,
            phone: "312-555-0100",
            websiteUrl: "https://example.org/food",
          },
        }),
      ].join("\n"),
      (filePath) => {
        const output = execFileSync(
          process.execPath,
          [VALIDATOR, "--input", filePath],
          { cwd: ROOT, encoding: "utf8" }
        )

        expect(output).toContain("Resource map local file validation")
        expect(output).toContain("Records: 1")
        expect(output).toContain("Previewable: 1")
        expect(output).toContain("With coordinates: 1")
        expect(output).toContain(`RESOURCE_MAP_LOCAL_PREVIEW_FILE=${filePath}`)
        expect(output).toContain("pnpm resource-map:import")
      }
    )
  })

  it("fails validation when local preview would drop every row", () => {
    withTempFile(
      "bad-resources.json",
      JSON.stringify({ records: [{ sourceRecordId: "bad-1" }] }),
      (filePath) => {
        const result = spawnSync(
          process.execPath,
          [VALIDATOR, "--input", filePath],
          {
            cwd: ROOT,
            encoding: "utf8",
          }
        )

        expect(result.status).toBe(1)
        expect(result.stdout).toContain("Missing title/name")
      }
    )
  })
})
