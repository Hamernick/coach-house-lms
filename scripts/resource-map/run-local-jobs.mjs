#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  STORE_PATHS,
  appendJsonl,
  createRunRecord,
  finishRunRecord,
  parseArgs,
  readArray,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))

const DEFAULT_JOBS = [
  "source_freshness",
  "failed_retry",
  "freshness_refresh",
  "broken_link_check",
]
const JOBS = [
  "source_discovery",
  "source_ingestion",
  "connector_ingestion",
  "candidate_reprocess",
  ...DEFAULT_JOBS,
]
const RUN_COUNT_FIELDS = [
  "fetched_count",
  "parsed_count",
  "normalized_count",
  "classified_count",
  "deduped_count",
  "flagged_count",
]

function usage() {
  return [
    "Usage:",
    "  pnpm data:run-jobs",
    '  pnpm data:run-jobs -- --jobs source_discovery --location "Chicago, IL" --categories food --write',
    "  pnpm data:run-jobs -- --jobs source_ingestion --source chicago-food --write",
    "  pnpm data:run-jobs -- --jobs connector_ingestion --type socrata --write",
    "  pnpm data:run-jobs -- --jobs candidate_reprocess --write",
    "  pnpm data:run-jobs -- --jobs source_freshness,failed_retry --write",
    "  pnpm data:run-jobs -- --stale-days 30 --network true --write",
    "",
    "Runs local resource-map maintenance jobs. Dry-run by default.",
  ].join("\n")
}

function readJobList(args) {
  const requested = args.has("jobs")
    ? readArray(args.get("jobs"))
    : DEFAULT_JOBS
  const unknown = requested.filter((job) => !JOBS.includes(job))
  if (unknown.length) {
    throw new Error(`Unsupported local job(s): ${unknown.join(", ")}`)
  }
  return requested
}

function pushStringArg(commandArgs, args, inputKey, outputKey = inputKey) {
  const value = readString(args.get(inputKey))
  if (value) commandArgs.push(`--${outputKey}`, value)
}

function pushBooleanArg(commandArgs, args, inputKey, outputKey = inputKey) {
  if (args.has(inputKey)) {
    commandArgs.push(`--${outputKey}`, String(args.get(inputKey)))
  }
}

function runNodeScript(scriptName, args) {
  const output = execFileSync(
    process.execPath,
    [join(SCRIPT_DIR, scriptName), ...args],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: process.env,
    }
  )
  return output.trim()
}

function readRunIds() {
  return new Set(readJsonl(STORE_PATHS.runs).map((run) => run.run_id))
}

function readNewRuns(previousRunIds) {
  return readJsonl(STORE_PATHS.runs).filter(
    (run) => run.run_id && !previousRunIds.has(run.run_id)
  )
}

function summarizeRunCounts(runs) {
  const summary = Object.fromEntries(
    RUN_COUNT_FIELDS.map((field) => [field, 0])
  )
  for (const run of runs) {
    for (const field of RUN_COUNT_FIELDS) {
      const value = Number(run[field])
      if (Number.isFinite(value)) summary[field] += value
    }
  }
  return summary
}

function projectChildRun(run) {
  const counts = summarizeRunCounts([run])
  return {
    run_id: run.run_id,
    kind: run.kind,
    source_id: run.source_id ?? null,
    connector_type: run.connector_type ?? null,
    status: run.status,
    ...counts,
    error_count: Array.isArray(run.errors) ? run.errors.length : 0,
  }
}

function hasRunErrors(run) {
  return (
    run.status === "completed_with_errors" ||
    (Array.isArray(run.errors) && run.errors.length > 0)
  )
}

function attachChildRunMetrics(result, childRuns) {
  const hasChildErrors = childRuns.some(hasRunErrors)
  return {
    ...result,
    status:
      result.status === "completed" && hasChildErrors
        ? "completed_with_errors"
        : result.status,
    metrics: summarizeRunCounts(childRuns),
    childRuns: childRuns.map(projectChildRun),
  }
}

