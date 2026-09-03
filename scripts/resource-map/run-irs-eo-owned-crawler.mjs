#!/usr/bin/env node
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"

import {
  ENGINE_DIR,
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
} from "./lib/data-engine/shared.mjs"
import {
  buildOwnedCrawlerDryRun,
  runIrsEoOwnedCrawler,
  validateIrsEoOwnedExecutionContract,
  validateIrsEoOwnedFetchPlan,
} from "./lib/irs-eo-owned-crawler.mjs"

function atomicPrivateWrite(filePath, body) {
  mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 })
  const temporary = `${filePath}.tmp-${process.pid}`
  rmSync(temporary, { force: true })
  try {
    writeFileSync(temporary, body, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    })
    renameSync(temporary, filePath)
    chmodSync(filePath, 0o600)
  } catch (error) {
    rmSync(temporary, { force: true })
    throw error
  }
}

function jsonl(rows) {
  return rows.length
    ? `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`
    : ""
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
  const planPath = requiredPath(args, "fetch-plan")
  const plan = JSON.parse(readFileSync(planPath, "utf8"))
  validateIrsEoOwnedFetchPlan(plan)
  const network = readBoolean(args, "network", false)
  const write = readBoolean(args, "write", false)
  if (!network && !write) {
    console.log(JSON.stringify(buildOwnedCrawlerDryRun(plan), null, 2))
    return
  }
  if (!network || !write) {
    throw new Error("Live execution requires both --network true and --write.")
  }
  const parentPlanPath = requiredPath(args, "search-plan")
  const parentPlan = JSON.parse(readFileSync(parentPlanPath, "utf8"))
  validateIrsEoOwnedExecutionContract(plan, parentPlan)
  const confirmation = readString(args.get("confirm-plan"))
  if (confirmation !== plan.planHash) {
    throw new Error(
      "Live execution requires --confirm-plan with the exact fetch-plan hash."
    )
  }

  const outputDirectory = resolve(
    readString(
      args.get("output-directory"),
      join(ENGINE_DIR, "eo", "crawl", plan.planHash)
    )
  )
  const receiptsPath = join(outputDirectory, "receipts.jsonl")
  const checkpointPath = join(outputDirectory, "checkpoint.json")
  const existingReceipts = readJsonl(receiptsPath)
  const result = await runIrsEoOwnedCrawler(plan, {
    parentPlan,
    existingReceipts,
    onReceipt(_receipt, receipts) {
      atomicPrivateWrite(receiptsPath, jsonl(receipts))
      atomicPrivateWrite(
        checkpointPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            kind: "irs_eo_owned_crawl_checkpoint",
            packageId: plan.packageId,
            planHash: plan.planHash,
            completedRequestIds: receipts
              .filter(({ receiptType }) => receiptType === "provider")
              .map(({ requestId }) => requestId),
            lastReceiptHash: receipts.at(-1)?.receiptHash ?? null,
            publicDisplayEligible: false,
            publicationBlocked: true,
          },
          null,
          2
        )}\n`
      )
    },
  })
  atomicPrivateWrite(
    join(outputDirectory, "manifest.json"),
    `${JSON.stringify(result.manifest, null, 2)}\n`
  )
  const report = {
    schemaVersion: 1,
    kind: "irs_eo_owned_crawler_report",
    dryRun: false,
    packageId: plan.packageId,
    planHash: plan.planHash,
    counts: result.manifest.counts,
    outputs: {
      receipts: receiptsPath,
      checkpoint: checkpointPath,
      manifest: join(outputDirectory, "manifest.json"),
    },
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
  atomicPrivateWrite(
    join(outputDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`
  )
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
