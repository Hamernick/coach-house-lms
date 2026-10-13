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

    expect(record).toMatchObject({
      source_type: "website",
      duplicate_match_status: "candidate",
    })
    expect(excelRecord.source_type).toBe("manual")
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
          process.stdout.write(JSON.stringify({
            organization: payload.organization,
            service: payload.service,
            categoryKeys: payload.categoryKeys,
            categoryConfidenceByKey: payload.categoryConfidenceByKey,
            location: payload.location,
            contacts: payload.contacts,
            links: payload.links
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

  it("reconciles dropped promotion evidence responses before retrying", () => {
    const helper = join(
      ROOT,
      "scripts/resource-map/lib/promotion-evidence-writes.mjs"
    )
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { insertPromotedFieldEvidenceRows } from ${JSON.stringify(pathToFileURL(helper).href)}

          function buildAdmin({ committedCount, commitAfterCount = false }) {
            let insertAttempts = 0
            let firstRows = []
            const insertedIds = new Set()
            const unrelatedIds = new Set()
            let requestedIds = []
            const query = {
              select() { return this },
              in(column, ids) {
                if (column !== "id") throw new Error("Expected evidence ID lookup")
                requestedIds = ids
                return this
              },
              then(resolve, reject) {
                const count = requestedIds.filter((id) => insertedIds.has(id)).length
                if (commitAfterCount) {
                  firstRows.forEach((row) => insertedIds.add(row.id))
                }
                return Promise.resolve({ count, error: null }).then(resolve, reject)
              }
            }
            return {
              addUnrelated(count) {
                for (let index = 0; index < count; index += 1) {
                  unrelatedIds.add("unrelated-" + index)
                }
              },
              getState: () => ({
                insertAttempts,
                insertedCount: insertedIds.size,
                unrelatedCount: unrelatedIds.size
              }),
              from() {
                return {
                  upsert(rows, options) {
                    if (options.onConflict !== "id" || !options.ignoreDuplicates) {
                      throw new Error("Expected conflict-safe evidence upsert")
                    }
                    insertAttempts += 1
                    if (insertAttempts === 1) {
                      firstRows = rows
                      rows.slice(0, committedCount).forEach((row) => {
                        insertedIds.add(row.id)
                      })
                      return Promise.resolve({
                        error: {
                          message: "TypeError: fetch failed",
                          details: "SocketError: other side closed (UND_ERR_SOCKET)",
                          hint: "",
                          code: ""
                        }
                      })
                    }
                    rows.forEach((row) => insertedIds.add(row.id))
                    return Promise.resolve({ error: null })
                  },
                  select() { return query.select() }
                }
              }
            }
          }

          const rows = [{ field_path: "name" }, { field_path: "address" }]
          const committed = buildAdmin({ committedCount: rows.length })
          const notCommitted = buildAdmin({ committedCount: 0 })
          const delayedCommit = buildAdmin({
            committedCount: 0,
            commitAfterCount: true
          })
          const partial = buildAdmin({ committedCount: 1 })
          const unrelated = buildAdmin({ committedCount: 0 })
          unrelated.addUnrelated(rows.length)
          await insertPromotedFieldEvidenceRows({
            admin: committed,
            rows,
            retryDelayMs: 0
          })
          await insertPromotedFieldEvidenceRows({
            admin: notCommitted,
            rows,
            retryDelayMs: 0
          })
          await insertPromotedFieldEvidenceRows({
            admin: delayedCommit,
            rows,
            retryDelayMs: 0
          })
          await insertPromotedFieldEvidenceRows({
            admin: unrelated,
            rows,
            retryDelayMs: 0
          })
          let partialError = null
          try {
            await insertPromotedFieldEvidenceRows({
              admin: partial,
              rows,
              retryDelayMs: 0
            })
          } catch (error) {
            partialError = error.message
          }
          process.stdout.write(JSON.stringify({
            committed: committed.getState(),
            notCommitted: notCommitted.getState(),
            delayedCommit: delayedCommit.getState(),
            unrelated: unrelated.getState(),
            partial: partial.getState(),
            partialError
          }))
        `,
      ],
      { cwd: ROOT, encoding: "utf8" }
    )

    expect(JSON.parse(output)).toEqual({
      committed: {
        insertAttempts: 1,
        insertedCount: 2,
        unrelatedCount: 0,
      },
      notCommitted: {
        insertAttempts: 2,
        insertedCount: 2,
        unrelatedCount: 0,
      },
      delayedCommit: {
        insertAttempts: 2,
        insertedCount: 2,
        unrelatedCount: 0,
      },
      unrelated: {
        insertAttempts: 2,
        insertedCount: 2,
        unrelatedCount: 2,
      },
      partial: {
        insertAttempts: 1,
        insertedCount: 1,
        unrelatedCount: 0,
      },
      partialError: "Promotion evidence insert left 1 of 2 rows.",
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
