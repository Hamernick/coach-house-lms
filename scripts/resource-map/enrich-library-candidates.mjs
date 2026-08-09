#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import { analyzeResourceEnrichmentReadiness } from "./lib/enrichment-quality.mjs"
import { enrichLibraryRecord } from "./lib/library-enrichment.mjs"
import {
  parseResourceMapRecords,
  readResourceMapRecords,
} from "./lib/read-records.mjs"

const DEFAULT_OUTPUT =
  "data/resource-map/.engine/chicago-library-enriched.jsonl"

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

function recordId(record) {
  return String(
    record.sourceRecordId ?? record.source_record_id ?? record.id ?? ""
  )
}

function normalizeLimit(value, maximum) {
  if (value === undefined) return maximum
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed)) return maximum
  return Math.min(Math.max(parsed, 1), maximum)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  const evidenceInput = args.get("evidence")
  if (!input || !evidenceInput || args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:enrich-library -- --input <records.jsonl> --evidence <source-evidence.jsonl> [--limit 81] [--write] [--output <file>]"
    )
    process.exit(input && evidenceInput ? 0 : 1)
  }

  const records = readResourceMapRecords(String(input))
  const evidenceRecords = parseResourceMapRecords(
    readFileSync(String(evidenceInput), "utf8"),
    { label: String(evidenceInput) }
  )
  const evidenceById = new Map(
    evidenceRecords.map((evidence) => [
      String(evidence.recordId ?? ""),
      evidence,
    ])
  )
  const matched = records.filter((record) => evidenceById.has(recordId(record)))
  const limit = normalizeLimit(args.get("limit"), matched.length)
  const enriched = matched.slice(0, limit).map((record) =>
    enrichLibraryRecord({
      evidence: evidenceById.get(recordId(record)),
      record,
    })
  )
  const readiness = enriched.map(analyzeResourceEnrichmentReadiness)
  const publishable = readiness.filter((result) => result.publishable).length
  const blocked = readiness.filter((result) => !result.publishable)
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)

  console.log(
    `${enriched.length} library records enriched from retained official source evidence; ${publishable} pass the publication contract and ${blocked.length} require review.`
  )
  for (const result of blocked.slice(0, 10)) {
    console.log(
      `- ${result.title ?? result.recordId}: ${result.blockingGaps
        .map((gap) => gap.code)
        .join(", ")}`
    )
  }

  if (!args.has("write")) {
    console.log(`Dry run only. Add --write to save ${output}.`)
    return
  }

  mkdirSync(path.dirname(output), { recursive: true })
  writeFileSync(
    output,
    `${enriched.map((record) => JSON.stringify(record)).join("\n")}\n`,
    "utf8"
  )
  console.log(`Wrote ${enriched.length} records to ${output}.`)
}

main()
