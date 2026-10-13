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
  buildDeterministicDomainHypotheses,
  buildIrsEoOwnedEvidenceIndex,
  runSelfHostedEvidenceIndexAdapter,
} from "../../scripts/resource-map/lib/irs-eo-owned-discovery.mjs"
import {
  buildIrsEoSearchPlan,
  IRS_EO_SEARCH_ADAPTERS,
} from "../../scripts/resource-map/lib/irs-eo-search-discovery.mjs"
import { buildIrsEoWorkPackagePlan } from "../../scripts/resource-map/lib/irs-eo-work-packages.mjs"

const ROOT = process.cwd()
const SCRIPT = join(
  ROOT,
  "scripts/resource-map/plan-irs-eo-owned-discovery.mjs"
)

function searchPlan() {
  const candidates = [
    ["123456789", "Distinctive Harbor Community Services Inc", "IL:K"],
    ["987654321", "Provider Two Inc", "NY:E"],
  ].map(([ein, organizationName, stratum]) => ({
    ein,
    organizationName,
    filingAddress: { city: "City", state: stratum.slice(0, 2) },
    benchmark: { stratum, projectionWeight: 1 },
  }))
  const workPackage = buildIrsEoWorkPackagePlan(candidates, {
    packageSize: 2,
  }).packages[0]
  return buildIrsEoSearchPlan(workPackage)
}

describe("IRS EO owned discovery", () => {
  it("contains no paid adapter or paid-search policy", () => {
    const plan = searchPlan()
    expect(IRS_EO_SEARCH_ADAPTERS.every(({ paid }) => paid === false)).toBe(
      true
    )
    expect(IRS_EO_SEARCH_ADAPTERS.map(({ adapterId }) => adapterId)).toEqual([
      "local_evidence_cache",
      "authoritative_directory_index",
      "self_hosted_evidence_index",
      "deterministic_domain_candidates",
      "bounded_public_crawler",
      "sandboxed_browser",
    ])
    expect(plan).toMatchObject({
      ownedDiscoveryPolicy: {
        paidProvidersAllowed: false,
        commercialSearchScrapingAllowed: false,
        robotsRequired: true,
      },
      publicationBlocked: true,
    })
    expect(plan).not.toHaveProperty("networkSearchPolicy")
  })

  it("builds a private sharded index and allows only exact identity matches", () => {
    const index = buildIrsEoOwnedEvidenceIndex([
      {
        organizationName: "Provider Two Inc",
        state: "NY",
        providerWebsiteUrl: "https://provider-two.example.org/",
        sourceUrl: "https://directory.example.gov/provider-two",
        sourceKind: "government_directory",
        fetchedAt: "2026-09-02T00:00:00.000Z",
      },
      {
        organizationName: "Provider Too",
        state: "NY",
        providerWebsiteUrl: "https://wrong.example.org/",
        sourceUrl: "https://directory.example.gov/wrong",
        sourceKind: "government_directory",
      },
      {
        organizationName: "Unsupported",
        state: "IL",
        providerWebsiteUrl: "https://unsupported.example.org/",
        sourceUrl: "https://example.org/unsupported",
        sourceKind: "search_result",
      },
    ])
    expect(index.manifest).toMatchObject({
      counts: { inputRows: 3, entries: 2, rejectedRows: 1 },
      publicationBlocked: true,
    })
    expect(index.entries.every(({ shardKey }) => shardKey.length === 2)).toBe(
      true
    )

    const results = runSelfHostedEvidenceIndexAdapter(searchPlan(), index)
    const completed = results.filter(({ status }) => status === "completed")
    expect(completed).toHaveLength(1)
    expect(completed[0]).toMatchObject({
      adapterId: "self_hosted_evidence_index",
      results: [
        {
          url: "https://provider-two.example.org/",
          sourceKind: "government_directory",
          matchMethod: "name_state_exact",
        },
      ],
      publicationBlocked: true,
    })
  })

  it("creates bounded unverified .org hypotheses only for distinctive names", () => {
    expect(
      buildDeterministicDomainHypotheses(
        "Distinctive Harbor Community Services Inc"
      )
    ).toEqual([
      "https://distinctiveharborcommunityservices.org/",
      "https://dhcs.org/",
    ])
    expect(
      buildDeterministicDomainHypotheses("Community Services Foundation")
    ).toEqual([])
  })

  it("plans owned discovery without network, paid queries, or implicit writes", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-owned-discovery-"))
    try {
      const planPath = join(directory, "search-plan.json")
      const evidencePath = join(directory, "evidence.jsonl")
      const outputDirectory = join(directory, "output")
      writeFileSync(planPath, `${JSON.stringify(searchPlan(), null, 2)}\n`)
      writeFileSync(
        evidencePath,
        `${JSON.stringify({
          ein: "987654321",
          organizationName: "Provider Two",
          state: "NY",
          providerWebsiteUrl: "https://provider-two.example.org/",
          sourceUrl: "https://directory.example.gov/provider-two",
          sourceKind: "government_directory",
        })}\n`
      )
      const args = [
        SCRIPT,
        "--plan",
        planPath,
        "--evidence-documents",
        evidencePath,
        "--output-directory",
        outputDirectory,
      ]
      const dryRun = JSON.parse(
        execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" })
      )
      expect(dryRun).toMatchObject({
        dryRun: true,
        counts: {
          indexedEvidence: 1,
          networkRequests: 0,
          paidQueries: 0,
          aiCalls: 0,
          databaseWrites: 0,
          published: 0,
        },
        publicationBlocked: true,
      })
      expect(existsSync(outputDirectory)).toBe(false)

      execFileSync(process.execPath, [...args, "--write"], {
        cwd: ROOT,
        encoding: "utf8",
      })
      expect(
        JSON.parse(
          readFileSync(join(outputDirectory, "fetch-plan.json"), "utf8")
        )
      ).toMatchObject({ publicationBlocked: true })
      expect(
        readFileSync(join(outputDirectory, "adapter-results.jsonl"), "utf8")
      ).not.toContain("search_api")
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
