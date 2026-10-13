#!/usr/bin/env node
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { createInterface } from "node:readline"
import { dirname, join, resolve } from "node:path"

import {
  ENGINE_DIR,
  nowIso,
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
  sha256,
} from "./lib/data-engine/shared.mjs"
import {
  applyIrsEoQueueNameHints,
  buildIrsEoCandidatePriority,
  buildIrsEoWorkItem,
  normalizeIrsEoResearchResult,
} from "./lib/irs-eo-acquisition.mjs"

const DEFAULT_INPUT = join(ENGINE_DIR, "eo", "irs-eo-candidates.jsonl")
const DEFAULT_QUEUE = join(ENGINE_DIR, "eo", "current-work-items.jsonl")
const DEFAULT_CHECKPOINT = join(ENGINE_DIR, "eo", "checkpoint.json")
const DEFAULT_REPORT = join(ENGINE_DIR, "eo", "latest-report.json")
const DEFAULT_RESULTS = join(ENGINE_DIR, "eo", "research-results.jsonl")

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:eo-run -- --batch 250",
    "  pnpm resource-map:eo-run -- --batch 250 --write",
    "  pnpm resource-map:eo-run -- --resume --write",
    "  pnpm resource-map:eo-run -- --resume --results <results.jsonl> --write",
    "",
    "Builds a balanced, deterministic website-research queue.",
    "Dry-run by default. It never uses AI, reviews, publishes, or deploys.",
  ].join("\n")
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readCheckpoint(filePath) {
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, "utf8"))
}

function swap(entries, left, right) {
  const value = entries[left]
  entries[left] = entries[right]
  entries[right] = value
}

function pushMaxPriority(entries, entry) {
  entries.push(entry)
  let index = entries.length - 1
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)
    if (entries[parent].priority.localeCompare(entries[index].priority) >= 0) {
      break
    }
    swap(entries, parent, index)
    index = parent
  }
}

function restoreMaxPriority(entries) {
  let index = 0
  while (true) {
    const left = index * 2 + 1
    const right = left + 1
    let largest = index
    if (
      left < entries.length &&
      entries[left].priority.localeCompare(entries[largest].priority) > 0
    ) {
      largest = left
    }
    if (
      right < entries.length &&
      entries[right].priority.localeCompare(entries[largest].priority) > 0
    ) {
      largest = right
    }
    if (largest === index) break
    swap(entries, index, largest)
    index = largest
  }
}

function keepBestCandidate(perCategory, candidate, batchSize, seed) {
  const category = candidate.categoryHints?.[0] ?? "unclassified"
  const entries = perCategory.get(category) ?? []
  const entry = {
    candidate,
    priority: buildIrsEoCandidatePriority(candidate, seed),
  }
  if (entries.length < batchSize) {
    pushMaxPriority(entries, entry)
  } else if (entry.priority.localeCompare(entries[0].priority) < 0) {
    entries[0] = entry
    restoreMaxPriority(entries)
  }
  perCategory.set(category, entries)
}

function chooseBalancedCandidates(perCategory, batchSize) {
  const categoryQueues = [...perCategory.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, entries]) => ({ category, entries: [...entries] }))
  const selected = []
  const stateCounts = new Map()

  while (selected.length < batchSize) {
    let advanced = false
    for (const queue of categoryQueues) {
      if (selected.length >= batchSize || queue.entries.length === 0) continue
      queue.entries.sort((left, right) => {
        const leftState = left.candidate.filingAddress?.state ?? ""
        const rightState = right.candidate.filingAddress?.state ?? ""
        const countDifference =
          (stateCounts.get(leftState) ?? 0) - (stateCounts.get(rightState) ?? 0)
        return countDifference || left.priority.localeCompare(right.priority)
      })
      const next = queue.entries.shift()
      selected.push(next.candidate)
      const state = next.candidate.filingAddress?.state ?? "unknown"
      stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1)
      advanced = true
    }
    if (!advanced) break
  }

  return selected
}

async function selectCandidates({ input, batchSize, completedEins, seed }) {
  const perCategory = new Map()
  let eligibleCount = 0
  const lines = createInterface({
    input: createReadStream(input, { encoding: "utf8" }),
    crlfDelay: Number.POSITIVE_INFINITY,
  })

  for await (const line of lines) {
    if (!line.trim()) continue
    const candidate = applyIrsEoQueueNameHints(JSON.parse(line))
    if (!candidate.ein || completedEins.has(candidate.ein)) continue
    eligibleCount += 1
    keepBestCandidate(perCategory, candidate, batchSize, seed)
  }

  return {
    eligibleCount,
    selected: chooseBalancedCandidates(perCategory, batchSize),
  }
}

