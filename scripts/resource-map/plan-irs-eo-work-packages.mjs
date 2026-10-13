#!/usr/bin/env node
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"

import {
  ENGINE_DIR,
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import {
  buildIrsEoWorkPackagePlan,
  writeIrsEoWorkPackagePlan,
} from "./lib/irs-eo-work-packages.mjs"

const DEFAULT_COHORT = join(ENGINE_DIR, "eo", "benchmark", "cohort.jsonl")
const DEFAULT_OUTPUT = join(ENGINE_DIR, "eo", "work")

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const write = readBoolean(args, "write", false)
  const cohortPath = resolve(readString(args.get("cohort"), DEFAULT_COHORT))
  const outputRoot = resolve(readString(args.get("output"), DEFAULT_OUTPUT))
  const packageSize = readPositiveInteger(args.get("package-size"), 25)
  if (!existsSync(cohortPath)) {
    throw new Error(`Benchmark cohort not found: ${cohortPath}`)
  }

  const plan = buildIrsEoWorkPackagePlan(readJsonl(cohortPath), { packageSize })
  const planDirectory = write
    ? writeIrsEoWorkPackagePlan(outputRoot, plan)
    : null
  const { packageHashes: _packageHashes, ...manifestSummary } = plan.manifest
  console.log(
    JSON.stringify(
      {
        dryRun: !write,
        ...manifestSummary,
        planDirectory,
        counts: {
          records: plan.manifest.recordCount,
          packages: plan.manifest.packageCount,
          aiCalls: 0,
          networkRequests: 0,
          databaseWrites: 0,
          reviewed: 0,
          published: 0,
        },
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
