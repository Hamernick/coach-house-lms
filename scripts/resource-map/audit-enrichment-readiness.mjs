#!/usr/bin/env node
import {
  analyzeResourceEnrichmentReadiness,
  summarizeResourceEnrichmentReadiness,
} from "./lib/enrichment-quality.mjs"
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

function printText(summary, results, input) {
  console.log("Resource enrichment readiness audit")
  console.log(`Input: ${input}`)
  console.log(`Records: ${summary.totalRecords}`)
  console.log(`Publishable: ${summary.publishableRecords}`)
  console.log("Top gaps:")
  for (const [code, count] of Object.entries(summary.gapCounts).sort(
    (left, right) => right[1] - left[1]
  )) {
    console.log(`- ${code}: ${count}`)
  }
  console.log("Samples needing review:")
  for (const result of results
    .filter((item) => !item.publishable)
    .slice(0, 10)) {
    console.log(
      `- ${result.title ?? result.recordId ?? "Untitled"}: ${result.blockingGaps
        .map((gap) => gap.code)
        .join(", ")}`
    )
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  if (!input || args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:audit-enrichment -- --input <records.jsonl> [--json] [--require-publishable]"
    )
    process.exit(input ? 0 : 1)
  }

  const records = readResourceMapRecords(String(input))
  const results = records.map(analyzeResourceEnrichmentReadiness)
  const summary = summarizeResourceEnrichmentReadiness(results)

  if (args.has("json")) {
    console.log(JSON.stringify({ input, results, summary }, null, 2))
  } else {
    printText(summary, results, input)
  }

  if (
    args.has("require-publishable") &&
    summary.publishableRecords !== records.length
  ) {
    process.exitCode = 1
  }
}

main()
