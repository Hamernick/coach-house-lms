import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  buildIrsEoIdentityEvents,
  buildIrsEoResearchEvent,
  replayIrsEoResearchEvents,
} from "../../scripts/resource-map/lib/irs-eo-research-control-plane.mjs"
import {
  buildIrsEoWorkPackagePlan,
  claimIrsEoWorkPackage,
  completeIrsEoWorkPackage,
  failIrsEoWorkPackage,
  heartbeatIrsEoWorkPackage,
  summarizeIrsEoWorkPlan,
  writeIrsEoWorkPackagePlan,
} from "../../scripts/resource-map/lib/irs-eo-work-packages.mjs"

const ROOT = process.cwd()
const SCRIPT = join(ROOT, "scripts/resource-map/plan-irs-eo-benchmark.mjs")
const HEADER =
  "EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME"
const OBSERVED_AT = "2026-09-01T16:00:00.000Z"

function csvRow(ein: string, name: string, state: string, ntee: string) {
  return [
    ein,
    name,
    "",
    "1 Filing Way",
    "City",
    state,
    "00000",
    "0000",
    "03",
    "3",
    "1000",
    "202001",
    "1",
    "10",
    "",
    "1",
    "01",
    "202512",
    "0",
    "0",
    "06",
    "0",
    "12",
    "0",
    "0",
    "0",
    ntee,
    "",
  ].join(",")
}

function readJsonl(filePath: string) {
  return readFileSync(filePath, "utf8")
    .trim()
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>)
}

