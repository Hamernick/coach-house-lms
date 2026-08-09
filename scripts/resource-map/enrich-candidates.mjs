#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import {
  createResourceEnrichmentClient,
  runResourceEnrichment,
} from "./lib/ai-enrichment.mjs"
import {
  parseResourceMapRecords,
  readResourceMapRecords,
} from "./lib/read-records.mjs"

const DEFAULT_OUTPUT = "data/resource-map/.engine/enriched-candidates.jsonl"

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

function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value ?? "5"), 10)
  if (!Number.isFinite(parsed)) return 5
  return Math.min(Math.max(parsed, 1), 100)
}

function recordId(record) {
  return String(
    record.sourceRecordId ?? record.source_record_id ?? record.id ?? ""
  )
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  const evidenceInput = args.get("evidence")
  if (!input || !evidenceInput || args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:enrich -- --input <records.jsonl> --evidence <source-evidence.jsonl> [--source <id>] [--limit 5] [--network true] [--write] [--output <file>]"
    )
    process.exit(input && evidenceInput ? 0 : 1)
  }

  const limit = normalizeLimit(args.get("limit"))
  const records = filterRecords(
    readResourceMapRecords(String(input)),
    args.get("source")
  ).slice(0, limit)
  const evidenceRecords = parseResourceMapRecords(
    readFileSync(String(evidenceInput), "utf8"),
    { label: String(evidenceInput) }
  )
  const evidenceByRecordId = new Map(
    evidenceRecords.map((evidence) => [
      String(evidence.recordId ?? ""),
      evidence,
    ])
  )
  const ready = records.filter(
    (record) => evidenceByRecordId.get(recordId(record))?.status === "fetched"
  )

  if (String(args.get("network")) !== "true") {
    console.log(
      `Dry run: ${ready.length}/${records.length} records have fetched provider evidence and are ready for two-pass AI enrichment. Re-run with --network true; add --write to persist a separate enriched JSONL.`
    )
    return
  }

  const client = createResourceEnrichmentClient()
  const enriched = []
  for (const record of ready) {
    enriched.push(
      await runResourceEnrichment({
        client,
        model: args.get("model"),
        providerEvidence: evidenceByRecordId.get(recordId(record)),
        record,
        verifierModel: args.get("verifier-model"),
      })
    )
  }
  console.log(
    `Completed draft and independent verification passes for ${enriched.length}/${records.length} records.`
  )

  if (!args.has("write")) {
    console.log("Dry run: add --write to persist the enriched JSONL.")
    return
  }

  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  mkdirSync(path.dirname(output), { recursive: true })
  writeFileSync(
    output,
    `${enriched.map((record) => JSON.stringify(record)).join("\n")}\n`
  )
  console.log(`Wrote ${enriched.length} enriched records to ${output}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
