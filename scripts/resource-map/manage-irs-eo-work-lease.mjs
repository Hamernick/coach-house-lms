#!/usr/bin/env node
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"

import {
  ENGINE_DIR,
  nowIso,
  parseArgs,
  readBoolean,
  readString,
  sha256,
} from "./lib/data-engine/shared.mjs"
import {
  claimIrsEoWorkPackage,
  completeIrsEoWorkPackage,
  failIrsEoWorkPackage,
  heartbeatIrsEoWorkPackage,
  summarizeIrsEoWorkPlan,
} from "./lib/irs-eo-work-packages.mjs"

function requireWrite(args, action) {
  if (!readBoolean(args, "write", false)) {
    throw new Error(`${action} requires --write.`)
  }
}

function requireString(args, key) {
  const value = readString(args.get(key))
  if (!value) throw new Error(`--${key} is required.`)
  return value
}

function parseCounts(value) {
  if (!value) return {}
  const counts = JSON.parse(value)
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    throw new Error("--counts must be a JSON object.")
  }
  return counts
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const action = readString(args.get("action"), "status")
  const planDirectory = resolve(
    readString(args.get("plan"), join(ENGINE_DIR, "eo", "work"))
  )
  if (!existsSync(join(planDirectory, "manifest.json"))) {
    throw new Error(`Work plan not found: ${planDirectory}`)
  }
  const observedAt = readString(args.get("observed-at"), nowIso())
  let result

  if (action === "status") {
    result = summarizeIrsEoWorkPlan(planDirectory)
  } else if (action === "claim") {
    requireWrite(args, action)
    result = claimIrsEoWorkPackage(planDirectory, {
      workerId: requireString(args, "worker"),
      observedAt,
      leaseMinutes: Number.parseInt(
        readString(args.get("lease-minutes"), "30"),
        10
      ),
    })
  } else if (action === "heartbeat") {
    requireWrite(args, action)
    result = heartbeatIrsEoWorkPackage(planDirectory, {
      packageId: requireString(args, "package-id"),
      leaseId: requireString(args, "lease-id"),
      observedAt,
    })
  } else if (action === "complete") {
    requireWrite(args, action)
    const outcome = requireString(args, "outcome")
    result = completeIrsEoWorkPackage(planDirectory, {
      packageId: requireString(args, "package-id"),
      leaseId: requireString(args, "lease-id"),
      observedAt,
      outcomeHash: /^[a-f0-9]{64}$/u.test(outcome) ? outcome : sha256(outcome),
      counts: parseCounts(args.get("counts")),
    })
  } else if (action === "fail") {
    requireWrite(args, action)
    result = failIrsEoWorkPackage(planDirectory, {
      packageId: requireString(args, "package-id"),
      leaseId: requireString(args, "lease-id"),
      observedAt,
      errorCode: requireString(args, "error-code"),
      retryable: readBoolean(args, "retryable", true),
    })
  } else {
    throw new Error(`Unsupported work lease action: ${action}`)
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