function runTrackedJob(job, args, write) {
  const previousRunIds = readRunIds()
  try {
    const result = runJob(job, args, write)
    return attachChildRunMetrics(result, readNewRuns(previousRunIds))
  } catch (error) {
    error.childRuns = readNewRuns(previousRunIds)
    throw error
  }
}

function buildSharedIngestArgs(args, write) {
  const commandArgs = []
  const staleDays = readString(args.get("stale-days"), args.get("staleDays"))
  const retries = readString(args.get("retries"))
  const timeoutMs = readString(args.get("timeout-ms"), args.get("timeoutMs"))
  const retryDelayMs = readString(
    args.get("retry-delay-ms"),
    args.get("retryDelayMs")
  )

  if (write) commandArgs.push("--write")
  pushStringArg(commandArgs, args, "registry")
  pushStringArg(commandArgs, args, "output")
  if (readBoolean(args, "network", false)) commandArgs.push("--network", "true")
  if (readBoolean(args, "replace-source-candidates", false)) {
    commandArgs.push("--replace-source-candidates")
  }
  if (staleDays) commandArgs.push("--stale-days", staleDays)
  if (retries) commandArgs.push("--retries", retries)
  if (timeoutMs) commandArgs.push("--timeout-ms", timeoutMs)
  if (retryDelayMs) commandArgs.push("--retry-delay-ms", retryDelayMs)

  return commandArgs
}

