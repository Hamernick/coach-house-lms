#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import { readResourceMapRecords } from "./lib/read-records.mjs"
import {
  collectSourceEvidence,
  selectProviderEvidenceUrl,
} from "./lib/source-evidence.mjs"

const DEFAULT_OUTPUT = "data/resource-map/.engine/source-evidence.jsonl"

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith("--")) continue
    const key = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) args.set(key, true)
    else {
      args.set(key, next)
      index += 1
    }
  }
  return args
}

function normalizeLimit(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  return Number.isFinite(parsed) ? Math.max(1, parsed) : fallback
}

function filterRecords(records, source) {
  if (!source) return records
  const normalized = String(source).trim().toLowerCase()
  return records.filter((record) =>
    [record.sourceId, record.source_id, record.sourceName, record.source_name]
      .filter(Boolean)
      .some((value) => String(value).trim().toLowerCase() === normalized)
  )
}

function buildPlan(records) {
  const planned = records
    .map((record) => ({ record, url: selectProviderEvidenceUrl(record) }))
    .filter((item) => item.url)
  const uniqueUrls = new Set(planned.map((item) => item.url))
  return {
    planned,
    records: records.length,
    recordsWithProviderEvidence: planned.length,
    uniqueProviderUrls: uniqueUrls.size,
  }
}

async function collect(records, concurrency) {
  const results = []
  let cursor = 0
  async function worker() {
    while (cursor < records.length) {
      const index = cursor
      cursor += 1
      results[index] = await collectSourceEvidence(records[index])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, records.length) }, worker)
  )
  return results
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  if (!input || args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:collect-evidence -- --input <records.jsonl> [--source <id>] [--limit 100] [--network true] [--write] [--output <file>]"
    )
    process.exit(input ? 0 : 1)
  }

  const source = args.get("source")
  const limit = normalizeLimit(args.get("limit"), 100)
  const concurrency = Math.min(normalizeLimit(args.get("concurrency"), 4), 8)
  const records = filterRecords(
    readResourceMapRecords(String(input)),
    source
  ).slice(0, limit)
  const plan = buildPlan(records)

  if (String(args.get("network")) !== "true") {
    console.log(
      `Dry run: ${plan.recordsWithProviderEvidence}/${plan.records} records have provider evidence URLs across ${plan.uniqueProviderUrls} unique pages. Re-run with --network true to fetch; add --write to persist results.`
    )
    return
  }

  const results = await collect(records, concurrency)
  const fetched = results.filter((result) => result.status === "fetched").length
  const failed = results.filter((result) => result.status === "failed").length
  const skipped = results.filter((result) => result.status === "skipped").length
  const comparisons = results.flatMap((result) => result.comparisons ?? [])
  const matchedComparisons = comparisons.filter(
    (comparison) => comparison.status === "matched"
  ).length
  const comparisonReviewItems = comparisons.length - matchedComparisons
  console.log(
    `Collected source evidence for ${fetched}/${results.length} records; failed ${failed}; skipped ${skipped}; field comparisons matched ${matchedComparisons}/${comparisons.length}; review items ${comparisonReviewItems}.`
  )

  if (!args.has("write")) {
    console.log("Dry run: add --write to persist evidence JSONL.")
    return
  }

  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  mkdirSync(path.dirname(output), { recursive: true })
  writeFileSync(
    output,
    `${results.map((result) => JSON.stringify(result)).join("\n")}\n`
  )
  console.log(`Wrote ${results.length} evidence records to ${output}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
