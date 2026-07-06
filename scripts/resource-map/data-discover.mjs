#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  STORE_PATHS,
  appendJsonl,
  createRunRecord,
  finishRunRecord,
  parseArgs,
  readBoolean,
  writeJsonl,
} from "./lib/data-engine/shared.mjs"
import { buildCatalogDiscoveryCandidatesFromArgs } from "./lib/data-engine/catalog-discovery.mjs"
import { buildDiscoveryCandidatesFromArgs } from "./lib/data-engine/source-discovery.mjs"

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DISCOVER_SOURCES_SCRIPT = join(SCRIPT_DIR, "discover-sources.mjs")

function usage() {
  return [
    'Usage: pnpm data:discover -- --location "Chicago, IL" --categories food,health [--write] [--output file.jsonl]',
    '       pnpm data:discover -- --location "Chicago, IL" --categories food --catalog-provider ckan --catalog-input catalog.json --templates false',
    '       pnpm data:discover -- --location "Chicago, IL" --categories food --registry-dry-run',
    '       pnpm data:discover -- --location "Chicago, IL" --categories food --registry-apply',
    "",
    "Builds local source-registry candidates. Dry-run by default; Supabase writes require --registry-apply.",
  ].join("\n")
}

function readRegistryMode(args) {
  if (readBoolean(args, "registry-apply", false)) return "apply"
  if (readBoolean(args, "registry-dry-run", false)) return "dry-run"
  return null
}

function readCandidateMetadata(candidate) {
  return candidate.metadata && typeof candidate.metadata === "object"
    ? candidate.metadata
    : {}
}

function isRegistryApplyReady(candidate) {
  const metadata = readCandidateMetadata(candidate)
  if (candidate.ingestionReadiness === "lead") return false
  if (metadata.ingestionReadiness === "lead") return false
  if (metadata.connectorReady === false) return false
  return true
}

function dedupeCandidates(candidates) {
  const byKey = new Map()
  for (const candidate of candidates) {
    const key =
      candidate.sourceId ??
      candidate.slug ??
      `${candidate.connectorType}:${candidate.rawUrl}`
    if (!key) continue
    byKey.set(key, candidate)
  }
  return [...byKey.values()]
}

function runRegistryHandoff(candidates, args, mode) {
  if (!mode) return
  if (
    mode === "apply" &&
    !readBoolean(args, "allow-lead-registry-apply", false)
  ) {
    const unready = candidates.filter(
      (candidate) => !isRegistryApplyReady(candidate)
    )
    if (unready.length > 0) {
      const sample = unready
        .slice(0, 5)
        .map((candidate) => candidate.slug ?? candidate.name ?? "unknown")
        .join(", ")
      throw new Error(
        `Refusing --registry-apply for ${unready.length} lead-only source candidates (${sample}). Add fetch targets/queries or pass --allow-lead-registry-apply after manual review.`
      )
    }
  }

  const directory = mkdtempSync(join(tmpdir(), "resource-map-source-registry-"))
  const input = join(directory, "sources.json")

  try {
    writeFileSync(input, JSON.stringify(candidates, null, 2))
    const command = [DISCOVER_SOURCES_SCRIPT, "--input", input]
    if (args.has("run-label"))
      command.push("--run-label", String(args.get("run-label")))
    if (mode === "apply") command.push("--apply")

    const output = execFileSync(process.execPath, command, {
      cwd: process.cwd(),
      encoding: "utf8",
    })
    process.stdout.write(output)
  } finally {
    rmSync(directory, { force: true, recursive: true })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }

  const includeTemplates = readBoolean(args, "templates", true)
  const templateCandidates = includeTemplates
    ? buildDiscoveryCandidatesFromArgs(args)
    : []
  const catalogCandidates = await buildCatalogDiscoveryCandidatesFromArgs(args)
  const candidates = dedupeCandidates([
    ...templateCandidates,
    ...catalogCandidates,
  ])
  const write =
    readBoolean(args, "write", false) || readBoolean(args, "apply", false)
  const output = args.get("output") || STORE_PATHS.sourceRegistry
  const registryMode = readRegistryMode(args)
  const run = createRunRecord({ kind: "source_discovery" })

  if (!write) {
    console.log(
      registryMode === "apply"
        ? `Discovered ${candidates.length} source candidates; applying them to resource_map_sources.`
        : `Dry run: discovered ${candidates.length} source candidates. Re-run with --write to save them.`
    )
    for (const candidate of candidates.slice(0, 12)) {
      console.log(
        `- ${candidate.slug}: ${candidate.name} (${candidate.connectorType}/${candidate.trustLevel})`
      )
    }
    runRegistryHandoff(candidates, args, registryMode)
    return
  }

  if (args.has("append")) {
    appendJsonl(output, candidates)
  } else {
    writeJsonl(output, candidates)
  }
  appendJsonl(STORE_PATHS.runs, [
    finishRunRecord(run, {
      parsed_count: candidates.length,
      normalized_count: candidates.length,
      flagged_count: candidates.filter(
        (candidate) => candidate.manualConfirmationRequired
      ).length,
      errors: [],
    }),
  ])
  console.log(`Wrote ${candidates.length} source candidates to ${output}.`)
  runRegistryHandoff(candidates, args, registryMode)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
