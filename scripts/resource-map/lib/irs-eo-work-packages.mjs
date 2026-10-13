import { randomUUID } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"

import { sha256 } from "./data-engine/shared.mjs"
import { buildIrsEoSearchQueries } from "./irs-eo-acquisition.mjs"
import { stableJson } from "./irs-eo-research-control-plane.mjs"

export const IRS_EO_WORK_PACKAGE_SCHEMA_VERSION = 1
export const IRS_EO_WORK_BUDGET_VERSION = "resource-map-discovery-budget-v2"
export const IRS_EO_MAX_PACKAGE_ATTEMPTS = 3

function atomicWrite(filePath, body) {
  mkdirSync(dirname(filePath), { recursive: true })
  if (existsSync(filePath)) {
    if (readFileSync(filePath, "utf8") === body) return
    throw new Error(
      `Immutable work artifact already exists with different content: ${filePath}`
    )
  }
  const tempPath = `${filePath}.${randomUUID()}.tmp`
  writeFileSync(tempPath, body, { flag: "wx" })
  renameSync(tempPath, filePath)
}

function orderedAcrossStrata(candidates) {
  const strata = new Map()
  for (const candidate of candidates) {
    const stratum = candidate.benchmark?.stratum ?? "unknown"
    const entries = strata.get(stratum) ?? []
    entries.push(candidate)
    strata.set(stratum, entries)
  }
  const queues = [...strata.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([stratum, entries]) => ({
      stratum,
      entries: entries.sort((left, right) => left.ein.localeCompare(right.ein)),
    }))
  const ordered = []
  while (true) {
    let advanced = false
    for (const queue of queues) {
      if (queue.entries.length === 0) continue
      ordered.push(queue.entries.shift())
      advanced = true
    }
    if (!advanced) return ordered
  }
}

function buildBudgets(recordCount) {
  return {
    version: IRS_EO_WORK_BUDGET_VERSION,
    maxSearchQueries: recordCount * 3,
    maxHttpRequests: recordCount * 6,
    maxBrowserRenders: Math.max(1, Math.ceil(recordCount / 10)),
    maxModelCalls: 0,
    maxRetainedBytes: recordCount * 1_000_000,
    maxDurationMinutes: 45,
    maxAttemptsPerRecord: 3,
    maxPackageAttempts: IRS_EO_MAX_PACKAGE_ATTEMPTS,
  }
}

function buildRecord(candidate) {
  return {
    ein: candidate.ein,
    organizationName: candidate.organizationName,
    filingState: candidate.filingAddress?.state ?? null,
    nteeCode: candidate.nteeCode ?? null,
    categoryHints: candidate.categoryHints ?? [],
    benchmarkStratum: candidate.benchmark?.stratum ?? "unknown",
    projectionWeight: candidate.benchmark?.projectionWeight ?? 1,
    searchQueries: buildIrsEoSearchQueries(candidate),
    expectedState: "identity_resolved",
    publicationBlocked: true,
  }
}

