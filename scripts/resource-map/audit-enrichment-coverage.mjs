#!/usr/bin/env node
import { summarizeEnrichmentCoverage } from "./lib/enrichment-coverage.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

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

function percentage(count, total) {
  return total === 0 ? "0.0" : ((count / total) * 100).toFixed(1)
}

function printSummary(summary, input) {
  console.log(`Resource enrichment coverage: ${input}`)
  console.log(
    `All records: ${summary.total.total}; complete: ${summary.total.complete} (${percentage(summary.total.complete, summary.total.total)}%); publishable: ${summary.total.publishable} (${percentage(summary.total.publishable, summary.total.total)}%)`
  )
  console.log("Field coverage:")
  for (const key of summary.metricKeys) {
    const count = summary.total.metrics[key]
    console.log(
      `- ${key}: ${count}/${summary.total.total} (${percentage(count, summary.total.total)}%)`
    )
  }
  console.log("Sources:")
  for (const source of summary.sources) {
    console.log(
      `- ${source.sourceId}: ${source.total} records; ${source.complete} complete; ${source.publishable} publishable`
    )
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  if (!input || args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:audit-coverage -- --input <records.jsonl> [--json] [--require-complete]"
    )
    process.exit(input ? 0 : 1)
  }

  const records = readResourceMapRecords(String(input))
  const summary = summarizeEnrichmentCoverage(records)
  if (args.has("json"))
    console.log(JSON.stringify({ input, ...summary }, null, 2))
  else printSummary(summary, input)

  if (
    args.has("require-complete") &&
    summary.total.complete !== records.length
  ) {
    process.exitCode = 1
  }
}

main()
