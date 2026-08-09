#!/usr/bin/env node
import { mkdir, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  applyProviderPageComparison,
  compareProviderPageSnapshot,
  fetchProviderPageSnapshot,
  readProviderWebsite,
} from "./lib/provider-page-comparison.mjs"
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

async function mapConcurrent(values, concurrency, mapper) {
  const results = new Array(values.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker)
  )
  return results
}

async function writeJsonlAtomically(output, records) {
  const temporary = `${output}.tmp-${process.pid}`
  await mkdir(path.dirname(output), { recursive: true })
  await rm(temporary, { force: true })
  try {
    await writeFile(
      temporary,
      `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
      { encoding: "utf8", flag: "wx" }
    )
    await rename(temporary, output)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = String(args.get("input") ?? "").trim()
  const output = String(args.get("output") ?? "").trim()
  if (!input || !output) {
    throw new Error(
      "Usage: pnpm resource-map:verify-provider-pages -- --input <records.jsonl> --output <verified.jsonl> --network true [--write]"
    )
  }
  if (String(args.get("network")) !== "true") {
    throw new Error("Network access requires --network true.")
  }
  const records = readResourceMapRecords(input)
  const onlyNeedsComparison = Boolean(args.get("only-needs-comparison"))
  const checkedAt = new Date().toISOString()
  const concurrency = Math.max(
    1,
    Number.parseInt(String(args.get("concurrency") ?? "10"), 10)
  )
  const snapshotCache = new Map()
  const enriched = await mapConcurrent(records, concurrency, async (record) => {
    const fields = record.extractedFields ?? record.extracted_fields ?? {}
    if (
      onlyNeedsComparison &&
      Number(fields.enrichment?.sourceComparisonCount ?? 0) >= 2
    ) {
      return record
    }
    const websiteUrl = readProviderWebsite(record)
    if (!websiteUrl) {
      return applyProviderPageComparison(record, {
        checkedAt,
        fetchStatus: "no_website",
        status: "no_website",
        websiteUrl: null,
      })
    }
    if (!snapshotCache.has(websiteUrl)) {
      snapshotCache.set(
        websiteUrl,
        fetchProviderPageSnapshot(websiteUrl, { checkedAt })
      )
    }
    const snapshot = await snapshotCache.get(websiteUrl)
    return applyProviderPageComparison(
      record,
      compareProviderPageSnapshot(record, snapshot)
    )
  })
  const counts = {}
  let removedLinks = 0
  for (let index = 0; index < enriched.length; index += 1) {
    const comparison =
      enriched[index].extractedFields?.enrichment?.providerPageComparison ?? {}
    const status =
      comparison.status ??
      (Number(
        enriched[index].extractedFields?.enrichment?.sourceComparisonCount ?? 0
      ) >= 2
        ? "already_compared"
        : "not_checked")
    counts[status] = (counts[status] ?? 0) + 1
    if (
      readProviderWebsite(records[index]) &&
      !readProviderWebsite(enriched[index])
    ) {
      removedLinks += 1
    }
  }
  console.log(
    `Compared ${records.length} records across ${snapshotCache.size} provider URLs: ${Object.entries(
      counts
    )
      .map(([status, count]) => `${status}=${count}`)
      .join(", ")}; removed unsafe/dead links=${removedLinks}.`
  )
  if (args.has("write")) {
    const outputRecords = args.has("output-checked-only")
      ? enriched.filter(
          (_record, index) =>
            Number(
              records[index].extractedFields?.enrichment
                ?.sourceComparisonCount ?? 0
            ) < 2
        )
      : enriched
    await writeJsonlAtomically(output, outputRecords)
    console.log(`Wrote ${output} atomically.`)
  } else {
    console.log("Dry run only; no JSONL written.")
  }
}

await main()
