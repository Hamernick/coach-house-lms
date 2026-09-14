#!/usr/bin/env node
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { createInterface } from "node:readline"
import { dirname, join, resolve } from "node:path"

import {
  ENGINE_DIR,
  parseArgs,
  readArgList,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import { normalizeIrsEoResearchResult } from "./lib/irs-eo-acquisition.mjs"
import { buildIrsEoPrivateDraft } from "./lib/irs-eo-private-drafts.mjs"

const EO_DIR = join(ENGINE_DIR, "eo")
const DEFAULT_CANDIDATES = join(EO_DIR, "irs-eo-candidates.jsonl")
const DEFAULT_RESULTS = join(EO_DIR, "research-results.jsonl")
const DEFAULT_OUTPUT = join(EO_DIR, "private-draft-field-candidates.jsonl")
const DEFAULT_REPORT = join(EO_DIR, "private-draft-field-report.json")

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:eo-build-private-drafts -- --max-records 25",
    "  pnpm resource-map:eo-build-private-drafts -- --offset 25 --max-records 25 --write",
    "  pnpm resource-map:eo-build-private-drafts -- --ein <ein> --write",
    "",
    "Builds source-linked private field candidates without review or publication.",
    "IRS filing addresses are explicitly excluded from service locations.",
  ].join("\n")
}

function nonNegativeInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
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

async function loadCandidates(filePath, eins) {
  const byEin = new Map()
  const lines = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Number.POSITIVE_INFINITY,
  })
  for await (const line of lines) {
    if (!line.trim()) continue
    const candidate = JSON.parse(line)
    if (!eins.has(candidate.ein)) continue
    byEin.set(candidate.ein, candidate)
    if (byEin.size === eins.size) break
  }
  return byEin
}

function mergeDrafts(current, incoming) {
  const byEin = new Map(current.map((draft) => [draft.ein, draft]))
  for (const draft of incoming) byEin.set(draft.ein, draft)
  return [...byEin.values()].sort((left, right) =>
    left.ein.localeCompare(right.ein)
  )
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row.coverage[key] ?? 0), 0)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help") || args.has("h")) {
    console.log(usage())
    return
  }
  const write = readBoolean(args, "write", false)
  const offset = nonNegativeInteger(args.get("offset"), 0)
  const maxRecords = positiveInteger(args.get("max-records"), 25)
  const selectedEins = new Set(readArgList(args, "ein"))
  const candidatesPath = resolve(
    readString(args.get("candidates"), DEFAULT_CANDIDATES)
  )
  const resultsPath = resolve(readString(args.get("results"), DEFAULT_RESULTS))
  const outputPath = resolve(readString(args.get("output"), DEFAULT_OUTPUT))
  const reportPath = resolve(readString(args.get("report"), DEFAULT_REPORT))
  for (const filePath of [candidatesPath, resultsPath]) {
    if (!existsSync(filePath)) throw new Error(`Input not found: ${filePath}`)
  }

  const inputResults = readJsonl(resultsPath).map(normalizeIrsEoResearchResult)
  const eligibleResults = inputResults
    .filter((result) => result.providerIdentitySupported === true)
    .filter((result) =>
      ["website_matched", "evidence_fetched"].includes(result.acquisitionStatus)
    )
    .filter((result) => selectedEins.size === 0 || selectedEins.has(result.ein))
  const selectedResults = eligibleResults.slice(offset, offset + maxRecords)
  const candidates = await loadCandidates(
    candidatesPath,
    new Set(selectedResults.map((result) => result.ein))
  )
  const missingCandidates = selectedResults
    .filter((result) => !candidates.has(result.ein))
    .map((result) => result.ein)
  if (missingCandidates.length) {
    throw new Error(
      `Candidate identity rows missing for EINs: ${missingCandidates.join(", ")}`
    )
  }
  const drafts = selectedResults
    .map((researchResult) =>
      buildIrsEoPrivateDraft({
        researchResult,
        candidate: candidates.get(researchResult.ein),
      })
    )
    .filter(Boolean)
  const existingDrafts = existsSync(outputPath) ? readJsonl(outputPath) : []
  const mergedDrafts = mergeDrafts(existingDrafts, drafts)
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_private_draft_field_report",
    dryRun: !write,
    publicationBlocked: true,
    counts: {
      inputResults: inputResults.length,
      eligibleResults: eligibleResults.length,
      selectedResults: selectedResults.length,
      draftsBuilt: drafts.length,
      draftsStored: write ? mergedDrafts.length : existingDrafts.length,
      serviceCandidates: sum(drafts, "services"),
      accessCandidates: sum(drafts, "accessInstructions"),
      eligibilityCandidates: sum(drafts, "eligibility"),
      hoursCandidates: sum(drafts, "hours"),
      serviceAreaCandidates: sum(drafts, "serviceAreas"),
      privateContacts: sum(drafts, "contacts"),
      privateSocialAccounts: sum(drafts, "socialAccounts"),
      mediaCandidates: sum(drafts, "mediaCandidates"),
      serviceLocations: 0,
      coordinates: 0,
      aiCalls: 0,
      networkRequests: 0,
      reviewed: 0,
      published: 0,
    },
    output: write ? outputPath : null,
  }

  if (write) {
    atomicWrite(outputPath, jsonlBody(mergedDrafts))
    atomicWrite(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
