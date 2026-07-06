#!/usr/bin/env node
import { pathToFileURL } from "node:url"

import { createResourceMapAdminClient } from "./lib/env.mjs"
import {
  buildNormalizedImportFields,
  resolveExtractedFields,
} from "./lib/normalization.mjs"
import {
  buildRawIngestionPlan,
  readRawRunId,
  resolveImportRunId,
} from "./lib/import-raw-provenance.mjs"
import { buildQualityImportFields } from "./lib/import-quality-fields.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

function parseArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      args.set(key, true)
    } else {
      args.set(key, next)
      i += 1
    }
  }
  return args
}

async function upsertSource(admin, args) {
  const slug = String(args.get("source-slug") ?? "").trim()
  const name = String(args.get("source-name") ?? slug).trim()
  if (!slug || !name) {
    throw new Error("--source-slug and --source-name are required.")
  }

  const { data, error } = await admin
    .from("resource_map_sources")
    .upsert(
      {
        slug,
        name,
        homepage_url: args.get("source-homepage") || null,
        source_type: args.get("source-type") || "manual",
        license_label: args.get("license-label") || null,
        license_url: args.get("license-url") || null,
        attribution: args.get("attribution") || null,
        trust_level: args.get("trust-level") || "unverified",
        metadata: {
          importedBy: "scripts/resource-map/import-records.mjs",
        },
      },
      { onConflict: "slug" }
    )
    .select("id")
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("Unable to upsert resource map source.")
  return data.id
}

function normalizeImportSourceType(value) {
  const sourceType = String(value ?? "manual")
    .trim()
    .toLowerCase()
  if (["website", "api", "csv", "directory", "manual"].includes(sourceType)) {
    return sourceType
  }
  if (["scrape", "static_html", "playwright_scrape"].includes(sourceType)) {
    return "website"
  }
  if (
    ["partner", "seed", "excel", "json", "xml", "sitemap"].includes(sourceType)
  ) {
    return "manual"
  }
  return "manual"
}

function normalizeDuplicateMatchStatus(value) {
  const status = String(value ?? "unknown")
    .trim()
    .toLowerCase()
  return ["unknown", "candidate", "matched", "duplicate", "unique"].includes(
    status
  )
    ? status
    : "unknown"
}

export function buildImportRecord(
  record,
  sourceId,
  batchId,
  rawIngestionRecordId
) {
  const extractedFields = resolveExtractedFields(record)
  const normalized = buildNormalizedImportFields(record)
  const quality = buildQualityImportFields(record, extractedFields)
  const dedupe = extractedFields.dedupe ?? extractedFields.duplicate ?? {}

  return {
    source_id: sourceId,
    batch_id: batchId,
    raw_ingestion_record_id: rawIngestionRecordId ?? null,
    source_record_id:
      record.sourceRecordId ?? record.source_record_id ?? record.id ?? null,
    source_url: record.sourceUrl ?? record.source_url ?? null,
    source_type: normalizeImportSourceType(
      record.sourceType ?? record.source_type ?? extractedFields.sourceType
    ),
    raw_snapshot: record.rawSnapshot ?? record.raw_snapshot ?? record,
    extracted_fields: extractedFields,
    field_confidence:
      record.fieldConfidence ??
      record.field_confidence ??
      record.confidence ??
      {},
    confidence_score: record.confidenceScore ?? record.confidence_score ?? null,
    ...quality,
    ...normalized,
    review_status: "needs_review",
    duplicate_match_status: normalizeDuplicateMatchStatus(
      record.duplicateMatchStatus ??
        record.duplicate_match_status ??
        dedupe.status
    ),
    promotion_status: "not_promoted",
    license_notes: record.licenseNotes ?? record.license_notes ?? null,
    attribution: record.attribution ?? null,
    terms_notes: record.termsNotes ?? record.terms_notes ?? null,
    last_seen_at: record.lastSeenAt ?? record.last_seen_at ?? null,
    last_scraped_at:
      record.lastScrapedAt ??
      record.last_scraped_at ??
      new Date().toISOString(),
  }
}

function summarizeRawPlan(rows, input, args) {
  const rawPlan = buildRawIngestionPlan(rows, {
    sourceId: "00000000-0000-4000-8000-000000000000",
    input,
    now: "2026-06-28T00:00:00.000Z",
  })
  const runId = resolveImportRunId(rows, args.get("run-id"))
  return {
    runId,
    rawCount: rawPlan.rawRows.length,
  }
}

function readConfidence(fieldConfidence, fieldPath) {
  if (!fieldConfidence || typeof fieldConfidence !== "object") return null
  const value = fieldConfidence[fieldPath]
  if (typeof value !== "number") return null
  return value
}

function readStringValue(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function readStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
  }
  if (typeof value === "string" && value.trim()) return [value.trim()]
  return []
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readEvidenceArray(record) {
  const value = record.fieldEvidence ?? record.field_evidence ?? record.evidence
  return Array.isArray(value) ? value : []
}