export function buildIrsEoWorkPackagePlan(
  candidates,
  { packageSize = 25 } = {}
) {
  if (
    !Number.isSafeInteger(packageSize) ||
    packageSize <= 0 ||
    packageSize > 250
  ) {
    throw new Error("Work package size must be between 1 and 250.")
  }
  const uniqueEins = new Set(candidates.map((candidate) => candidate.ein))
  if (uniqueEins.size !== candidates.length) {
    throw new Error("Work package input contains duplicate EINs.")
  }
  const cohortHash = sha256(
    candidates.map((candidate) => stableJson(candidate)).join("\n")
  )
  const planVersionHash = sha256(
    `${cohortHash}:${packageSize}:${IRS_EO_WORK_BUDGET_VERSION}:${IRS_EO_WORK_PACKAGE_SCHEMA_VERSION}`
  )
  const planId = `resource-map-discovery-${planVersionHash.slice(0, 16)}-p${packageSize}`
  const ordered = orderedAcrossStrata(candidates)
  const packages = []

  for (let offset = 0; offset < ordered.length; offset += packageSize) {
    const records = ordered.slice(offset, offset + packageSize).map(buildRecord)
    const sequence = packages.length + 1
    const packageBody = {
      schemaVersion: IRS_EO_WORK_PACKAGE_SCHEMA_VERSION,
      kind: "irs_eo_discovery_work_package",
      planId,
      sequence,
      stage: "provider_discovery",
      records,
      budgets: buildBudgets(records.length),
      requiredOutputs: [
        "provider_search_candidates",
        "per_record_outcome",
        "stage_telemetry",
      ],
      allowedOutcomeStates: [
        "sources_fetched",
        "no_public_presence",
        "inactive",
        "not_public_service",
        "blocked_by_robots",
        "unreachable",
        "conflict",
        "needs_human",
      ],
      publicDisplayEligible: false,
      publicationBlocked: true,
    }
    const packageHash = sha256(stableJson(packageBody))
    packages.push({
      ...packageBody,
      packageId: `discovery-${String(sequence).padStart(5, "0")}-${packageHash.slice(0, 12)}`,
      packageHash,
    })
  }

  const manifestBody = {
    schemaVersion: IRS_EO_WORK_PACKAGE_SCHEMA_VERSION,
    kind: "irs_eo_work_package_plan",
    planId,
    cohortHash,
    packageSize,
    recordCount: candidates.length,
    packageCount: packages.length,
    packageHashes: packages.map((workPackage) => ({
      packageId: workPackage.packageId,
      packageHash: workPackage.packageHash,
    })),
    budgetVersion: IRS_EO_WORK_BUDGET_VERSION,
    publicDisplayEligible: false,
    publicationBlocked: true,
  }

  return {
    manifest: {
      ...manifestBody,
      manifestHash: sha256(stableJson(manifestBody)),
    },
    packages,
  }
}

export function writeIrsEoWorkPackagePlan(rootDirectory, plan) {
  const planDirectory = join(rootDirectory, plan.manifest.planId)
  const packagesDirectory = join(planDirectory, "packages")
  mkdirSync(packagesDirectory, { recursive: true })
  for (const workPackage of plan.packages) {
    atomicWrite(
      join(packagesDirectory, `${workPackage.packageId}.json`),
      `${JSON.stringify(workPackage, null, 2)}\n`
    )
  }
  atomicWrite(
    join(planDirectory, "manifest.json"),
    `${JSON.stringify(plan.manifest, null, 2)}\n`
  )
  return planDirectory
}

export function validateIrsEoWorkPackage(workPackage) {
  const { packageId, packageHash, ...packageBody } = workPackage ?? {}
  if (
    !packageId ||
    !packageHash ||
    sha256(stableJson(packageBody)) !== packageHash
  ) {
    throw new Error(`Work package hash mismatch: ${packageId ?? "missing"}.`)
  }
  return workPackage
}

function readLease(leaseDirectory) {
  const leasePath = join(leaseDirectory, "lease.json")
  if (!existsSync(leasePath)) return null
  return JSON.parse(readFileSync(leasePath, "utf8"))
}

function readPlanManifest(planDirectory) {
  const manifest = JSON.parse(
    readFileSync(join(planDirectory, "manifest.json"), "utf8")
  )
  const { manifestHash, ...manifestBody } = manifest
  if (sha256(stableJson(manifestBody)) !== manifestHash) {
    throw new Error("Work plan manifest hash mismatch.")
  }
  return manifest
}

function readWorkPackage(planDirectory, entry) {
  const workPackage = validateIrsEoWorkPackage(
    JSON.parse(
      readFileSync(
        join(planDirectory, "packages", `${entry.packageId}.json`),
        "utf8"
      )
    )
  )
  const { packageId, packageHash } = workPackage
  if (packageId !== entry.packageId || packageHash !== entry.packageHash) {
    throw new Error(`Work package hash mismatch: ${entry.packageId}.`)
  }
  return workPackage
}

