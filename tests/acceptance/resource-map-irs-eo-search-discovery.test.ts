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
  buildIrsEoSearchPlan,
  buildSearchStageTelemetry,
  buildSharedProviderFetchPlan,
  IRS_EO_SEARCH_ADAPTERS,
  IRS_EO_URL_EVIDENCE_ADAPTERS,
  normalizeIrsEoSearchAdapterResults,
} from "../../scripts/resource-map/lib/irs-eo-search-discovery.mjs"
import {
  runAuthoritativeDirectorySearchAdapter,
  runLocalEvidenceSearchAdapter,
} from "../../scripts/resource-map/lib/irs-eo-search-adapters.mjs"
import { buildIrsEoWorkPackagePlan } from "../../scripts/resource-map/lib/irs-eo-work-packages.mjs"
import {
  evaluateRobotsResponse,
  normalizeAcquisitionUrl,
} from "../../scripts/resource-map/lib/web-acquisition-policy.mjs"

const ROOT = process.cwd()
const SCRIPT = join(
  ROOT,
  "scripts/resource-map/plan-irs-eo-search-discovery.mjs"
)
const ADAPTER_SCRIPT = join(
  ROOT,
  "scripts/resource-map/run-irs-eo-search-adapter.mjs"
)

function workPackage() {
  const candidates = [
    ["123456789", "Provider One", "IL:K"],
    ["987654321", "Provider Two", "NY:E"],
  ].map(([ein, organizationName, stratum]) => ({
    ein,
    organizationName,
    filingAddress: { city: "City", state: stratum.slice(0, 2) },
    benchmark: { stratum, projectionWeight: 1 },
  }))
  return buildIrsEoWorkPackagePlan(candidates, { packageSize: 2 }).packages[0]
}

function adapterRows(plan: ReturnType<typeof buildIrsEoSearchPlan>) {
  return plan.requests.map((request, index) => ({
    requestId: request.requestId,
    adapterId:
      index % 2 ? "authoritative_directory_index" : "local_evidence_cache",
    status: index === 0 || index === 3 ? "completed" : "no_results",
    results:
      index === 0
        ? [
            {
              url: "https://provider.example.org/?utm_source=search",
              title: "Provider One",
              snippet: "Official provider website",
            },
          ]
        : index === 3
          ? [
              {
                url: "https://provider.example.org/",
                title: "Provider Two",
              },
              { url: "https://facebook.com/provider-two" },
            ]
          : [],
    telemetry: { queries: 1 },
  }))
}

