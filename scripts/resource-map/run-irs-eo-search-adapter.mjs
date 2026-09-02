#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, resolve } from "node:path"

import {
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import { runIrsEoOfflineSearchAdapter } from "./lib/irs-eo-search-adapters.mjs"

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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const planPath = requiredPath(args, "plan")
  const inputPath = requiredPath(args, "input")
  const adapterId = readString(args.get("adapter"))
  if (!adapterId) throw new Error("--adapter is required.")
  const outputPath = resolve(
    readString(args.get("output"), `${inputPath}.${adapterId}.results.jsonl`)
  )
  const reportPath = resolve(
    readString(args.get("report"), `${outputPath}.report.json`)
  )
  const write = readBoolean(args, "write", false)
  const plan = JSON.parse(readFileSync(planPath, "utf8"))
  const inputRows = readJsonl(inputPath)
  const execution = runIrsEoOfflineSearchAdapter({
    plan,
    adapterId,
    inputRows,
  })
  const countStatus = (status) =>
    execution.results.filter((result) => result.status === status).length
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_search_adapter_report",
    dryRun: !write,
    adapterId,
    planHash: plan.planHash,
    counts: {
      inputRows: inputRows.length,
      resultRows: execution.results.length,
      completed: countStatus("completed"),
      noResults: countStatus("no_results"),
      misses: countStatus("miss"),
      rejectedInputRows: execution.rejectedRows,
      networkRequests: 0,
      paidQueries: 0,
      aiCalls: 0,
      databaseWrites: 0,
      reviewed: 0,
      published: 0,
    },
    output: write ? outputPath : null,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  if (write) {
    const body = execution.results.length
      ? `${execution.results.map((result) => JSON.stringify(result)).join("\n")}\n`
      : ""
    atomicWrite(outputPath, body)
    atomicWrite(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