function latestLeaseActivity(leaseDirectory, lease) {
  const heartbeatDirectory = join(leaseDirectory, "heartbeats")
  if (!existsSync(heartbeatDirectory)) return Date.parse(lease.claimedAt)
  return readdirSync(heartbeatDirectory)
    .map((file) =>
      JSON.parse(readFileSync(join(heartbeatDirectory, file), "utf8"))
    )
    .reduce(
      (latest, heartbeat) => Math.max(latest, Date.parse(heartbeat.observedAt)),
      Date.parse(lease.claimedAt)
    )
}

function countFailedAttempts(planDirectory, packageId) {
  const directory = join(planDirectory, "leases", "failed", packageId)
  return existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true }).filter((entry) =>
        entry.isDirectory()
      ).length
    : 0
}

export function claimIrsEoWorkPackage(
  planDirectory,
  { workerId, observedAt, leaseMinutes = 30 }
) {
  const manifest = readPlanManifest(planDirectory)
  const activeRoot = join(planDirectory, "leases", "active")
  const expiredRoot = join(planDirectory, "leases", "expired")
  const completedRoot = join(planDirectory, "leases", "completed")
  const deadLetterRoot = join(planDirectory, "leases", "dead-letter")
  mkdirSync(activeRoot, { recursive: true })
  mkdirSync(expiredRoot, { recursive: true })
  mkdirSync(completedRoot, { recursive: true })
  mkdirSync(deadLetterRoot, { recursive: true })
  const now = Date.parse(observedAt)
  if (
    !workerId ||
    Number.isNaN(now) ||
    !Number.isSafeInteger(leaseMinutes) ||
    leaseMinutes <= 0 ||
    leaseMinutes > 1_440
  ) {
    throw new Error(
      "Claiming work requires a worker ID and valid observation time."
    )
  }

  for (const entry of manifest.packageHashes) {
    if (existsSync(join(completedRoot, entry.packageId))) continue
    if (existsSync(join(deadLetterRoot, entry.packageId))) continue
    const activeDirectory = join(activeRoot, entry.packageId)
    if (existsSync(activeDirectory)) {
      const activeLease = readLease(activeDirectory)
      const lastActivity = activeLease
        ? latestLeaseActivity(activeDirectory, activeLease)
        : 0
      const ttl = (activeLease?.leaseMinutes ?? leaseMinutes) * 60_000
      if (lastActivity + ttl > now) continue
      const expiredName = `${entry.packageId}-${activeLease?.leaseId ?? "orphan"}`
      try {
        renameSync(activeDirectory, join(expiredRoot, expiredName))
      } catch (error) {
        if (error.code !== "ENOENT") throw error
        continue
      }
    }

    try {
      mkdirSync(activeDirectory)
    } catch (error) {
      if (error.code === "EEXIST") continue
      throw error
    }
    const lease = {
      schemaVersion: 1,
      kind: "irs_eo_work_lease",
      leaseId: randomUUID(),
      planId: manifest.planId,
      packageId: entry.packageId,
      packageHash: entry.packageHash,
      workerId,
      claimedAt: new Date(now).toISOString(),
      leaseMinutes,
      attempt: countFailedAttempts(planDirectory, entry.packageId) + 1,
    }
    writeFileSync(
      join(activeDirectory, "lease.json"),
      `${JSON.stringify(lease, null, 2)}\n`,
      { flag: "wx" }
    )
    return {
      lease,
      workPackage: readWorkPackage(planDirectory, entry),
    }
  }

  return null
}

export function heartbeatIrsEoWorkPackage(
  planDirectory,
  { packageId, leaseId, observedAt }
) {
  const leaseDirectory = join(planDirectory, "leases", "active", packageId)
  const lease = readLease(leaseDirectory)
  if (!lease || lease.leaseId !== leaseId) {
    throw new Error("Active work lease does not match.")
  }
  const heartbeat = {
    leaseId,
    packageId,
    observedAt: new Date(observedAt).toISOString(),
  }
  const directory = join(leaseDirectory, "heartbeats")
  if (!existsSync(directory)) mkdirSync(directory)
  writeFileSync(
    join(
      directory,
      `${heartbeat.observedAt.replaceAll(":", "-")}-${randomUUID()}.json`
    ),
    `${JSON.stringify(heartbeat)}\n`,
    { flag: "wx" }
  )
  return heartbeat
}

