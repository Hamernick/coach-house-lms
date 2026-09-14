#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"

import {
  ENGINE_DIR,
  parseArgs,
  readArgList,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import {
  collectIrsEoServiceEvidence,
  normalizeIrsEoServiceEvidenceCacheEntry,
} from "./lib/irs-eo-service-evidence.mjs"

const EO_DIR = join(ENGINE_DIR, "eo")
const DEFAULT_INPUT = join(EO_DIR, "research-results.jsonl")
const DEFAULT_CACHE = join(EO_DIR, "service-evidence-cache.jsonl")
const DEFAULT_WEBSITE_CACHE = join(EO_DIR, "website-fetch-cache.jsonl")
const DEFAULT_OUTPUT = join(EO_DIR, "service-evidence-results.jsonl")
const DEFAULT_EVIDENCE = join(EO_DIR, "service-evidence.jsonl")
const DEFAULT_REPORT = join(EO_DIR, "service-evidence-report.json")

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:eo-collect-service-evidence -- --ein <ein> --max-records 1",
    "  pnpm resource-map:eo-collect-service-evidence -- --ein <ein> --network true --write",
    "",
    "Fetches bounded provider-linked service pages and retains deterministic field evidence.",
    "Network and writes are separate opt-ins. No AI, review, publication, database, or deployment action is performed.",
  ].join("\n")
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function atomicWrite(filePath, body) {
  mkdirSync(dirname(filePath), { recursive: true })
  const temporary = `${filePath}.tmp-${process.pid}`
  rmSync(temporary, { force: true })
  try {
    writeFileSync(temporary, body, { encoding: "utf8", flag: "wx" })
    renameSync(temporary, filePath)
  } catch (error) {
    rmSync(temporary, { force: true })
    throw error
  }
}

function jsonlBody(rows) {
  return rows.length
    ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`
    : ""
}

function mergeCacheRows(current, incoming) {
  const byUrl = new Map()
  for (const row of [...current, ...incoming]) {
    const normalized = normalizeIrsEoServiceEvidenceCacheEntry(row)
    if (!normalized) continue
    const previous = byUrl.get(normalized.url)
    if (
      !previous ||
      Date.parse(normalized.fetchedAt) >= Date.parse(previous.fetchedAt)
    ) {
      byUrl.set(normalized.url, normalized)
    }
  }
  return [...byUrl.values()].sort((left, right) =>
    left.url.localeCompare(right.url)
  )
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row.counts[key] ?? 0), 0)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help") || args.has("h")) {
    console.log(usage())
    return
  }
  const input = resolve(readString(args.get("input"), DEFAULT_INPUT))
  const cachePath = resolve(readString(args.get("cache"), DEFAULT_CACHE))
  const websiteCachePath = resolve(
    readString(args.get("website-cache"), DEFAULT_WEBSITE_CACHE)
  )
  const outputPath = resolve(readString(args.get("output"), DEFAULT_OUTPUT))
  const evidencePath = resolve(
    readString(args.get("evidence"), DEFAULT_EVIDENCE)
  )
  const reportPath = resolve(readString(args.get("report"), DEFAULT_REPORT))
  const network = readBoolean(args, "network", false)
  const write = readBoolean(args, "write", false)
  const maxRecords = positiveInteger(args.get("max-records"), 10)
  const maxPages = positiveInteger(args.get("max-pages"), 3)
  const maxAgeDays = positiveInteger(args.get("cache-max-age-days"), 30)
  const selectedEins = new Set(readArgList(args, "ein"))

  if (!existsSync(input))
    throw new Error(`Research result input not found: ${input}`)
  const inputRows = readJsonl(input)
  const eligibleRows = inputRows
    .filter((row) => row.providerIdentitySupported === true)
    .filter((row) =>
      ["website_matched", "evidence_fetched"].includes(row.acquisitionStatus)
    )
    .filter((row) => selectedEins.size === 0 || selectedEins.has(row.ein))
    .slice(0, maxRecords)
  const existingCache = existsSync(cachePath) ? readJsonl(cachePath) : []
  const websiteCacheSeeds = existsSync(websiteCachePath)
    ? readJsonl(websiteCachePath)
        .filter((row) => row?.snapshot?.pageEvidence?.textExcerpt)
        .map((row) =>
          normalizeIrsEoServiceEvidenceCacheEntry({
            fetchedAt: row.fetchedAt,
            snapshot: row.snapshot,
            url: row.url,
          })
        )
        .filter(Boolean)
    : []
  const mergedExistingCache = mergeCacheRows(existingCache, websiteCacheSeeds)
  const cacheByUrl = new Map(mergedExistingCache.map((row) => [row.url, row]))
  const collections = []
  const now = new Date()

  for (const researchResult of eligibleRows) {
    collections.push(
      await collectIrsEoServiceEvidence({
        researchResult,
        cacheByUrl,
        network,
        maxPages,
        maxAgeDays,
        now,
      })
    )
  }

  const cacheWrites = collections.flatMap((row) => row.cacheWrites)
  const mergedCache = mergeCacheRows(mergedExistingCache, cacheWrites)
  const researchResults = collections.map((row) => row.researchResult)
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_service_evidence_report",
    createdAt: now.toISOString(),
    dryRun: !write,
    networkEnabled: network,
    publicationBlocked: true,
    counts: {
      inputResults: inputRows.length,
      eligibleResults: eligibleRows.length,
      outputResults: researchResults.length,
      attemptedPages: collections.reduce(
        (total, row) => total + row.attemptedPageCount,
        0
      ),
      fetchedPages: sum(collections, "fetchedPages"),
      fieldEvidence: sum(collections, "fieldEvidence"),
      serviceEvidence: sum(collections, "serviceEvidence"),
      evidenceFetched: sum(collections, "advanced"),
      websiteMatched: researchResults.filter(
        (result) => result.acquisitionStatus === "website_matched"
      ).length,
      cacheHits: sum(collections, "cacheHits"),
      websiteCacheSeeds: websiteCacheSeeds.length,
      cacheWrites: cacheWrites.length,
      networkRequests: sum(collections, "networkRequests"),
      needsNetwork: sum(collections, "needsNetwork"),
      aiCalls: 0,
      reviewed: 0,
      published: 0,
    },
    outputs: write
      ? { cache: cachePath, evidence: evidencePath, results: outputPath }
      : null,
  }

  if (write) {
    atomicWrite(cachePath, jsonlBody(mergedCache))
    atomicWrite(evidencePath, jsonlBody(collections))
    atomicWrite(outputPath, jsonlBody(researchResults))
    atomicWrite(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