describe("IRS EO search discovery", () => {
  it("keeps archive lookup out of organization-name search", () => {
    expect(
      IRS_EO_SEARCH_ADAPTERS.map(({ adapterId }) => adapterId)
    ).not.toContain("common_crawl_archive")
    expect(IRS_EO_URL_EVIDENCE_ADAPTERS).toContainEqual(
      expect.objectContaining({
        adapterId: "common_crawl_archive",
        purpose: "known_url_history_only",
      })
    )
  })

  it("normalizes tracking URLs and applies conservative robots decisions", () => {
    expect(
      normalizeAcquisitionUrl(
        "https://Example.org/help?utm_source=x&b=2&a=1#section"
      )
    ).toBe("https://example.org/help?a=1&b=2")
    expect(normalizeAcquisitionUrl("https://user:pass@example.org/")).toBeNull()

    const body = [
      "User-agent: *",
      "Disallow: /private/",
      "Allow: /private/public$",
      "Crawl-delay: 2",
    ].join("\n")
    expect(
      evaluateRobotsResponse({
        status: 200,
        body,
        url: "https://example.org/private/public",
      })
    ).toMatchObject({ allowed: true, crawlDelayMs: 2_000 })
    expect(
      evaluateRobotsResponse({
        status: 200,
        body,
        url: "https://example.org/private/other",
      })
    ).toMatchObject({ allowed: false, reason: "robots_disallow" })
    expect(
      evaluateRobotsResponse({
        status: 403,
        body: "",
        url: "https://example.org/",
      })
    ).toMatchObject({ allowed: false, reason: "robots_forbidden" })
    expect(
      evaluateRobotsResponse({
        status: 404,
        body: "",
        url: "https://example.org/",
      })
    ).toMatchObject({ allowed: true, reason: "robots_unavailable" })
    expect(
      evaluateRobotsResponse({
        status: 503,
        body: "",
        url: "https://example.org/",
      })
    ).toMatchObject({ allowed: false, reason: "robots_unreachable" })
  })

  it("deduplicates provider fetches across organizations and retains telemetry", () => {
    const packageRecord = workPackage()
    const plan = buildIrsEoSearchPlan(packageRecord)
    const rows = adapterRows(plan)
    const normalized = normalizeIrsEoSearchAdapterResults(plan, rows)
    const fetchPlan = buildSharedProviderFetchPlan(normalized.candidateSets, {
      maxNetworkRequests: 10,
      maxPerHost: 3,
    })
    const telemetry = buildSearchStageTelemetry({
      packageId: packageRecord.packageId,
      adapterRows: rows,
      normalizedCounts: normalized.counts,
      fetchPlan,
    })

    expect(plan.requests).toHaveLength(6)
    expect(normalized.candidateSets).toHaveLength(2)
    expect(normalized.candidateSets.every((set) => set.searchCompleted)).toBe(
      true
    )
    expect(fetchPlan).toMatchObject({
      counts: {
        uniqueCandidateUrls: 1,
        sharedUrlConsumers: 1,
        selected: 1,
        uniqueHosts: 1,
        robotsChecks: 1,
        plannedNetworkRequests: 2,
        rejected: 1,
      },
      publicationBlocked: true,
    })
    expect(fetchPlan.requests[0].consumers).toHaveLength(2)
    expect(fetchPlan.rejected[0].reason).toBe("not_provider_candidate")
    expect(telemetry.identifiersExcludedFromMetricLabels).toEqual([
      "ein",
      "url",
      "query",
    ])
  })

  it("runs offline cache and authoritative-directory adapters without fuzzy matching", () => {
    const plan = buildIrsEoSearchPlan(workPackage())
    const cached = runLocalEvidenceSearchAdapter(plan, [
      {
        ein: "123456789",
        searchCompleted: true,
        candidates: [{ url: "https://cached.example.org/" }],
      },
    ])
    expect(cached.filter(({ status }) => status === "completed")).toHaveLength(
      1
    )
    expect(cached.filter(({ status }) => status === "miss")).toHaveLength(3)

    const directory = runAuthoritativeDirectorySearchAdapter(plan, [
      {
        ein: "123456789",
        organizationName: "Different Legal Name",
        state: "IL",
        websiteUrl: "https://ein-match.example.org/",
        sourceUrl: "https://directory.example.gov/one",
        sourceKind: "government_directory",
      },
      {
        organizationName: "Provider Two Inc",
        state: "NY",
        websiteUrl: "https://name-state.example.org/",
        sourceUrl: "https://directory.example.gov/two",
        sourceKind: "211_directory",
      },
      {
        organizationName: "Provider Two Inc",
        state: "NJ",
        websiteUrl: "https://wrong-state.example.org/",
        sourceUrl: "https://directory.example.gov/three",
        sourceKind: "provider_directory",
      },
      {
        organizationName: "Unsupported Source",
        state: "NY",
        websiteUrl: "https://unsupported.example.org/",
        sourceUrl: "https://directory.example.org/four",
        sourceKind: "unknown_directory",
      },
    ])
    const completed = directory.results.filter(
      ({ status }) => status === "completed"
    )
    expect(completed).toHaveLength(2)
    expect(completed[0].results[0]).toMatchObject({ matchMethod: "ein_exact" })
    expect(completed[1].results[0]).toMatchObject({
      matchMethod: "name_state_exact",
    })
    expect(directory.rejectedRows).toBe(1)
    const normalized = normalizeIrsEoSearchAdapterResults(
      plan,
      directory.results
    )
    expect(normalized.candidateSets[0].candidates[0]).toMatchObject({
      adapterId: "authoritative_directory_index",
      sourceKind: "government_directory",
      matchMethod: "ein_exact",
      snippetEvidenceAllowed: false,
    })
  })

  it("rejects altered packages and writes discovery artifacts only with opt-in", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-search-discovery-"))
    try {
      const packageRecord = workPackage()
      expect(() =>
        buildIrsEoSearchPlan({
          ...packageRecord,
          records: [
            { ...packageRecord.records[0], organizationName: "Altered" },
          ],
        })
      ).toThrow("hash mismatch")

      const packagePath = join(directory, "package.json")
      const adapterPath = join(directory, "adapter-results.jsonl")
      const outputDirectory = join(directory, "output")
      const plan = buildIrsEoSearchPlan(packageRecord)
      writeFileSync(packagePath, `${JSON.stringify(packageRecord, null, 2)}\n`)
      writeFileSync(
        adapterPath,
        `${adapterRows(plan)
          .map((row) => JSON.stringify(row))
          .join("\n")}\n`
      )
      const args = [
        SCRIPT,
        "--package",
        packagePath,
        "--adapter-results",
        adapterPath,
        "--output-directory",
        outputDirectory,
      ]
      const dryRun = JSON.parse(
        execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" })
      )
      expect(dryRun).toMatchObject({
        dryRun: true,
        counts: {
          records: 2,
          searchRequests: 6,
          uniqueFetches: 1,
          networkRequests: 0,
          aiCalls: 0,
          databaseWrites: 0,
          reviewed: 0,
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
      ).toMatchObject({ counts: { selected: 1 }, publicationBlocked: true })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("runs the authoritative directory CLI dry before writing private results", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-search-adapter-"))
    try {
      const plan = buildIrsEoSearchPlan(workPackage())
      const planPath = join(directory, "search-plan.json")
      const inputPath = join(directory, "directory.jsonl")
      const outputPath = join(directory, "results.jsonl")
      writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`)
      writeFileSync(
        inputPath,
        `${JSON.stringify({
          ein: "123456789",
          organizationName: "Provider",
          state: "IL",
          websiteUrl: "https://provider.example.org/",
          sourceUrl: "https://directory.example.gov/provider",
          sourceKind: "government_directory",
        })}\n`
      )
      const args = [
        ADAPTER_SCRIPT,
        "--plan",
        planPath,
        "--adapter",
        "authoritative_directory_index",
        "--input",
        inputPath,
        "--output",
        outputPath,
      ]
      const dryRun = JSON.parse(
        execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" })
      )
      expect(dryRun).toMatchObject({
        dryRun: true,
        counts: {
          completed: 1,
          networkRequests: 0,
          paidQueries: 0,
          databaseWrites: 0,
          published: 0,
        },
        publicationBlocked: true,
      })
      expect(existsSync(outputPath)).toBe(false)
      execFileSync(process.execPath, [...args, "--write"], {
        cwd: ROOT,
        encoding: "utf8",
      })
      expect(readFileSync(outputPath, "utf8")).toContain(
        '"adapterId":"authoritative_directory_index"'
      )
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
