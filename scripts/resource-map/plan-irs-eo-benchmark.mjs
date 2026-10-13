#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"

import {
  ENGINE_DIR,
  nowIso,
  parseArgs,
  readArgList,
  readBoolean,
  readJsonl,
  readString,
  sha256,
} from "./lib/data-engine/shared.mjs"
import {
  applyIrsEoQueueNameHints,
  buildIrsEoDiscoveryCandidate,
  readIrsEoCsvRows,
} from "./lib/irs-eo-acquisition.mjs"
import {
  createIrsEoBenchmarkSampler,
  IRS_EO_BENCHMARK_SCHEMA_VERSION,
  summarizeIrsEoBenchmark,
} from "./lib/irs-eo-benchmark.mjs"
import {
  buildIrsEoIdentityEvents,
  replayIrsEoResearchEvents,
} from "./lib/irs-eo-research-control-plane.mjs"

const DEFAULT_DIRECTORY = join(ENGINE_DIR, "eo", "benchmark")
const DEFAULT_RESULTS = join(ENGINE_DIR, "eo", "research-results.jsonl")

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:eo-plan-benchmark -- --input <eo1.csv,eo2.csv,...>",
    "  pnpm resource-map:eo-plan-benchmark -- --input <files> --sample 10000 --write",
    "",
    "Builds a deterministic, stratified benchmark from the full deduplicated IRS corpus.",
    "Dry-run by default. It makes no network, AI, database, review, or publication calls.",
  ].join("\n")
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function atomicWrite(filePath, body) {
  mkdirSync(dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.tmp`
  if (existsSync(tempPath)) unlinkSync(tempPath)
  writeFileSync(tempPath, body)
  renameSync(tempPath, filePath)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help") || args.has("h")) {
    console.log(usage())
    return
  }

  const inputs = readArgList(args, "input").map((file) => resolve(file))
  if (inputs.length === 0)
    throw new Error("At least one IRS EO CSV is required.")
  for (const input of inputs) {
    if (!existsSync(input)) throw new Error(`IRS EO CSV not found: ${input}`)
  }

  const write = readBoolean(args, "write", false)
  const sampleSize = readPositiveInteger(args.get("sample"), 10_000)
  const seed = readString(
    args.get("seed"),
    "resource-map-enrichment-benchmark-v1"
  )
  const output = resolve(
    readString(args.get("output"), join(DEFAULT_DIRECTORY, "cohort.jsonl"))
  )
  const eventsOutput = resolve(
    readString(
      args.get("events-output"),
      join(DEFAULT_DIRECTORY, "identity-events.jsonl")
    )
  )
  const manifestPath = resolve(
    readString(args.get("manifest"), join(DEFAULT_DIRECTORY, "manifest.json"))
  )
  const resultLedger = resolve(
    readString(args.get("result-ledger"), DEFAULT_RESULTS)
  )
  const previousManifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : null
  const observedAt = readString(
    args.get("observed-at"),
    previousManifest?.observedAt,
    nowIso()
  )
  if (Number.isNaN(Date.parse(observedAt))) {
    throw new Error("--observed-at must be a valid timestamp.")
  }

  const researchedEins = new Set(
    readJsonl(resultLedger).map((result) => String(result.ein ?? ""))
  )
  const seenEins = new Set()
  const sampler = createIrsEoBenchmarkSampler({ sampleSize, seed })
  const counts = {
    scanned: 0,
    unique: 0,
    duplicateEin: 0,
    invalidEin: 0,
    previouslyResearched: 0,
    eligible: 0,
    sampled: 0,
    ledgerEvents: 0,
    aiCalls: 0,
    networkRequests: 0,
    databaseWrites: 0,
    reviewed: 0,
    published: 0,
  }

  for (const input of inputs) {
    for await (const row of readIrsEoCsvRows(input)) {
      counts.scanned += 1
      const candidate = buildIrsEoDiscoveryCandidate(row, {
        sourceFile: input.split("/").at(-1),
      })
      if (!candidate) {
        counts.invalidEin += 1
        continue
      }
      if (seenEins.has(candidate.ein)) {
        counts.duplicateEin += 1
        continue
      }
      seenEins.add(candidate.ein)
      counts.unique += 1
      if (researchedEins.has(candidate.ein)) {
        counts.previouslyResearched += 1
        continue
      }
      counts.eligible += 1
      sampler.add(applyIrsEoQueueNameHints(candidate))
    }
  }

  const cohort = sampler.finish()
  const events = cohort.flatMap((candidate) =>
    buildIrsEoIdentityEvents(candidate, observedAt)
  )
  const projections = replayIrsEoResearchEvents(events)
  counts.sampled = cohort.length
  counts.ledgerEvents = events.length
  const sourceFiles = inputs.map((input) => {
    const stat = statSync(input)
    return {
      path: input,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    }
  })
  const sourceFingerprint = sha256(JSON.stringify(sourceFiles))
  const summary = summarizeIrsEoBenchmark(cohort)
  const cohortBody =
    cohort.map((candidate) => JSON.stringify(candidate)).join("\n") +
    (cohort.length ? "\n" : "")
  const eventsBody =
    events.map((event) => JSON.stringify(event)).join("\n") +
    (events.length ? "\n" : "")
  const manifest = {
    schemaVersion: IRS_EO_BENCHMARK_SCHEMA_VERSION,
    kind: "irs_eo_full_corpus_benchmark",
    dryRun: !write,
    observedAt: new Date(observedAt).toISOString(),
    seed,
    sampleSize,
    sourceFingerprint,
    sourceFiles,
    counts,
    ...summary,
    projectedStates: {
      identity_resolved: [...projections.values()].filter(
        (projection) => projection.state === "identity_resolved"
      ).length,
    },
    outputHashes: {
      cohortSha256: sha256(cohortBody),
      identityEventsSha256: sha256(eventsBody),
    },
    outputs: write ? { cohort: output, events: eventsOutput } : null,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }

  if (write) {
    atomicWrite(output, cohortBody)
    atomicWrite(eventsOutput, eventsBody)
    atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }

  console.log(JSON.stringify(manifest, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
