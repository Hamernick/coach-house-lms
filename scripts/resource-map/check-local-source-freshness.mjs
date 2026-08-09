#!/usr/bin/env node
import {
  STORE_PATHS,
  appendJsonl,
  createRunRecord,
  finishRunRecord,
  parseArgs,
  readBoolean,
  readJsonl,
} from "./lib/data-engine/shared.mjs"
import {
  buildLocalSourceFreshnessReport,
  normalizeStaleDays,
} from "./lib/data-engine/source-freshness.mjs"

function usage() {
  return [
    "Usage:",
    "  pnpm data:source-freshness",
    "  pnpm data:source-freshness -- --stale-days 30 --only-stale",
    "  pnpm data:source-freshness -- --json --write",
    "",
    "Reads local source-registry/raw-payload stores only; no Supabase or network calls.",
  ].join("\n")
}

function printReport(report) {
  if (report.length === 0) {
    console.log("No matching local source freshness rows.")
    return
  }

  for (const item of report) {
    const age = item.daysOld === null ? "never" : `${item.daysOld}d`
    console.log(
      `${item.status.padEnd(13)} ${age.padStart(7)} ${item.sourceId} - ${
        item.name
      }`
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }

  const staleDays = normalizeStaleDays(args.get("stale-days"), 90)
  const onlyStale = readBoolean(args, "only-stale", false)
  const json = readBoolean(args, "json", false)
  const write = readBoolean(args, "write", false)
  const sources = readJsonl(args.get("registry") || STORE_PATHS.sourceRegistry)
  const rawRows = readJsonl(STORE_PATHS.rawPayloads)
  const report = buildLocalSourceFreshnessReport({
    sources,
    rawRows,
    staleDays,
  }).filter((item) => !onlyStale || item.status !== "current")
  const run = finishRunRecord(createRunRecord({ kind: "stale_source_check" }), {
    parsed_count: sources.length,
    flagged_count: report.filter((item) => item.status !== "current").length,
    errors: report
      .filter((item) => item.status === "failed")
      .map((item) => ({
        sourceId: item.sourceId,
        status: item.status,
        failedFetchCount: item.failedFetchCount,
      })),
  })

  if (write) {
    appendJsonl(STORE_PATHS.sourceFreshness, report)
    appendJsonl(STORE_PATHS.runs, [run])
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  printReport(report)
  if (write) {
    console.log(`Saved report to ${STORE_PATHS.sourceFreshness}.`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