function normalizeEvidenceEntry({
  evidence,
  fieldPath,
  fieldValue,
  importRecord,
  sourceId,
  observedAt,
  confidenceScore,
}) {
  const resolvedFieldPath =
    evidence?.fieldPath ?? evidence?.field_path ?? evidence?.path ?? fieldPath
  const normalizedPath =
    typeof resolvedFieldPath === "string" ? resolvedFieldPath.trim() : ""
  if (!normalizedPath) return null
  const derivedFrom = readStringArray(
    evidence?.derivedFrom ?? evidence?.derived_from
  )

  return {
    import_record_id: importRecord.id,
    source_id: sourceId,
    field_path: normalizedPath,
    field_value:
      evidence?.fieldValue ??
      evidence?.field_value ??
      evidence?.value ??
      fieldValue,
    confidence_score:
      evidence?.confidenceScore ??
      evidence?.confidence_score ??
      confidenceScore ??
      null,
    source_url:
      evidence?.sourceUrl ??
      evidence?.source_url ??
      importRecord.source_url ??
      null,
    evidence_type:
      readStringValue(evidence?.evidenceType, evidence?.evidence_type) ??
      (derivedFrom.length > 0 ? "derived" : "source"),
    derived_from: derivedFrom,
    transformation: readStringValue(
      evidence?.transformation,
      evidence?.transform
    ),
    evidence_metadata: readObject(
      evidence?.evidenceMetadata ??
        evidence?.evidence_metadata ??
        evidence?.metadata
    ),
    observed_at:
      evidence?.observedAt ??
      evidence?.observed_at ??
      observedAt ??
      new Date().toISOString(),
  }
}

function buildFieldEvidenceRecords(record, importRecord, sourceId) {
  const explicitEvidence = readEvidenceArray(record)
  const fieldConfidence =
    record.fieldConfidence ?? record.field_confidence ?? record.confidence ?? {}
  const observedAt =
    record.lastScrapedAt ??
    record.last_scraped_at ??
    record.lastSeenAt ??
    record.last_seen_at ??
    null

  if (explicitEvidence.length > 0) {
    return explicitEvidence
      .map((evidence) =>
        normalizeEvidenceEntry({
          evidence,
          importRecord,
          sourceId,
          observedAt,
          fieldValue: null,
          confidenceScore: null,
        })
      )
      .filter(Boolean)
  }

  return Object.entries(resolveExtractedFields(record))
    .map(([fieldPath, fieldValue]) => {
      if (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === ""
      ) {
        return null
      }

      return normalizeEvidenceEntry({
        evidence: null,
        fieldPath,
        fieldValue,
        importRecord,
        sourceId,
        observedAt,
        confidenceScore: readConfidence(fieldConfidence, fieldPath),
      })
    })
    .filter(Boolean)
}

async function upsertIngestionRun(admin, { args, input, rows, sourceId }) {
  const runId = resolveImportRunId(rows, args.get("run-id"))
  const sourceRunIds = [
    ...new Set(rows.map(readRawRunId).filter((value) => value)),
  ]
  const connectorTypes = [
    ...new Set(
      rows
        .map((row) => {
          const raw =
            row.rawIngestion ??
            row.raw_ingestion ??
            row.rawSnapshot ??
            row.raw_snapshot
          return raw?.connectorType ?? raw?.connector_type ?? null
        })
        .filter(Boolean)
    ),
  ]

  const { data, error } = await admin
    .from("resource_map_ingestion_runs")
    .upsert(
      {
        run_id: runId,
        source_id: sourceId,
        run_kind: args.get("run-kind") || "staging_import",
        connector_type: args.get("connector-type") || connectorTypes[0] || null,
        status: "running",
        started_at: new Date().toISOString(),
        finished_at: null,
        fetched_count: 0,
        parsed_count: rows.length,
        normalized_count: 0,
        classified_count: 0,
        deduped_count: 0,
        flagged_count: 0,
        errors: [],
        metadata: {
          importedBy: "scripts/resource-map/import-records.mjs",
          input,
          sourceRunIds,
        },
      },
      { onConflict: "run_id" }
    )
    .select("id,run_id")
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("Unable to upsert ingestion run.")
  return data
}

