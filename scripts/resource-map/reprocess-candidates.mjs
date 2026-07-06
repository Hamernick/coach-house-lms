#!/usr/bin/env node
import {
  STORE_PATHS,
  appendJsonl,
  createRunRecord,
  finishRunRecord,
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
  writeJsonl,
} from "./lib/data-engine/shared.mjs"
import { normalizeCandidateRecord } from "./lib/data-engine/normalizer.mjs"
import { geocodeRecord } from "./lib/data-engine/geocoder.mjs"
import { dedupeRecords } from "./lib/data-engine/dedupe.mjs"
import { attachQuality } from "./lib/data-engine/quality.mjs"

const DERIVED_FIELD_KEYS = new Set([
  "canonicalName",
  "normalizedPhone",
  "domain",
  "free",
  "category",
  "subcategory",
  "resourceCategories",
  "primaryResourceCategory",
  "taxonomyClassification",
  "normalization",
  "dataQuality",
  "geocodingAccuracy",
  "geocodingProvider",
  "geocodingConfidence",
])

const DERIVED_TOP_LEVEL_KEYS = new Set([
  "normalizedName",
  "normalizedDomain",
  "normalizedPhone",
  "normalizedEmail",
  "normalizedAddress",
  "normalizedFingerprint",
  "confidenceScore",
  "fieldConfidence",
  "trustScore",
  "freshnessScore",
  "reasonCodes",
  "needsReview",
  "qualityFlags",
  "duplicateMatchStatus",
  "duplicateCandidate",
])

const GENERATED_EVIDENCE_PATHS = new Set([
  "normalizedName",
  "normalizedDomain",
  "normalizedPhone",
  "normalizedEmail",
  "normalizedAddress",
  "normalizedFingerprint",
  "trustScore",
  "freshnessScore",
  "confidenceScore",
  "reasonCodes",
  "qualityFlags",
  "extractedFields.canonicalName",
  "extractedFields.normalizedPhone",
  "extractedFields.domain",
  "extractedFields.free",
  "extractedFields.category",
  "extractedFields.subcategory",
  "extractedFields.resourceCategories",
  "extractedFields.primaryResourceCategory",
  "extractedFields.taxonomyClassification",
  "extractedFields.normalization",
  "extractedFields.dataQuality",
  "extractedFields.geocodingAccuracy",
  "extractedFields.geocodingProvider",
  "extractedFields.geocodingConfidence",
])

function usage() {
  return [
    "Usage:",
    "  pnpm data:reprocess",
    "  pnpm data:reprocess -- --input data/resource-map/.engine/candidate-records.jsonl",
    "  pnpm data:reprocess -- --output data/resource-map/.engine/candidate-records.reprocessed.jsonl --write",
    "",
    "Re-runs local normalization, taxonomy, geocoding, dedupe, scoring, and quality flags over existing candidate JSONL without refetching sources.",
    "Dry-run by default. With --write and no --output, overwrites the input file.",
  ].join("\n")
}

function readFields(record) {
  const fields = record.extractedFields ?? record.extracted_fields ?? {}
  return fields && typeof fields === "object" && !Array.isArray(fields)
    ? fields
    : {}
}

function readEvidence(record) {
  const evidence = record.fieldEvidence ?? record.field_evidence
  return Array.isArray(evidence) ? evidence : []
}

function cleanExtractedFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => !DERIVED_FIELD_KEYS.has(key))
  )
}

function cleanFieldEvidence(record) {
  return readEvidence(record).filter((evidence) => {
    const evidenceType = readString(
      evidence.evidenceType,
      evidence.evidence_type
    )
    const transformation = readString(evidence.transformation)
    const fieldPath = readString(evidence.fieldPath, evidence.field_path)
    if (evidenceType && evidenceType !== "source") return false
    if (transformation === "source_field_passthrough") return false
    if (fieldPath && GENERATED_EVIDENCE_PATHS.has(fieldPath)) return false
    return true
  })
}

function cleanRecordForReprocess(record) {
  const cleaned = Object.fromEntries(
    Object.entries(record).filter(([key]) => !DERIVED_TOP_LEVEL_KEYS.has(key))
  )

  return {
    ...cleaned,
    extractedFields: cleanExtractedFields(readFields(record)),
    fieldEvidence: cleanFieldEvidence(record),
  }
}

function addSourceAliases(aliases, source) {
  for (const value of [
    source.sourceId,
    source.source_id,
    source.id,
    source.slug,
    source.name,
    source.sourceName,
    source.source_name,
    source.rawUrl,
    source.raw_url,
  ]) {
    const key = readString(value)
    if (key) aliases.set(key, source)
  }
}

function buildSourceLookup(registryPath) {
  const aliases = new Map()
  for (const source of readJsonl(registryPath))
    addSourceAliases(aliases, source)
  return aliases
}

function findSourceForRecord(record, sourceLookup) {
  for (const value of [
    record.sourceId,
    record.source_id,
    record.sourceName,
    record.source_name,
    record.sourceUrl,
    record.source_url,
  ]) {
    const key = readString(value)
    if (key && sourceLookup.has(key)) return sourceLookup.get(key)
  }
  return {}
}

async function reprocessCandidates(args) {
  const input = args.get("input") || STORE_PATHS.candidates
  const output = args.get("output") || input
  const registry = args.get("registry") || STORE_PATHS.sourceRegistry
  const write = readBoolean(args, "write", false)
  const network = readBoolean(args, "network", false)
  const sourceLookup = buildSourceLookup(registry)
  const rows = readJsonl(input)
  const run = createRunRecord({ kind: "candidate_reprocess" })

  const normalized = []
  for (const row of rows) {
    const cleaned = cleanRecordForReprocess(row)
    const normalizedRecord = normalizeCandidateRecord(cleaned)
    const geocoded = await geocodeRecord(normalizedRecord, { network })
    normalized.push({
      record: geocoded,
      source: findSourceForRecord(row, sourceLookup),
    })
  }

  const dedupe = dedupeRecords(normalized.map((item) => item.record))
  const duplicateByRecord = new Map(
    dedupe.duplicates.map((duplicate) => [duplicate.sourceRecordId, duplicate])
  )
  const normalizedBySourceRecord = new Map(
    normalized.map((item) => [item.record.sourceRecordId, item])
  )
  const finalRecords = dedupe.preservedRecords.map((record) => {
    const item = normalizedBySourceRecord.get(record.sourceRecordId)
    return attachQuality(
      record,
      item?.source ?? {},
      duplicateByRecord.get(record.sourceRecordId)
    )
  })
  const finished = finishRunRecord(run, {
    parsed_count: rows.length,
    normalized_count: normalized.length,
    classified_count: normalized.length,
    deduped_count: dedupe.duplicates.length,
    flagged_count: finalRecords.filter((record) => record.qualityFlags?.length)
      .length,
    errors: [],
  })

  if (!write) {
    console.log(
      `Dry run: reprocessed ${rows.length} candidate records from ${input}; output ${finalRecords.length}, duplicate candidates ${dedupe.duplicates.length}, flagged ${finished.flagged_count}.`
    )
    return
  }

  writeJsonl(output, finalRecords)
  appendJsonl(STORE_PATHS.runs, [finished])
  console.log(
    `Wrote ${finalRecords.length} reprocessed candidate records to ${output}; run ${finished.run_id} saved.`
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }
  await reprocessCandidates(args)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
