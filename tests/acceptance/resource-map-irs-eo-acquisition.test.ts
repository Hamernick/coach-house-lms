import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const IMPORTER = join(ROOT, "scripts/resource-map/import-irs-eo-candidates.mjs")
const RUNNER = join(ROOT, "scripts/resource-map/run-irs-eo-enrichment.mjs")
const ACQUISITION = join(
  ROOT,
  "scripts/resource-map/lib/irs-eo-acquisition.mjs"
)
const HEADER =
  "EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME"

function row({
  ein,
  name,
  street,
  city,
  state,
  ntee,
}: {
  ein: string
  name: string
  street: string
  city: string
  state: string
  ntee: string
}) {
  return [
    ein,
    name,
    "",
    street,
    city,
    state,
    "60601",
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

function withTempDirectory(callback: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "resource-map-irs-eo-"))
  try {
    callback(directory)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe("IRS EO resource discovery", () => {
  it("keeps IRS addresses and category hints out of publishable service fields", async () => {
    const { buildIrsEoDiscoveryCandidate } = await import(
      pathToFileURL(ACQUISITION).href
    )
    const candidate = buildIrsEoDiscoveryCandidate(
      {
        EIN: "12-3456789",
        NAME: "Neighborhood Pantry",
        STREET: "PO Box 8",
        CITY: "Chicago",
        STATE: "IL",
        ZIP: "60601",
        NTEE_CD: "K30",
      },
      { sourceFile: "eo.csv" }
    )

    expect(candidate).toMatchObject({
      ein: "123456789",
      categoryHints: ["food_food_pantries", "food"],
      directServiceScore: 85,
      publicDisplayEligible: false,
      serviceLocation: null,
      websiteUrl: null,
      filingAddress: {
        kind: "irs_filing_address",
        isPoBox: true,
        serviceLocationVerified: false,
      },
    })
  })

  it("distinguishes personal social services from transportation assistance", async () => {
    const { buildIrsEoDiscoveryCandidate } = await import(
      pathToFileURL(ACQUISITION).href
    )

    const personalServices = buildIrsEoDiscoveryCandidate(
      {
        EIN: "12-3456789",
        NAME: "Personal Services Provider",
        NTEE_CD: "P50",
      },
      { sourceFile: "eo.csv" }
    )
    const transportation = buildIrsEoDiscoveryCandidate(
      {
        EIN: "98-7654321",
        NAME: "Transportation Provider",
        NTEE_CD: "P52",
      },
      { sourceFile: "eo.csv" }
    )

    expect(personalServices.categoryHints).toEqual(["family"])
    expect(transportation.categoryHints).toEqual([
      "community_transportation",
      "family",
    ])
  })

  it("elevates finance, benefits, and digital-access discovery hints", async () => {
    const { applyIrsEoQueueNameHints, buildIrsEoDiscoveryCandidate } =
      await import(pathToFileURL(ACQUISITION).href)
    const build = (NAME: string, NTEE_CD: string) =>
      buildIrsEoDiscoveryCandidate(
        { EIN: "12-3456789", NAME, NTEE_CD },
        { sourceFile: "eo.csv" }
      )

    expect(build("Community Financial Counseling", "P51")).toMatchObject({
      categoryHints: ["finance_financial_coaching", "finance", "family"],
      directServiceScore: 90,
    })
    expect(build("Neighborhood Emergency Assistance", "P60")).toMatchObject({
      categoryHints: ["finance_emergency_assistance", "emergency", "family"],
      directServiceScore: 90,
    })
    expect(
      applyIrsEoQueueNameHints(build("Regional Digital Equity Center", "U99"))
    ).toMatchObject({
      categoryHints: [
        "community_internet_access",
        "community_device_access",
        "education_digital_literacy",
        "education",
      ],
      directServiceScore: 90,
    })
    expect(
      applyIrsEoQueueNameHints(build("Public Benefits Access Network", "P20"))
    ).toMatchObject({
      categoryHints: ["finance_benefits_enrollment", "finance", "family"],
      directServiceScore: 90,
    })
    expect(
      applyIrsEoQueueNameHints(build("Technology Foundation", "U99"))
        .categoryHints
    ).toEqual(["education"])
    expect(
      applyIrsEoQueueNameHints(
        build("Pickleball Association Public Benefits Corporation", "N60")
      ).categoryHints
    ).toEqual(["community"])
  })

  it("streams, deduplicates, and shortlists IRS files without publishing", () => {
    withTempDirectory((directory) => {
      const first = join(directory, "eo1.csv")
      const second = join(directory, "eo2.csv")
      const output = join(directory, "candidates.jsonl")
      writeFileSync(
        first,
        [
          HEADER,
          row({
            ein: "123456789",
            name: "Neighborhood Pantry",
            street: "1 Main St",
            city: "Chicago",
            state: "IL",
            ntee: "K30",
          }),
          row({
            ein: "987654321",
            name: "Private Foundation",
            street: "2 Main St",
            city: "Chicago",
            state: "IL",
            ntee: "T20",
          }),
        ].join("\n") + "\n"
      )
      writeFileSync(
        second,
        [
          HEADER,
          row({
            ein: "123456789",
            name: "Neighborhood Pantry Duplicate",
            street: "1 Main St",
            city: "Chicago",
            state: "IL",
            ntee: "K30",
          }),
          row({
            ein: "111222333",
            name: "Community Clinic",
            street: "3 Main St",
            city: "New York",
            state: "NY",
            ntee: "E32",
          }),
        ].join("\n") + "\n"
      )

      const stdout = execFileSync(
        process.execPath,
        [
          IMPORTER,
          "--input",
          `${first},${second}`,
          "--output",
          output,
          "--write",
        ],
        { cwd: ROOT, encoding: "utf8" }
      )
      const report = JSON.parse(stdout) as {
        counts: Record<string, number>
        publicationAttempted: boolean
      }

      expect(report.counts).toMatchObject({
        scanned: 4,
        unique: 3,
        duplicateEin: 1,
        shortlisted: 2,
      })
      expect(report.publicationAttempted).toBe(false)
      expect(readJsonl(output)).toHaveLength(2)
      expect(
        readJsonl(output).every((item) => !item.publicDisplayEligible)
      ).toBe(true)
    })
  })

  it("builds a deterministic balanced research queue and resumable checkpoint", () => {
    withTempDirectory((directory) => {
      const input = join(directory, "candidates.jsonl")
      const queue = join(directory, "queue.jsonl")
      const checkpoint = join(directory, "checkpoint.json")
      const report = join(directory, "report.json")
      const candidates = [
        ["123456789", "Neighborhood Pantry", "food", "IL"],
        ["111222333", "Community Clinic", "health", "NY"],
        ["222333444", "Housing Center", "housing", "CA"],
      ].map(([ein, organizationName, category, state]) => ({
        ein,
        organizationName,
        categoryHints: [category],
        directServiceScore: 90,
        filingAddress: { city: "City", state },
      }))
      writeFileSync(
        input,
        candidates.map((candidate) => JSON.stringify(candidate)).join("\n") +
          "\n"
      )

      const stdout = execFileSync(
        process.execPath,
        [
          RUNNER,
          "--input",
          input,
          "--queue",
          queue,
          "--checkpoint",
          checkpoint,
          "--report",
          report,
          "--batch",
          "3",
          "--write",
        ],
        { cwd: ROOT, encoding: "utf8" }
      )
      const result = JSON.parse(stdout) as { counts: Record<string, number> }
      const workItems = readJsonl(queue)

      expect(result.counts).toMatchObject({
        eligible: 3,
        queued: 3,
        aiCalls: 0,
        networkRequests: 0,
        published: 0,
      })
      expect(workItems.map((item) => item.acquisitionStatus)).toEqual([
        "pending_website_match",
        "pending_website_match",
        "pending_website_match",
      ])
      expect(workItems.every((item) => item.publicationBlocked)).toBe(true)
      expect(readFileSync(checkpoint, "utf8")).toContain(
        '"status": "research_queue_ready"'
      )

      const incomingResults = join(directory, "incoming-results.jsonl")
      const resultLedger = join(directory, "result-ledger.jsonl")
      writeFileSync(
        incomingResults,
        `${JSON.stringify({
          ein: workItems[0].ein,
          acquisitionStatus: "website_matched",
          websiteUrl: "https://provider.example.org",
          evidenceUrls: [],
          socialAccounts: [
            { platform: "x", url: "https://twitter.com/" },
            {
              platform: "instagram",
              url: "https://www.instagram.com/provider/",
            },
          ],
        })}\n`
      )
      const resumedStdout = execFileSync(
        process.execPath,
        [
          RUNNER,
          "--input",
          input,
          "--queue",
          queue,
          "--checkpoint",
          checkpoint,
          "--report",
          report,
          "--result-ledger",
          resultLedger,
          "--results",
          incomingResults,
          "--batch",
          "3",
          "--resume",
          "--write",
        ],
        { cwd: ROOT, encoding: "utf8" }
      )
      const resumed = JSON.parse(resumedStdout) as {
        counts: Record<string, number>
      }

      expect(resumed.counts).toMatchObject({
        completed: 1,
        resultsApplied: 1,
        queued: 2,
      })
      expect(readJsonl(resultLedger)).toMatchObject([
        {
          acquisitionStatus: "website_matched",
          publicDisplayEligible: false,
          publicationBlocked: true,
          socialAccounts: [
            {
              platform: "instagram",
              url: "https://www.instagram.com/provider/",
            },
          ],
        },
      ])
    })
  })
})
