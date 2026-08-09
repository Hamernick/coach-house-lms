#!/usr/bin/env node
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { parseResourceMapRecords } from "./lib/read-records.mjs"

const DEFAULT_OUTPUT =
  "data/resource-map/.engine/public-resource-map-preview.jsonl"

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

function recordKey(record, index) {
  const sourceId = String(record.sourceId ?? record.source_id ?? "unknown")
  const recordId = String(
    record.sourceRecordId ?? record.source_record_id ?? record.id ?? index
  )
  return `${sourceId}\u0000${recordId}`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:merge-preview -- --inputs <a.jsonl,b.jsonl> [--output <merged.jsonl>] [--write]"
    )
    return
  }
  const inputs = String(args.get("inputs") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
  if (inputs.length === 0) throw new Error("--inputs is required.")
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  const records = []
  for (const input of inputs) {
    const raw = await readFile(input, "utf8")
    records.push(...parseResourceMapRecords(raw, { label: input }))
  }
  const merged = [
    ...new Map(
      records.map((record, index) => [recordKey(record, index), record])
    ).values(),
  ]
  console.log(
    `Merged ${records.length} rows from ${inputs.length} files into ${merged.length} unique records.`
  )
  if (!args.has("write")) {
    console.log("Dry run only; no file written.")
    return
  }
  const temporary = `${output}.tmp-${process.pid}`
  await mkdir(path.dirname(output), { recursive: true })
  await rm(temporary, { force: true })
  try {
    await writeFile(
      temporary,
      merged.map((record) => JSON.stringify(record)).join("\n") + "\n",
      { encoding: "utf8", flag: "wx" }
    )
    await rename(temporary, output)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
  console.log(`Wrote ${output} atomically.`)
}

await main()