describe("IRS EO research control plane", () => {
  it("builds tamper-evident, idempotent identity transitions", () => {
    const candidate = {
      discoveryId: "irs-eo:123456789",
      ein: "123456789",
      organizationName: "Community Provider",
      publicDisplayEligible: false,
    }
    const events = buildIrsEoIdentityEvents(candidate, OBSERVED_AT)
    const projections = replayIrsEoResearchEvents([
      events[0],
      events[0],
      events[1],
    ])

    expect(events).toHaveLength(2)
    expect(events.every((event) => event.publicationBlocked)).toBe(true)
    expect(projections.get("123456789")).toMatchObject({
      state: "identity_resolved",
      eventCount: 2,
      publicDisplayEligible: false,
      publicationBlocked: true,
    })
  })

  it("rejects skipped stages, missing evidence, and altered events", () => {
    const evidenceRefs = [
      {
        kind: "provider_page",
        contentHash: "a".repeat(64),
      },
    ]
    expect(() =>
      buildIrsEoResearchEvent({
        ein: "123456789",
        fromState: "unseen",
        toState: "published",
        evidenceRefs,
        inputHash: "b".repeat(64),
        observedAt: OBSERVED_AT,
      })
    ).toThrow("not allowed")
    expect(() =>
      buildIrsEoResearchEvent({
        ein: "123456789",
        fromState: "unseen",
        toState: "discovered",
        evidenceRefs: [],
        inputHash: "b".repeat(64),
        observedAt: OBSERVED_AT,
      })
    ).toThrow("at least one evidence")

    const [event] = buildIrsEoIdentityEvents(
      { ein: "123456789", organizationName: "Provider" },
      OBSERVED_AT
    )
    expect(() =>
      replayIrsEoResearchEvents([{ ...event, reason: "altered" }])
    ).toThrow("hash mismatch")
  })

  it("samples the full unique corpus and writes only with explicit opt-in", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-benchmark-"))
    try {
      const first = join(directory, "eo1.csv")
      const second = join(directory, "eo2.csv")
      const results = join(directory, "results.jsonl")
      const cohort = join(directory, "cohort.jsonl")
      const events = join(directory, "events.jsonl")
      const manifest = join(directory, "manifest.json")
      writeFileSync(
        first,
        [
          HEADER,
          csvRow("123456789", "Pantry", "IL", "K30"),
          csvRow("111222333", "Clinic", "NY", "E32"),
        ].join("\n") + "\n"
      )
      writeFileSync(
        second,
        [
          HEADER,
          csvRow("123456789", "Pantry duplicate", "IL", "K30"),
          csvRow("222333444", "Foundation", "CA", "T20"),
          csvRow("333444555", "Transit", "TX", "P52"),
        ].join("\n") + "\n"
      )
      writeFileSync(results, `${JSON.stringify({ ein: "111222333" })}\n`)

      const args = [
        SCRIPT,
        "--input",
        `${first},${second}`,
        "--result-ledger",
        results,
        "--sample",
        "2",
        "--observed-at",
        OBSERVED_AT,
        "--output",
        cohort,
        "--events-output",
        events,
        "--manifest",
        manifest,
      ]
      const dryRun = JSON.parse(
        execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" })
      )
      expect(dryRun).toMatchObject({
        dryRun: true,
        counts: {
          scanned: 5,
          unique: 4,
          duplicateEin: 1,
          previouslyResearched: 1,
          eligible: 3,
          sampled: 2,
          ledgerEvents: 4,
          aiCalls: 0,
          networkRequests: 0,
          databaseWrites: 0,
          reviewed: 0,
          published: 0,
        },
        projectedStates: { identity_resolved: 2 },
        outputHashes: {
          cohortSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
          identityEventsSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
        },
        publicDisplayEligible: false,
        publicationBlocked: true,
      })
      expect(existsSync(cohort)).toBe(false)

      execFileSync(process.execPath, [...args, "--write"], {
        cwd: ROOT,
        encoding: "utf8",
      })
      const cohortRows = readJsonl(cohort)
      expect(cohortRows).toHaveLength(2)
      expect(
        cohortRows.every(
          (candidate) =>
            typeof (candidate.benchmark as Record<string, unknown>)
              .projectionWeight === "number"
        )
      ).toBe(true)
      expect(readJsonl(events)).toHaveLength(4)
      expect(
        readJsonl(events).every((event) => event.publicationBlocked === true)
      ).toBe(true)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("leases immutable work packages and recovers expired claims", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-work-plan-"))
    try {
      const candidates = [
        ["123456789", "Provider A", "IL:K"],
        ["111222333", "Provider B", "NY:E"],
        ["222333444", "Provider C", "CA:T"],
      ].map(([ein, organizationName, stratum]) => ({
        ein,
        organizationName,
        filingAddress: { state: stratum.slice(0, 2) },
        benchmark: { stratum, projectionWeight: 2 },
      }))
      const plan = buildIrsEoWorkPackagePlan(candidates, { packageSize: 2 })
      const planDirectory = writeIrsEoWorkPackagePlan(directory, plan)
      const first = claimIrsEoWorkPackage(planDirectory, {
        workerId: "worker-a",
        observedAt: "2026-09-01T16:00:00.000Z",
        leaseMinutes: 30,
      })
      const second = claimIrsEoWorkPackage(planDirectory, {
        workerId: "worker-b",
        observedAt: "2026-09-01T16:00:00.000Z",
        leaseMinutes: 30,
      })

      expect(first?.workPackage.records).toHaveLength(2)
      expect(second?.workPackage.records).toHaveLength(1)
      expect(first?.lease.packageId).not.toBe(second?.lease.packageId)
      heartbeatIrsEoWorkPackage(planDirectory, {
        packageId: first!.lease.packageId,
        leaseId: first!.lease.leaseId,
        observedAt: "2026-09-01T16:10:00.000Z",
      })
      expect(
        claimIrsEoWorkPackage(planDirectory, {
          workerId: "worker-c",
          observedAt: "2026-09-01T16:20:00.000Z",
          leaseMinutes: 30,
        })
      ).toBeNull()

      completeIrsEoWorkPackage(planDirectory, {
        packageId: first!.lease.packageId,
        leaseId: first!.lease.leaseId,
        observedAt: "2026-09-01T16:25:00.000Z",
        outcomeHash: "c".repeat(64),
        counts: { records: 2, searches: 6 },
      })
      const reclaimed = claimIrsEoWorkPackage(planDirectory, {
        workerId: "worker-c",
        observedAt: "2026-09-01T16:31:00.000Z",
        leaseMinutes: 30,
      })
      expect(reclaimed?.lease.packageId).toBe(second?.lease.packageId)
      expect(reclaimed?.lease.leaseId).not.toBe(second?.lease.leaseId)
      failIrsEoWorkPackage(planDirectory, {
        packageId: reclaimed!.lease.packageId,
        leaseId: reclaimed!.lease.leaseId,
        observedAt: "2026-09-01T16:35:00.000Z",
        errorCode: "search_provider_timeout",
        retryable: true,
      })
      const finalAttempt = claimIrsEoWorkPackage(planDirectory, {
        workerId: "worker-d",
        observedAt: "2026-09-01T16:36:00.000Z",
        leaseMinutes: 30,
      })
      expect(finalAttempt?.lease.attempt).toBe(2)
      failIrsEoWorkPackage(planDirectory, {
        packageId: finalAttempt!.lease.packageId,
        leaseId: finalAttempt!.lease.leaseId,
        observedAt: "2026-09-01T16:37:00.000Z",
        errorCode: "package_contract_violation",
        retryable: false,
      })
      expect(summarizeIrsEoWorkPlan(planDirectory)).toMatchObject({
        packages: 2,
        active: 0,
        completed: 1,
        expired: 1,
        failedAttempts: 1,
        deadLetter: 1,
        remaining: 0,
        publicationBlocked: true,
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