export function completeIrsEoWorkPackage(
  planDirectory,
  { packageId, leaseId, observedAt, outcomeHash, counts }
) {
  const activeDirectory = join(planDirectory, "leases", "active", packageId)
  const lease = readLease(activeDirectory)
  if (!lease || lease.leaseId !== leaseId) {
    throw new Error("Active work lease does not match.")
  }
  if (!/^[a-f0-9]{64}$/u.test(outcomeHash ?? "")) {
    throw new Error("Completing work requires a SHA-256 outcome hash.")
  }
  const completion = {
    schemaVersion: 1,
    kind: "irs_eo_work_completion",
    packageId,
    leaseId,
    observedAt: new Date(observedAt).toISOString(),
    outcomeHash,
    counts,
  }
  writeFileSync(
    join(activeDirectory, "completion.json"),
    `${JSON.stringify(completion, null, 2)}\n`,
    { flag: "wx" }
  )
  const completedRoot = join(planDirectory, "leases", "completed")
  mkdirSync(completedRoot, { recursive: true })
  renameSync(activeDirectory, join(completedRoot, packageId))
  return completion
}

export function failIrsEoWorkPackage(
  planDirectory,
  { packageId, leaseId, observedAt, errorCode, retryable = true }
) {
  const activeDirectory = join(planDirectory, "leases", "active", packageId)
  const lease = readLease(activeDirectory)
  if (!lease || lease.leaseId !== leaseId) {
    throw new Error("Active work lease does not match.")
  }
  if (!errorCode) throw new Error("Failing work requires an error code.")
  const failure = {
    schemaVersion: 1,
    kind: "irs_eo_work_failure",
    packageId,
    leaseId,
    attempt: lease.attempt,
    observedAt: new Date(observedAt).toISOString(),
    errorCode,
    retryable,
  }
  writeFileSync(
    join(activeDirectory, "failure.json"),
    `${JSON.stringify(failure, null, 2)}\n`,
    { flag: "wx" }
  )
  if (retryable && lease.attempt < IRS_EO_MAX_PACKAGE_ATTEMPTS) {
    const failedRoot = join(planDirectory, "leases", "failed", packageId)
    mkdirSync(failedRoot, { recursive: true })
    renameSync(activeDirectory, join(failedRoot, leaseId))
  } else {
    const deadLetterRoot = join(planDirectory, "leases", "dead-letter")
    mkdirSync(deadLetterRoot, { recursive: true })
    renameSync(activeDirectory, join(deadLetterRoot, packageId))
  }
  return failure
}

export function summarizeIrsEoWorkPlan(planDirectory) {
  const manifest = readPlanManifest(planDirectory)
  const countDirectories = (name) => {
    const directory = join(planDirectory, "leases", name)
    return existsSync(directory)
      ? readdirSync(directory, { withFileTypes: true }).filter((entry) =>
          entry.isDirectory()
        ).length
      : 0
  }
  return {
    planId: manifest.planId,
    packages: manifest.packageCount,
    active: countDirectories("active"),
    completed: countDirectories("completed"),
    expired: countDirectories("expired"),
    failedAttempts: existsSync(join(planDirectory, "leases", "failed"))
      ? readdirSync(join(planDirectory, "leases", "failed"), {
          withFileTypes: true,
        })
          .filter((entry) => entry.isDirectory())
          .reduce(
            (sum, entry) =>
              sum + countFailedAttempts(planDirectory, entry.name),
            0
          )
      : 0,
    deadLetter: countDirectories("dead-letter"),
    remaining:
      manifest.packageCount -
      countDirectories("completed") -
      countDirectories("dead-letter"),
    publicationBlocked: true,
  }
}