function runJob(job, args, write) {
  if (job === "source_discovery") {
    const commandArgs = []
    pushStringArg(commandArgs, args, "location")
    pushStringArg(commandArgs, args, "locations")
    pushStringArg(commandArgs, args, "category")
    pushStringArg(commandArgs, args, "categories")
    pushStringArg(commandArgs, args, "limit")
    pushStringArg(commandArgs, args, "output")
    pushStringArg(commandArgs, args, "catalog-provider")
    pushStringArg(commandArgs, args, "catalogProvider", "catalog-provider")
    pushStringArg(commandArgs, args, "catalog-input")
    pushStringArg(commandArgs, args, "catalogInput", "catalog-input")
    pushBooleanArg(commandArgs, args, "templates")
    if (readBoolean(args, "registry-dry-run", false)) {
      commandArgs.push("--registry-dry-run")
    }
    if (readBoolean(args, "registry-apply", false)) {
      commandArgs.push("--registry-apply")
    }
    if (readBoolean(args, "allow-lead-registry-apply", false)) {
      commandArgs.push("--allow-lead-registry-apply")
    }
    pushStringArg(commandArgs, args, "run-label")
    pushStringArg(commandArgs, args, "runLabel", "run-label")
    if (readBoolean(args, "network", false))
      commandArgs.push("--network", "true")
    if (readBoolean(args, "append", false)) commandArgs.push("--append")
    if (write) commandArgs.push("--write")

    return {
      job,
      status: "completed",
      output: runNodeScript("data-discover.mjs", commandArgs),
    }
  }

  if (job === "source_ingestion") {
    const source = readString(args.get("source"), args.get("source-id"))
    const ingestAll = readBoolean(args, "all", false)
    if (!source && !ingestAll) {
      throw new Error("source_ingestion requires --source <sourceId> or --all.")
    }
    const commandArgs = source ? ["--source", source] : ["--all"]
    commandArgs.push(...buildSharedIngestArgs(args, write))
    return {
      job,
      status: "completed",
      output: runNodeScript("data-ingest.mjs", commandArgs),
    }
  }

  if (job === "connector_ingestion") {
    const connectorType = readString(
      args.get("type"),
      args.get("connector-type")
    )
    if (!connectorType) {
      throw new Error("connector_ingestion requires --type <connectorType>.")
    }
    const commandArgs = ["--type", connectorType]
    commandArgs.push(...buildSharedIngestArgs(args, write))
    return {
      job,
      status: "completed",
      output: runNodeScript("data-ingest.mjs", commandArgs),
    }
  }

  if (job === "source_freshness") {
    const commandArgs = ["--json"]
    const staleDays = readString(args.get("stale-days"), args.get("staleDays"))
    if (staleDays) commandArgs.push("--stale-days", staleDays)
    if (write) commandArgs.push("--write")
    return {
      job,
      status: "completed",
      output: runNodeScript("check-local-source-freshness.mjs", commandArgs),
    }
  }

  if (job === "candidate_reprocess") {
    const commandArgs = []
    pushStringArg(commandArgs, args, "input")
    pushStringArg(commandArgs, args, "output")
    pushStringArg(commandArgs, args, "registry")
    if (readBoolean(args, "network", false))
      commandArgs.push("--network", "true")
    if (write) commandArgs.push("--write")
    return {
      job,
      status: "completed",
      output: runNodeScript("reprocess-candidates.mjs", commandArgs),
    }
  }

  if (job === "failed_retry") {
    return {
      job,
      status: "completed",
      output: runNodeScript("data-ingest.mjs", [
        "--retry-failed",
        ...buildSharedIngestArgs(args, write),
      ]),
    }
  }

  if (job === "freshness_refresh") {
    return {
      job,
      status: "completed",
      output: runNodeScript("data-ingest.mjs", [
        "--stale",
        ...buildSharedIngestArgs(args, write),
      ]),
    }
  }

  const input = readString(args.get("input")) ?? STORE_PATHS.candidates
  if (!existsSync(input)) {
    return {
      job,
      status: "skipped",
      output: `Skipped broken-link check; input not found: ${input}`,
    }
  }

  const commandArgs = ["--input", input]
  if (readBoolean(args, "network", false)) commandArgs.push("--network", "true")
  if (write) commandArgs.push("--write")
  const annotateOutput = readString(
    args.get("annotate-output"),
    args.get("annotateOutput")
  )
  if (annotateOutput) commandArgs.push("--annotate-output", annotateOutput)

  return {
    job,
    status: "completed",
    output: runNodeScript("check-links.mjs", commandArgs),
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }

  const jobs = readJobList(args)
  const write = readBoolean(args, "write", false)
  const run = createRunRecord({ kind: "local_job_runner" })
  const results = []

  for (const job of jobs) {
    try {
      results.push(runTrackedJob(job, args, write))
    } catch (error) {
      const childRuns = error.childRuns ?? []
      results.push({
        job,
        status: "failed",
        output: error.stdout?.trim?.() ?? "",
        error: error.message,
        metrics: summarizeRunCounts(childRuns),
        childRuns: childRuns.map(projectChildRun),
      })
    }
  }

  const childRuns = results.flatMap((result) => result.childRuns ?? [])
  const childRunMetrics = summarizeRunCounts(childRuns)
  const failed = results.filter((result) => result.status === "failed")
  const childRunErrors = childRuns.filter(
    (run) => run.status === "completed_with_errors" || run.error_count > 0
  )
  const skipped = results.filter((result) => result.status === "skipped")
  const completed = results.filter((result) => result.status === "completed")
  const finished = finishRunRecord(run, {
    status:
      failed.length || childRunErrors.length
        ? "completed_with_errors"
        : "completed",
    ...childRunMetrics,
    flagged_count:
      childRunMetrics.flagged_count + failed.length + skipped.length,
    errors: [
      ...failed.map((result) => ({
        job: result.job,
        message: result.error,
      })),
      ...childRunErrors.map((run) => ({
        childRunId: run.run_id,
        kind: run.kind,
        errorCount: run.error_count,
      })),
    ],
  })

  if (write) appendJsonl(STORE_PATHS.runs, [finished])

  console.log(
    JSON.stringify(
      {
        runId: finished.run_id,
        status: finished.status,
        write,
        metrics: childRunMetrics,
        completedJobs: completed.length,
        skippedJobs: skipped.length,
        failedJobs: failed.length,
        jobs: results,
      },
      null,
      2
    )
  )

  if (failed.length) process.exit(1)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
