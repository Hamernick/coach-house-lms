#!/usr/bin/env node
import {
  createWriteStream,
  existsSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { once } from "node:events"
import { basename, dirname, join, resolve } from "node:path"
import { mkdirSync } from "node:fs"

import {
  ENGINE_DIR,
  nowIso,
  parseArgs,
  readArgList,
  readBoolean,
  readString,
} from "./lib/data-engine/shared.mjs"
import {
  buildIrsEoDiscoveryCandidate,
  readIrsEoCsvRows,
} from "./lib/irs-eo-acquisition.mjs"

const DEFAULT_OUTPUT = join(ENGINE_DIR, "eo", "irs-eo-candidates.jsonl")

function usage() {
  return [
    "Usage:",
    "  pnpm resource-map:eo-import -- --input <eo1.csv,eo2.csv,...>",
    "  pnpm resource-map:eo-import -- --input <files> --min-score 50 --write",
    "  pnpm resource-map:eo-import -- --input <files> --states IL,NY --write",
    "",
    "Streams IRS EO BMF files into a private identity-only candidate shortlist.",
    "Dry-run by default. It never reviews, publishes, or writes to a database.",
  ].join("\n")
}

function readPositiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function increment(map, key) {
  if (!key) return
  map[key] = (map[key] ?? 0) + 1
}

async function writeLine(stream, row) {
  if (!stream.write(`${JSON.stringify(row)}\n`)) await once(stream, "drain")
}

async function finishStream(stream) {
  stream.end()
  await once(stream, "finish")
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help") || args.has("h")) {
    console.log(usage())
    return
  }

  const inputs = readArgList(args, "input").map((value) => resolve(value))
  if (inputs.length === 0) throw new Error("--input is required.")
  for (const input of inputs) {
    if (!existsSync(input)) throw new Error(`Input file not found: ${input}`)
  }

  const write = readBoolean(args, "write", false)
  const minScore = readPositiveNumber(args.get("min-score"), 50)
  const states = new Set(
    readArgList(args, "states").map((value) => value.toUpperCase())
  )
  const output = resolve(readString(args.get("output"), DEFAULT_OUTPUT))
  const manifest = resolve(
    readString(args.get("manifest"), `${output}.manifest.json`)
  )
  const tempOutput = `${output}.tmp`
  const seenEins = new Set()
  const byCategory = {}
  const byState = {}
  const counts = {
    scanned: 0,
    unique: 0,
    duplicateEin: 0,
    invalidEin: 0,
    belowScore: 0,
    outsideStateFilter: 0,
    shortlisted: 0,
    filingPoBox: 0,
  }

  let stream = null
  if (write) {
    mkdirSync(dirname(output), { recursive: true })
    if (existsSync(tempOutput)) unlinkSync(tempOutput)
    stream = createWriteStream(tempOutput, { encoding: "utf8", flags: "wx" })
  }

  try {
    for (const input of inputs) {
      for await (const row of readIrsEoCsvRows(input)) {
        counts.scanned += 1
        const candidate = buildIrsEoDiscoveryCandidate(row, {
          sourceFile: basename(input),
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

        if (
          states.size > 0 &&
          !states.has(candidate.filingAddress.state ?? "")
        ) {
          counts.outsideStateFilter += 1
          continue
        }
        if (candidate.directServiceScore < minScore) {
          counts.belowScore += 1
          continue
        }

        counts.shortlisted += 1
        if (candidate.filingAddress.isPoBox) counts.filingPoBox += 1
        increment(byState, candidate.filingAddress.state)
        for (const category of candidate.categoryHints) {
          increment(byCategory, category)
        }
        if (stream) await writeLine(stream, candidate)
      }
    }

    if (stream) {
      await finishStream(stream)
      renameSync(tempOutput, output)
    }
  } catch (error) {
    stream?.destroy()
    if (existsSync(tempOutput)) unlinkSync(tempOutput)
    throw error
  }

  const report = {
    schemaVersion: 1,
    kind: "irs_eo_stream_import",
    dryRun: !write,
    createdAt: nowIso(),
    output: write ? output : null,
    publicDisplayEligible: false,
    publicationAttempted: false,
    configuration: {
      minScore,
      states: [...states],
      inputs: inputs.map((input) => ({
        path: input,
        bytes: statSync(input).size,
      })),
    },
    counts,
    byCategory,
    byState,
  }

  if (write) writeFileSync(manifest, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
