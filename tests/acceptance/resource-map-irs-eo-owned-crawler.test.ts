import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  buildOwnedCrawlerDryRun,
  runIrsEoOwnedCrawler,
  validateIrsEoOwnedFetchPlan,
} from "../../scripts/resource-map/lib/irs-eo-owned-crawler.mjs"
import {
  isPublicNetworkAddress,
  validatePublicCrawlerTarget,
} from "../../scripts/resource-map/lib/irs-eo-owned-crawler-network.mjs"
import {
  buildIrsEoSearchPlan,
  buildSharedProviderFetchPlan,
} from "../../scripts/resource-map/lib/irs-eo-search-discovery.mjs"
import { buildIrsEoWorkPackagePlan } from "../../scripts/resource-map/lib/irs-eo-work-packages.mjs"

const ROOT = process.cwd()
const SCRIPT = join(
  ROOT,
  "scripts/resource-map/run-irs-eo-owned-crawler.mjs"
)
const PUBLIC_ADDRESS = [{ address: "93.184.216.34", family: 4 }]

function parentPlan() {
  const workPackage = buildIrsEoWorkPackagePlan(
    [
      {
        ein: "123456789",
        organizationName: "Provider",
        filingAddress: { city: "Chicago", state: "IL" },
        benchmark: { stratum: "IL:K", projectionWeight: 1 },
      },
    ],
    { packageSize: 1 }
  ).packages[0]
  return buildIrsEoSearchPlan(workPackage)
}

function fetchPlan(
  url = "https://provider.example.org/",
  { maxNetworkRequests = 6, maxRetainedBytes = 100_000 } = {}
) {
  const searchPlan = parentPlan()
  return buildSharedProviderFetchPlan(
    [
      {
        ein: "123456789",
        searchCompleted: true,
        candidates: [{ url, rank: 1, title: "Provider" }],
      },
    ],
    {
      maxNetworkRequests,
      maxPerHost: 3,
      maxRetainedBytes,
      packageId: searchPlan.packageId,
      parentPlanHash: searchPlan.planHash,
    }
  )
}

function response(status: number, body: string, headers = {}) {
  return { status, headers, body: Buffer.from(body) }
}

const resolvePublic = async () => PUBLIC_ADDRESS

