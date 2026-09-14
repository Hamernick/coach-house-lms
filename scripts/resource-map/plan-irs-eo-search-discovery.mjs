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
  buildIrsEoSearchPlan,
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

function jsonlBody(rows) {
  return rows.length
    ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`
    : ""
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const packageArgument = readString(args.get("package"))
  if (!packageArgument) throw new Error("A valid --package file is required.")
  const packagePath = resolve(packageArgument)
  if (!existsSync(packagePath)) {
    throw new Error("A valid --package file is required.")
  }
  const workPackage = JSON.parse(readFileSync(packagePath, "utf8"))
  const adapterResultsPath = readString(args.get("adapter-results"))
    ? resolve(args.get("adapter-results"))
    : null
  if (adapterResultsPath && !existsSync(adapterResultsPath)) {
    throw new Error(`Search adapter results not found: ${adapterResultsPath}`)
  }
  const write = readBoolean(args, "write", false)
  const outputDirectory = resolve(
    readString(
      args.get("output-directory"),
      join(ENGINE_DIR, "eo", "search", workPackage.packageId)
    )
  )
  const searchPlan = buildIrsEoSearchPlan(workPackage)
  const adapterRows = adapterResultsPath ? readJsonl(adapterResultsPath) : []
  const normalized = adapterResultsPath
    ? normalizeIrsEoSearchAdapterResults(searchPlan, adapterRows)
    : null
  const fetchPlan = normalized
    ? buildSharedProviderFetchPlan(normalized.candidateSets, {
        maxNetworkRequests: readPositiveInteger(
          args.get("max-fetches"),
          workPackage.budgets.maxHttpRequests
        ),
        maxPerHost: readPositiveInteger(args.get("max-per-host"), 3),
        maxRetainedBytes: workPackage.budgets.maxRetainedBytes,
        packageId: searchPlan.packageId,
        parentPlanHash: searchPlan.planHash,
      })
    : null
  const telemetry = normalized
    ? buildSearchStageTelemetry({
        packageId: workPackage.packageId,
        adapterRows,
        normalizedCounts: normalized.counts,
        fetchPlan,
      })
    : null
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_search_discovery_report",
    dryRun: !write,
    packageId: workPackage.packageId,
    searchPlanHash: searchPlan.planHash,
    fetchPlanHash: fetchPlan?.planHash ?? null,
    counts: {
      records: workPackage.records.length,
      searchRequests: searchPlan.requests.length,
      adapterRows: adapterRows.length,
      candidates: normalized?.counts.candidates ?? 0,
      uniqueFetches: fetchPlan?.counts.selected ?? 0,
      sharedUrlConsumers: fetchPlan?.counts.sharedUrlConsumers ?? 0,
      uniqueHosts: fetchPlan?.counts.uniqueHosts ?? 0,
      robotsChecks: fetchPlan?.counts.robotsChecks ?? 0,
      plannedNetworkRequests: fetchPlan?.counts.plannedNetworkRequests ?? 0,
      networkRequests: 0,
      aiCalls: 0,
      databaseWrites: 0,
      reviewed: 0,
      published: 0,
    },
    outputs: write
      ? {
          searchPlan: join(outputDirectory, "search-plan.json"),
          candidateSets: normalized
            ? join(outputDirectory, "candidate-sets.jsonl")
            : null,
          fetchPlan: fetchPlan
            ? join(outputDirectory, "fetch-plan.json")
            : null,
          telemetry: telemetry ? join(outputDirectory, "telemetry.json") : null,
        }
      : null,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }

  if (write) {
    atomicWrite(
      join(outputDirectory, "search-plan.json"),
      `${JSON.stringify(searchPlan, null, 2)}\n`
    )
    if (normalized) {
      atomicWrite(
        join(outputDirectory, "candidate-sets.jsonl"),
        jsonlBody(normalized.candidateSets)
      )
      atomicWrite(
        join(outputDirectory, "fetch-plan.json"),
        `${JSON.stringify(fetchPlan, null, 2)}\n`
      )
      atomicWrite(
        join(outputDirectory, "telemetry.json"),
        `${JSON.stringify(telemetry, null, 2)}\n`
      )
    }
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