async function finishIngestionRun(admin, runId, patch) {
  if (!runId) return
  await admin
    .from("resource_map_ingestion_runs")
    .update({
      ...patch,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)
}

async function markBatchFailed(admin, batchId, message, errorCount) {
  await admin
    .from("resource_map_import_batches")
    .update({
      status: "failed",
      error_count: errorCount,
      error_log: [{ message }],
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId)
}

async function upsertRawIngestionRecords(admin, rawRows) {
  if (rawRows.length === 0) return new Map()

  const sourceId = rawRows[0].source_id
  const checksums = [...new Set(rawRows.map((row) => row.checksum))]
  const { data: existingRows, error: existingError } = await admin
    .from("resource_map_raw_ingestion_records")
    .select("id,source_id,checksum")
    .eq("source_id", sourceId)
    .in("checksum", checksums)

  if (existingError) throw existingError

  const byKey = new Map(
    (existingRows ?? []).map((row) => [
      `${row.source_id}:${row.checksum}`,
      row.id,
    ])
  )
  const missingRows = rawRows.filter(
    (row) => !byKey.has(`${row.source_id}:${row.checksum}`)
  )

  if (missingRows.length > 0) {
    const { data: insertedRows, error: insertError } = await admin
      .from("resource_map_raw_ingestion_records")
      .insert(missingRows)
      .select("id,source_id,checksum")

    if (insertError) throw insertError
    for (const row of insertedRows ?? []) {
      byKey.set(`${row.source_id}:${row.checksum}`, row.id)
    }
  }

  return byKey
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  const dryRun = Boolean(args.get("dry-run"))

  if (!input) {
    throw new Error(
      "Usage: pnpm resource-map:import -- --input records.jsonl|records.json --source-slug source --source-name 'Source Name' [--dry-run]"
    )
  }

  const rows = readResourceMapRecords(input)
  if (dryRun) {
    const rawSummary = summarizeRawPlan(rows, input, args)
    console.log(
      `Dry run: parsed ${rows.length} resource records from ${input}.`
    )
    console.log(
      `Dry run: would preserve ${rawSummary.rawCount} raw payloads and stage run ${rawSummary.runId}.`
    )
    return
  }

  const admin = createResourceMapAdminClient()
  const sourceId = await upsertSource(admin, args)
  const ingestionRun = await upsertIngestionRun(admin, {
    args,
    input,
    rows,
    sourceId,
  })
  const { data: batch, error: batchError } = await admin
    .from("resource_map_import_batches")
    .insert({
      source_id: sourceId,
      import_kind: args.get("import-kind") || "full",
      status: "running",
      source_uri: input,
      row_count: rows.length,
    })
    .select("id")
    .maybeSingle()

  if (batchError) {
    await finishIngestionRun(admin, ingestionRun.id, {
      status: "failed",
      errors: [{ message: batchError.message }],
    })
    throw batchError
  }
  if (!batch) throw new Error("Unable to create import batch.")

  const rawPlan = buildRawIngestionPlan(rows, {
    sourceId,
    runDbId: ingestionRun.id,
    batchId: batch.id,
    input,
  })
  let rawIdsByKey
  try {
    rawIdsByKey = await upsertRawIngestionRecords(admin, rawPlan.rawRows)
  } catch (error) {
    await markBatchFailed(admin, batch.id, error.message, rows.length)
    await finishIngestionRun(admin, ingestionRun.id, {
      status: "failed",
      errors: [{ message: error.message }],
    })
    throw error
  }

  const payload = rows.map((row, index) =>
    buildImportRecord(
      row,
      sourceId,
      batch.id,
      rawIdsByKey.get(rawPlan.keyByIndex[index])
    )
  )
  const flaggedCount = payload.filter(
    (row) =>
      row.needs_review ||
      row.quality_flags.length > 0 ||
      (row.confidence_score !== null && row.confidence_score < 70)
  ).length
  const { data: insertedRecords, error: insertError } = await admin
    .from("resource_map_import_records")
    .insert(payload)
    .select("id,source_record_id,source_url")

  if (insertError) {
    await markBatchFailed(admin, batch.id, insertError.message, rows.length)
    await finishIngestionRun(admin, ingestionRun.id, {
      status: "failed",
      errors: [{ message: insertError.message }],
    })
    throw insertError
  }

  const evidencePayload = (insertedRecords ?? []).flatMap(
    (importRecord, index) =>
      buildFieldEvidenceRecords(rows[index] ?? {}, importRecord, sourceId)
  )

  if (evidencePayload.length > 0) {
    const { error: evidenceError } = await admin
      .from("resource_map_field_evidence")
      .insert(evidencePayload)

    if (evidenceError) {
      await admin
        .from("resource_map_import_batches")
        .update({
          status: "completed_with_errors",
          imported_count: payload.length,
          error_count: evidencePayload.length,
          error_log: [{ message: evidenceError.message }],
          completed_at: new Date().toISOString(),
        })
        .eq("id", batch.id)
      await finishIngestionRun(admin, ingestionRun.id, {
        status: "completed_with_errors",
        fetched_count: rawPlan.rawRows.length,
        parsed_count: rows.length,
        normalized_count: payload.length,
        classified_count: payload.length,
        errors: [{ message: evidenceError.message }],
      })
      throw evidenceError
    }
  }

  await admin
    .from("resource_map_import_batches")
    .update({
      status: "completed",
      imported_count: payload.length,
      summary: {
        fieldEvidenceCount: evidencePayload.length,
        flaggedCount,
        rawIngestionRecordCount: rawPlan.rawRows.length,
        rawIngestionDuplicateCount: rows.length - rawPlan.rawRows.length,
      },
      completed_at: new Date().toISOString(),
    })
    .eq("id", batch.id)

  await finishIngestionRun(admin, ingestionRun.id, {
    status: "completed",
    fetched_count: rawPlan.rawRows.length,
    parsed_count: rows.length,
    normalized_count: payload.length,
    classified_count: payload.length,
    flagged_count: flaggedCount,
    errors: [],
  })

  console.log(
    `Imported ${payload.length} staged resource records, ${rawPlan.rawRows.length} raw payloads, and ${evidencePayload.length} field evidence rows.`
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