describe("IRS EO owned crawler", () => {
  it("rejects private and reserved destinations before transport", async () => {
    expect(isPublicNetworkAddress("10.0.0.1")).toBe(false)
    expect(isPublicNetworkAddress("::1")).toBe(false)
    expect(isPublicNetworkAddress("::ffff:7f00:1")).toBe(false)
    expect(isPublicNetworkAddress("93.184.216.34")).toBe(true)
    await expect(
      validatePublicCrawlerTarget("http://localhost/private")
    ).rejects.toThrow("unsafe_url")
    await expect(
      validatePublicCrawlerTarget("https://provider.example.org/", {
        resolveHostname: async () => [{ address: "169.254.169.254", family: 4 }],
      })
    ).rejects.toThrow("unsafe_dns_resolution")
  })

  it("fails closed on plan tampering and reports dry runs without work", () => {
    const plan = fetchPlan()
    expect(buildOwnedCrawlerDryRun(plan)).toMatchObject({
      dryRun: true,
      counts: { networkRequests: 0, databaseWrites: 0, published: 0 },
      publicationBlocked: true,
    })
    expect(() =>
      validateIrsEoOwnedFetchPlan({
        ...plan,
        executionPolicy: { ...plan.executionPolicy, maxRedirects: 99 },
      })
    ).toThrow("fetch_plan_hash_mismatch")
  })

  it("requires the matching signed parent search plan", async () => {
    const plan = fetchPlan()
    const wrongParent = { ...parentPlan(), packageId: "wrong-package" }
    await expect(
      runIrsEoOwnedCrawler(plan, { parentPlan: wrongParent })
    ).rejects.toThrow("Provider search plan hash mismatch")
  })

  it("obeys robots and retains normalized private evidence without raw HTML", async () => {
    const requested: string[] = []
    const transport = async ({ url }: { url: string }) => {
      requested.push(url)
      if (url.endsWith("/robots.txt")) {
        return response(200, "User-agent: *\nAllow: /", {
          "content-type": "text/plain",
        })
      }
      return response(
        200,
        '<html><head><title>Provider</title></head><body><h1>Food support</h1><a href="tel:312-555-0100">Call</a><a href="https://facebook.com/provider">Facebook</a></body></html>',
        { "content-type": "text/html; charset=utf-8" }
      )
    }
    const result = await runIrsEoOwnedCrawler(fetchPlan(), {
      parentPlan: parentPlan(),
      transport,
      resolveHostname: resolvePublic,
      sleep: async () => {},
      now: () => "2026-09-02T12:00:00.000Z",
    })

    expect(requested).toEqual([
      "https://provider.example.org/robots.txt",
      "https://provider.example.org/",
    ])
    expect(result.manifest.counts).toMatchObject({
      providerTerminal: 1,
      fetched: 1,
      networkRequests: 2,
      paidQueries: 0,
      aiCalls: 0,
      databaseWrites: 0,
      published: 0,
    })
    const provider = result.receipts.find(
      ({ receiptType }) => receiptType === "provider"
    )
    expect(provider).toMatchObject({
      status: "fetched",
      evidence: {
        pageTitle: "Provider",
        textExcerpt: "Provider Food support Call Facebook",
      },
      signals: {
        contacts: [expect.objectContaining({ type: "phone" })],
        socialAccounts: [expect.objectContaining({ platform: "facebook" })],
      },
      publicDisplayEligible: false,
      publicationBlocked: true,
    })
    expect(JSON.stringify(provider)).not.toContain("<html")
  })

  it("records robots denial and never requests the provider page", async () => {
    const requested: string[] = []
    const result = await runIrsEoOwnedCrawler(fetchPlan(), {
      parentPlan: parentPlan(),
      resolveHostname: resolvePublic,
      sleep: async () => {},
      transport: async ({ url }: { url: string }) => {
        requested.push(url)
        return response(200, "User-agent: *\nDisallow: /")
      },
    })
    expect(requested).toEqual(["https://provider.example.org/robots.txt"])
    expect(result.receipts.at(-1)).toMatchObject({
      receiptType: "provider",
      status: "robots_denied",
      networkEvents: [],
    })
  })

  it("revalidates redirects and blocks a private redirect destination", async () => {
    const requested: string[] = []
    const result = await runIrsEoOwnedCrawler(fetchPlan(), {
      parentPlan: parentPlan(),
      resolveHostname: async (hostname: string) =>
        hostname === "provider.example.org"
          ? PUBLIC_ADDRESS
          : [{ address: "127.0.0.1", family: 4 }],
      sleep: async () => {},
      transport: async ({ url }: { url: string }) => {
        requested.push(url)
        if (url.endsWith("robots.txt")) {
          return response(200, "User-agent: *\nAllow: /")
        }
        return response(302, "", { location: "http://internal.example/private" })
      },
    })
    expect(requested).toHaveLength(2)
    expect(result.receipts.at(-1)).toMatchObject({
      receiptType: "provider",
      status: "robots_denied",
    })
    expect(
      result.receipts.some(
        ({ receiptType, status }) =>
          receiptType === "robots" && status === "unsafe_dns_resolution"
      )
    ).toBe(true)
  })

  it("resumes from a validated receipt chain without repeating work", async () => {
    const plan = fetchPlan()
    const first = await runIrsEoOwnedCrawler(plan, {
      parentPlan: parentPlan(),
      resolveHostname: resolvePublic,
      sleep: async () => {},
      transport: async ({ url }: { url: string }) =>
        url.endsWith("robots.txt")
          ? response(404, "")
          : response(200, "Provider services", { "content-type": "text/plain" }),
    })
    let requested = false
    const resumed = await runIrsEoOwnedCrawler(plan, {
      parentPlan: parentPlan(),
      existingReceipts: first.receipts,
      transport: async () => {
        requested = true
        return response(500, "")
      },
      resolveHostname: resolvePublic,
    })
    expect(requested).toBe(false)
    expect(resumed.receipts).toEqual([])
    expect(resumed.manifest.counts).toMatchObject({
      providerTerminal: 1,
      networkRequests: 2,
    })

    const fromRobotsOnly = await runIrsEoOwnedCrawler(plan, {
      parentPlan: parentPlan(),
      existingReceipts: first.receipts.slice(0, 1),
      resolveHostname: resolvePublic,
      sleep: async () => {},
      transport: async () =>
        response(200, "Provider services", { "content-type": "text/plain" }),
    })
    expect(fromRobotsOnly.receipts[0]).toMatchObject({
      sequence: 2,
      previousReceiptHash: first.receipts[0].receiptHash,
      receiptType: "provider",
      status: "fetched",
    })
  })

  it("rejects oversized responses even when an injected transport misbehaves", async () => {
    const result = await runIrsEoOwnedCrawler(fetchPlan(), {
      parentPlan: parentPlan(),
      resolveHostname: resolvePublic,
      sleep: async () => {},
      transport: async ({ url }: { url: string }) =>
        url.endsWith("robots.txt")
          ? response(404, "")
          : response(200, "x".repeat(1_000_001), {
              "content-type": "text/plain",
            }),
    })
    expect(result.receipts.at(-1)).toMatchObject({
      receiptType: "provider",
      status: "response_too_large",
      retainedBytes: 0,
    })
  })

  it("stops redirects at the signed total request budget", async () => {
    const plan = fetchPlan("https://provider.example.org/", {
      maxNetworkRequests: 2,
    })
    const requested: string[] = []
    const result = await runIrsEoOwnedCrawler(plan, {
      parentPlan: parentPlan(),
      resolveHostname: resolvePublic,
      sleep: async () => {},
      transport: async ({ url }: { url: string }) => {
        requested.push(url)
        if (url.endsWith("robots.txt")) return response(404, "")
        return response(302, "", {
          location: "https://redirected.example.org/",
        })
      },
    })
    expect(requested).toHaveLength(2)
    expect(result.manifest.counts.networkRequests).toBe(2)
    expect(result.receipts.at(-1)).toMatchObject({
      receiptType: "provider",
      status: "robots_denied",
    })
    expect(
      result.receipts.some(
        ({ receiptType, status }) =>
          receiptType === "robots" && status === "network_budget_exhausted"
      )
    ).toBe(true)
  })

  it("keeps the CLI network-free and write-free by default", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-owned-crawler-"))
    const planPath = join(directory, "fetch-plan.json")
    const outputDirectory = join(directory, "output")
    writeFileSync(planPath, `${JSON.stringify(fetchPlan(), null, 2)}\n`)
    try {
      const report = JSON.parse(
        execFileSync(
          process.execPath,
          [SCRIPT, "--fetch-plan", planPath, "--output-directory", outputDirectory],
          { cwd: ROOT, encoding: "utf8" }
        )
      )
      expect(report).toMatchObject({
        dryRun: true,
        counts: { networkRequests: 0, databaseWrites: 0, published: 0 },
      })
      expect(existsSync(outputDirectory)).toBe(false)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