function countBy(items, readKey) {
  const counts = {}
  for (const item of items) {
    const key = readKey(item) || "unknown"
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function atomicWrite(filePath, body) {
  mkdirSync(dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.tmp`
  if (existsSync(tempPath)) unlinkSync(tempPath)
  writeFileSync(tempPath, body)
  renameSync(tempPath, filePath)
}

function mergeResearchResults({ current, incoming }) {
  const byEin = new Map(current.map((result) => [result.ein, result]))
  for (const result of incoming) byEin.set(result.ein, result)
  return [...byEin.values()].sort((left, right) =>
    left.ein.localeCompare(right.ein)
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help") || args.has("h")) {
    console.log(usage())
    return
  }

  const write = readBoolean(args, "write", false)
  const resume = readBoolean(args, "resume", false)
  const batchSize = readPositiveInteger(args.get("batch"), 250)
  const seed = readString(args.get("seed"), "coach-house-eo-pilot-v1")
  const input = resolve(readString(args.get("input"), DEFAULT_INPUT))
  const queue = resolve(readString(args.get("queue"), DEFAULT_QUEUE))
  const checkpointPath = resolve(
    readString(args.get("checkpoint"), DEFAULT_CHECKPOINT)
  )
  const reportPath = resolve(readString(args.get("report"), DEFAULT_REPORT))
  const resultLedger = resolve(
    readString(args.get("result-ledger"), DEFAULT_RESULTS)
  )
  const incomingResultsPath = readString(args.get("results"))
    ? resolve(args.get("results"))
    : null
  if (!existsSync(input)) {
    throw new Error(
      `Candidate input not found: ${input}. Run resource-map:eo-import first.`
    )
  }

  const previous = resume ? readCheckpoint(checkpointPath) : null
  const currentResults = readJsonl(resultLedger).map(
    normalizeIrsEoResearchResult
  )
  const incomingResults = incomingResultsPath
    ? readJsonl(incomingResultsPath).map(normalizeIrsEoResearchResult)
    : []
  const mergedResults = mergeResearchResults({
    current: currentResults,
    incoming: incomingResults,
  })
  const completedEins = new Set(mergedResults.map((result) => result.ein))
  const selection = await selectCandidates({
    input,
    batchSize,
    completedEins,
    seed,
  })
  const workItems = selection.selected.map(buildIrsEoWorkItem)
  const inputStat = statSync(input)
  const inputFingerprint = sha256(
    `${input}:${inputStat.size}:${inputStat.mtimeMs}`
  )
  const checkpoint = {
    schemaVersion: 1,
    kind: "irs_eo_enrichment_checkpoint",
    createdAt: nowIso(),
    input,
    inputFingerprint,
    seed,
    batchSize,
    status: "research_queue_ready",
    selectedEins: workItems.map((item) => item.ein),
    completedEins: [...completedEins],
    resultLedger,
    publicationBlocked: true,
  }
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_enrichment_plan",
    dryRun: !write,
    createdAt: checkpoint.createdAt,
    resumed: Boolean(previous),
    counts: {
      eligible: selection.eligibleCount,
      queued: workItems.length,
      completed: completedEins.size,
      resultsApplied: incomingResults.length,
      aiCalls: 0,
      networkRequests: 0,
      reviewed: 0,
      published: 0,
    },
    byCategory: countBy(workItems, (item) => item.categoryHints?.[0]),
    byState: countBy(workItems, (item) => item.filingAddress?.state),
    byResultStatus: countBy(
      mergedResults,
      (result) => result.acquisitionStatus
    ),
    queue: write ? queue : null,
    checkpoint: write ? checkpointPath : null,
  }

  if (write) {
    if (incomingResults.length > 0) {
      atomicWrite(
        resultLedger,
        mergedResults.map((result) => JSON.stringify(result)).join("\n") + "\n"
      )
    }
    atomicWrite(
      queue,
      workItems.map((item) => JSON.stringify(item)).join("\n") +
        (workItems.length ? "\n" : "")
    )
    atomicWrite(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`)
    atomicWrite(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
