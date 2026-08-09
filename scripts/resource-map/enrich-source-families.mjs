#!/usr/bin/env node
import { once } from "node:events"
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs"
import path from "node:path"
import readline from "node:readline"

import { createEnrichmentCoverageAccumulator } from "./lib/enrichment-coverage.mjs"
import { parseResourceMapRecords } from "./lib/read-records.mjs"
import {
  buildReplacementRecordMap,
  enrichSourceFamilyRecord,
  summarizeFamilyCounts,
} from "./lib/source-family-enrichment.mjs"

const DEFAULT_INPUT =
  "data/resource-map/.engine/candidate-records.reprocessed.jsonl"
const DEFAULT_LIBRARY_INPUT =
  "data/resource-map/.engine/chicago-library-enriched.jsonl"
const DEFAULT_OUTPUT = "data/resource-map/.engine/source-family-enriched.jsonl"

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

function loadLibraryRecords(input) {
  if (!existsSync(input)) return []
  return parseResourceMapRecords(readFileSync(input, "utf8"), { label: input })
}

function percentage(value, total) {
  return total === 0 ? "0.0" : ((value / total) * 100).toFixed(1)
}

function printSummary({ coverage, familyCounts, input, output, write }) {
  console.log(`Processed ${coverage.total.total} records from ${input}.`)
  console.log(
    `Complete: ${coverage.total.complete}/${coverage.total.total} (${percentage(coverage.total.complete, coverage.total.total)}%); publishable: ${coverage.total.publishable}/${coverage.total.total} (${percentage(coverage.total.publishable, coverage.total.total)}%).`
  )
  console.log(`Families: ${JSON.stringify(familyCounts)}.`)
  console.log(
    write ? `Wrote ${output} atomically.` : "Dry run only; no file written."
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:enrich-sources -- [--input <records.jsonl>] [--library-input <records.jsonl>] [--output <records.jsonl>] [--write]"
    )
    return
  }

  const input = String(args.get("input") ?? DEFAULT_INPUT)
  const libraryInput = String(
    args.get("library-input") ?? DEFAULT_LIBRARY_INPUT
  )
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  const write = args.has("write")
  const temporaryOutput = `${output}.tmp-${process.pid}`
  const libraryRecordsByKey = buildReplacementRecordMap(
    loadLibraryRecords(libraryInput)
  )
  const coverage = createEnrichmentCoverageAccumulator()
  const familyCounts = new Map()
  const inputLines = readline.createInterface({
    crlfDelay: Infinity,
    input: createReadStream(input, "utf8"),
  })
  let writer = null

  if (write) {
    mkdirSync(path.dirname(output), { recursive: true })
    rmSync(temporaryOutput, { force: true })
    writer = createWriteStream(temporaryOutput, {
      encoding: "utf8",
      flags: "wx",
    })
  }

  try {
    const now = new Date().toISOString()
    for await (const line of inputLines) {
      if (!line.trim()) continue
      const sourceRecord = JSON.parse(line)
      const result = enrichSourceFamilyRecord({
        libraryRecordsByKey,
        now,
        record: sourceRecord,
      })
      familyCounts.set(
        result.family,
        (familyCounts.get(result.family) ?? 0) + 1
      )
      coverage.add(result.record)
      if (writer && !writer.write(`${JSON.stringify(result.record)}\n`)) {
        await once(writer, "drain")
      }
    }
    if (writer) {
      writer.end()
      await once(writer, "finish")
      renameSync(temporaryOutput, output)
    }
  } catch (error) {
    if (writer) writer.destroy()
    rmSync(temporaryOutput, { force: true })
    throw error
  }

  printSummary({
    coverage: coverage.summary(),
    familyCounts: summarizeFamilyCounts(familyCounts),
    input,
    output,
    write,
  })
}

await main()
