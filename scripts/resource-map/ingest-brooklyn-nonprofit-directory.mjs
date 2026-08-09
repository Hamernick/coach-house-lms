#!/usr/bin/env node
import { readFileSync } from "node:fs"

import {
  BROOKLYN_NONPROFIT_DIRECTORY_DEFAULTS,
  BROOKLYN_NONPROFIT_DIRECTORY_SOURCE,
  buildBrooklynNonprofitDirectoryRecords,
} from "./lib/brooklyn-nonprofit-directory.mjs"
import { geocodeRecord } from "./lib/data-engine/geocoder.mjs"
import { normalizeCandidateRecord } from "./lib/data-engine/normalizer.mjs"
import { parseExcelRows } from "./lib/data-engine/parsers.mjs"
import { attachQuality } from "./lib/data-engine/quality.mjs"
import {
  parseArgs,
  readBoolean,
  writeJsonl,
} from "./lib/data-engine/shared.mjs"
import { createEnrichmentCoverageAccumulator } from "./lib/enrichment-coverage.mjs"

const DEFAULT_OUTPUT =
  "data/resource-map/.engine/brooklyn-nyc-nonprofit-directory-2026-07-30.jsonl"

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:ingest-brooklyn-directory -- --input <workbook.xlsx>",
    "  pnpm resource-map:ingest-brooklyn-directory -- --input <workbook.xlsx> --write [--network true] [--output <records.jsonl>]",
    "",
    "Parses the July 2026 Brooklyn/NYC workbook into held, source-linked resource-map candidates.",
    "Dry-run by default. Network geocoding is disabled unless explicitly enabled.",
  ].join("\n")
}

function count(records, predicate) {
  return records.filter(predicate).length
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }
  const input = String(args.get("input") ?? "").trim()
  if (!input) throw new Error("--input is required.")
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  const write = readBoolean(args, "write", false)
  const network = readBoolean(args, "network", false)
  const buffer = readFileSync(input)
  const rows = parseExcelRows(
    buffer.toString("base64"),
    { raw_payload: { rawTextEncoding: "base64" } },
    BROOKLYN_NONPROFIT_DIRECTORY_SOURCE
  )
  if (
    rows.length !== BROOKLYN_NONPROFIT_DIRECTORY_DEFAULTS.expectedWorkbookRows
  ) {
    throw new Error(
      `Expected ${BROOKLYN_NONPROFIT_DIRECTORY_DEFAULTS.expectedWorkbookRows} workbook rows; found ${rows.length}.`
    )
  }

  const extracted = buildBrooklynNonprofitDirectoryRecords(rows)
  const records = []
  for (const [index, item] of extracted.entries()) {
    const normalized = normalizeCandidateRecord(item)
    const geocoded = await geocodeRecord(normalized, { network })
    records.push(attachQuality(geocoded, BROOKLYN_NONPROFIT_DIRECTORY_SOURCE))
    if (network && (index + 1) % 100 === 0) {
      console.log(`Geocoded ${index + 1}/${extracted.length} candidates.`)
    }
  }

  const coverage = createEnrichmentCoverageAccumulator()
  for (const record of records) coverage.add(record)
  const summary = coverage.summary().total
  const physical = count(
    records,
    (record) => record.extractedFields.locationType === "physical"
  )
  const mappable = count(
    records,
    (record) =>
      Number.isFinite(record.extractedFields.latitude) &&
      Number.isFinite(record.extractedFields.longitude)
  )
  const providerWebsite = count(records, (record) =>
    Boolean(record.extractedFields.websiteUrl)
  )
  const coordinateWarnings = count(records, (record) =>
    record.extractedFields.enrichment.qualityNotes.includes(
      "source_coordinates_not_safely_assignable"
    )
  )

  console.log(
    `Parsed ${rows.length} workbook organizations into ${records.length} location-aware candidates.`
  )
  console.log(
    `Physical=${physical}; mappable=${mappable}; provider websites=${providerWebsite}; coordinate holds=${coordinateWarnings}.`
  )
  console.log(
    `Coverage: complete=${summary.complete}/${summary.total}; publishable=${summary.publishable}/${summary.total}.`
  )
  console.log(
    `Fields: ${Object.entries(summary.metrics)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ")}.`
  )
  if (!write) {
    console.log("Dry run only; no candidate file written.")
    return
  }
  writeJsonl(output, records)
  console.log(`Wrote ${output}. No records were published.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
