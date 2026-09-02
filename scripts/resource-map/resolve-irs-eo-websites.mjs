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
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import {
  normalizeIrsEoWebsiteCandidateSet,
  normalizeIrsEoWebsiteSnapshotCacheEntry,
  resolveIrsEoProviderWebsite,
} from "./lib/irs-eo-website-resolution.mjs"

const DEFAULT_INPUT = join(ENGINE_DIR, "eo", "current-work-items.jsonl")
const DEFAULT_CANDIDATES = join(
  ENGINE_DIR,
  "eo",
  "website-search-candidates.jsonl"
)
const DEFAULT_CACHE = join(ENGINE_DIR, "eo", "website-fetch-cache.jsonl")
const DEFAULT_OUTPUT = join(
  ENGINE_DIR,
  "eo",
  "website-resolution-results.jsonl"
)
const DEFAULT_EVIDENCE = join(
  ENGINE_DIR,
  "eo",
  "website-resolution-evidence.jsonl"
)
const DEFAULT_REPORT = join(ENGINE_DIR, "eo", "website-resolution-report.json")

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:eo-resolve-websites -- --candidates <search-candidates.jsonl>",
    "  pnpm resource-map:eo-resolve-websites -- --candidates <search-candidates.jsonl> --network true --write",
    "",
    "Checks bounded provider-website candidates against IRS EO identities.",
    "Network access and local writes are separate opt-ins. No AI, review, publication, database, or deployment action is performed.",
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

function mergeCacheRows(existing, incoming) {
  const byUrl = new Map()
  for (const row of [...existing, ...incoming]) {
    const normalized = normalizeIrsEoWebsiteSnapshotCacheEntry(row)
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

function sum(rows, readValue) {
  return rows.reduce((total, row) => total + Number(readValue(row) ?? 0), 0)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help") || args.has("h")) {
    console.log(usage())
    return
  }
  const input = resolve(readString(args.get("input"), DEFAULT_INPUT))
  const candidatesPath = resolve(
    readString(args.get("candidates"), DEFAULT_CANDIDATES)
  )
  const cachePath = resolve(readString(args.get("cache"), DEFAULT_CACHE))
  const outputPath = resolve(readString(args.get("output"), DEFAULT_OUTPUT))
  const evidencePath = resolve(
    readString(args.get("evidence"), DEFAULT_EVIDENCE)
  )
  const reportPath = resolve(readString(args.get("report"), DEFAULT_REPORT))
  const network = readBoolean(args, "network", false)
  const write = readBoolean(args, "write", false)
  const maxRecords = positiveInteger(args.get("max-records"), 25)
  const maxCandidates = positiveInteger(args.get("max-candidates"), 3)
  const maxAgeDays = positiveInteger(args.get("cache-max-age-days"), 30)

  if (!existsSync(input)) throw new Error(`Work-item input not found: ${input}`)
  if (!existsSync(candidatesPath)) {
    throw new Error(`Website candidate input not found: ${candidatesPath}`)
  }

  const workItems = readJsonl(input)
  const workItemByEin = new Map(workItems.map((item) => [item.ein, item]))
  const candidateSets = readJsonl(candidatesPath)
    .map(normalizeIrsEoWebsiteCandidateSet)
    .filter((set) => workItemByEin.has(set.ein))
    .slice(0, maxRecords)
  const existingCache = existsSync(cachePath) ? readJsonl(cachePath) : []
  const mergedExistingCache = mergeCacheRows(existingCache, [])
  const cacheByUrl = new Map(
    mergedExistingCache.map((entry) => [entry.url, entry])
  )
  const resolutions = []
  const now = new Date()

  for (const candidateSet of candidateSets) {
    resolutions.push(
      await resolveIrsEoProviderWebsite({
        workItem: workItemByEin.get(candidateSet.ein),
        candidateSet,
        cacheByUrl,
        network,
        maxCandidates,
        maxAgeDays,
        now,
      })
    )
  }

  const researchResults = resolutions
    .map((resolution) => resolution.researchResult)
    .filter(Boolean)
  const cacheWrites = resolutions.flatMap(
    (resolution) => resolution.cacheWrites
  )
  const mergedCache = mergeCacheRows(mergedExistingCache, cacheWrites)
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_website_resolution_report",
    createdAt: now.toISOString(),
    dryRun: !write,
    networkEnabled: network,
    publicationBlocked: true,
    counts: {
      inputWorkItems: workItems.length,
      candidateSets: candidateSets.length,
      results: researchResults.length,
      websiteMatched: researchResults.filter(
        (result) => result.acquisitionStatus === "website_matched"
      ).length,
      held: researchResults.filter(
        (result) => result.acquisitionStatus === "held"
      ).length,
      needsNetwork: resolutions.filter(
        (resolution) => resolution.resolutionStatus === "needs_network"
      ).length,
      cacheHits: sum(resolutions, (resolution) => resolution.counts.cacheHits),
      cacheWrites: cacheWrites.length,
      networkRequests: sum(
        resolutions,
        (resolution) => resolution.counts.networkRequests
      ),
      aiCalls: 0,
      reviewed: 0,
      published: 0,
    },
    outputs: write
      ? {
          cache: cachePath,
          evidence: evidencePath,
          results: outputPath,
        }
      : null,
  }

  if (write) {
    atomicWrite(cachePath, jsonlBody(mergedCache))
    atomicWrite(evidencePath, jsonlBody(resolutions))
    atomicWrite(outputPath, jsonlBody(researchResults))
    atomicWrite(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
