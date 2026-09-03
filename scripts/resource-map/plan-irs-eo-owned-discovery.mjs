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
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import {
  runAuthoritativeDirectorySearchAdapter,
  runLocalEvidenceSearchAdapter,
} from "./lib/irs-eo-search-adapters.mjs"
import {
  buildIrsEoOwnedEvidenceIndex,
  runDeterministicDomainCandidateAdapter,
  runSelfHostedEvidenceIndexAdapter,
} from "./lib/irs-eo-owned-discovery.mjs"
import {
  buildSearchStageTelemetry,
  buildSharedProviderFetchPlan,
  normalizeIrsEoSearchAdapterResults,
} from "./lib/irs-eo-search-discovery.mjs"

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

function requiredPath(args, key) {
  const value = readString(args.get(key))
  if (!value) throw new Error(`--${key} is required.`)
  const filePath = resolve(value)
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  return filePath
}

function optionalRows(args, key) {
  const value = readString(args.get(key))
  if (!value) return []
  const filePath = resolve(value)
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`)
  return readJsonl(filePath)
}

function jsonl(rows) {
  return rows.length
    ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`
    : ""
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const planPath = requiredPath(args, "plan")
  const outputDirectory = resolve(
    readString(args.get("output-directory"), `${planPath}.owned-discovery`)
  )
  const write = readBoolean(args, "write", false)
  const plan = JSON.parse(readFileSync(planPath, "utf8"))
  const cacheRows = optionalRows(args, "candidate-cache")
  const directoryRows = optionalRows(args, "directory-records")
  const evidenceRows = optionalRows(args, "evidence-documents")
  const ownedIndex = buildIrsEoOwnedEvidenceIndex(evidenceRows)
  const adapterRows = [
    ...(cacheRows.length ? runLocalEvidenceSearchAdapter(plan, cacheRows) : []),
    ...(directoryRows.length
      ? runAuthoritativeDirectorySearchAdapter(plan, directoryRows).results
      : []),
    ...runSelfHostedEvidenceIndexAdapter(plan, ownedIndex),
    ...runDeterministicDomainCandidateAdapter(plan),
  ]
  const normalized = normalizeIrsEoSearchAdapterResults(plan, adapterRows)
  const fetchPlan = buildSharedProviderFetchPlan(normalized.candidateSets, {
    maxNetworkRequests: plan.ownedDiscoveryPolicy.maxCrawlerRequests,
    maxPerHost: plan.ownedDiscoveryPolicy.maxRequestsPerHost,
    maxRetainedBytes: plan.ownedDiscoveryPolicy.maxRetainedBytes,
    packageId: plan.packageId,
    parentPlanHash: plan.planHash,
  })
  const telemetry = buildSearchStageTelemetry({
    packageId: plan.packageId,
    adapterRows,
    normalizedCounts: normalized.counts,
    fetchPlan,
  })
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_owned_discovery_report",
    dryRun: !write,
    planHash: plan.planHash,
    counts: {
      evidenceDocuments: evidenceRows.length,
      indexedEvidence: ownedIndex.manifest.counts.entries,
      rejectedEvidence: ownedIndex.manifest.counts.rejectedRows,
      directoryRows: directoryRows.length,
      candidateCacheRows: cacheRows.length,
      adapterRows: adapterRows.length,
      candidates: normalized.counts.candidates,
      plannedCrawlerRequests: fetchPlan.counts.plannedNetworkRequests,
      networkRequests: 0,
      paidQueries: 0,
      aiCalls: 0,
      databaseWrites: 0,
      reviewed: 0,
      published: 0,
    },
    outputs: write
      ? {
          indexManifest: join(outputDirectory, "owned-index-manifest.json"),
          indexEntries: join(outputDirectory, "owned-index-entries.jsonl"),
          adapterResults: join(outputDirectory, "adapter-results.jsonl"),
          candidateSets: join(outputDirectory, "candidate-sets.jsonl"),
          fetchPlan: join(outputDirectory, "fetch-plan.json"),
          telemetry: join(outputDirectory, "telemetry.json"),
        }
      : null,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  if (write) {
    atomicWrite(
      join(outputDirectory, "owned-index-manifest.json"),
      `${JSON.stringify(ownedIndex.manifest, null, 2)}\n`
    )
    atomicWrite(
      join(outputDirectory, "owned-index-entries.jsonl"),
      jsonl(ownedIndex.entries)
    )
    atomicWrite(
      join(outputDirectory, "adapter-results.jsonl"),
      jsonl(adapterRows)
    )
    atomicWrite(
      join(outputDirectory, "candidate-sets.jsonl"),
      jsonl(normalized.candidateSets)
    )
    atomicWrite(
      join(outputDirectory, "fetch-plan.json"),
      `${JSON.stringify(fetchPlan, null, 2)}\n`
    )
    atomicWrite(
      join(outputDirectory, "telemetry.json"),
      `${JSON.stringify(telemetry, null, 2)}\n`
    )
    atomicWrite(
      join(outputDirectory, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`
    )
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
