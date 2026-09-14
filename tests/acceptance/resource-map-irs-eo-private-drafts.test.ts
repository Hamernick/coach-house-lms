import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { buildIrsEoPrivateDraft } from "../../scripts/resource-map/lib/irs-eo-private-drafts.mjs"

const ROOT = process.cwd()
const SCRIPT = join(
  ROOT,
  "scripts/resource-map/build-irs-eo-private-drafts.mjs"
)

function candidate() {
  return {
    ein: "123456789",
    organizationName: "Provider Network",
    categoryHints: ["food"],
    filingAddress: {
      street: "99 Filing Lane",
      city: "Raleigh",
      state: "NC",
      postalCode: "27601",
    },
  }
}

function researchResult() {
  return {
    ein: "123456789",
    acquisitionStatus: "evidence_fetched",
    websiteUrl: "https://provider.example.org/",
    evidenceUrls: ["https://provider.example.org/services"],
    providerIdentitySupported: true,
    serviceEvidence: [
      {
        field: "service",
        snippet: "We provide a weekly food pantry.",
        sourceUrl: "https://provider.example.org/services",
        sourceContentHash: "source-hash",
        fetchedAt: "2026-09-01T12:00:00.000Z",
        extractionMethod: "deterministic_pattern",
      },
      {
        field: "hours",
        snippet: "Open Tuesdays from 3 PM to 6 PM.",
        sourceUrl: "https://provider.example.org/services",
        sourceContentHash: "source-hash",
        fetchedAt: "2026-09-01T12:00:00.000Z",
        extractionMethod: "deterministic_pattern",
      },
    ],
    providerLinkedContacts: [
      {
        type: "phone",
        value: "+1 919-555-0100",
        sourceUrl: "https://provider.example.org/",
      },
      {
        type: "phone",
        value: "919-555-0100",
        sourceUrl: "https://provider.example.org/services",
      },
    ],
    socialAccounts: [
      {
        platform: "instagram",
        url: "https://instagram.com/provider/",
        sourceUrl: "https://provider.example.org/",
        providerLinked: true,
      },
    ],
    mediaEvidence: [
      {
        kind: "open_graph_image",
        url: "https://provider.example.org/share.jpg",
        sourceUrl: "https://provider.example.org/",
      },
    ],
    services: [],
    serviceAreas: [],
    publicDisplayEligible: false,
    publicationBlocked: true,
  }
}

function writeJsonl(filePath: string, rows: unknown[]) {
  writeFileSync(
    filePath,
    `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`
  )
}

describe("IRS EO private draft fields", () => {
  it("retains only source-linked private candidates and excludes filing locations", () => {
    const draft = buildIrsEoPrivateDraft({
      candidate: candidate(),
      researchResult: researchResult(),
    })

    expect(draft).toMatchObject({
      organizationName: "Provider Network",
      readyForReview: false,
      publicDisplayEligible: false,
      publicationBlocked: true,
      requiresIndependentVerification: true,
      exclusions: { irsFilingAddressUsedAsServiceLocation: false },
      coverage: {
        services: 1,
        hours: 1,
        contacts: 1,
        socialAccounts: 1,
        mediaCandidates: 1,
        serviceLocations: 0,
        coordinates: 0,
      },
    })
    expect(draft?.candidateFields.services[0]).toMatchObject({
      snippet: "We provide a weekly food pantry.",
      candidateOnly: true,
      publishable: false,
    })
    expect(JSON.stringify(draft)).not.toContain("99 Filing Lane")
    expect(draft?.privateMediaCandidates[0]).toMatchObject({
      rightsStatus: "unreviewed",
      publishable: false,
    })
  })

  it("rejects held or identity-unsupported rows", () => {
    expect(
      buildIrsEoPrivateDraft({
        candidate: candidate(),
        researchResult: {
          ...researchResult(),
          acquisitionStatus: "held",
        },
      })
    ).toBeNull()
    expect(
      buildIrsEoPrivateDraft({
        candidate: candidate(),
        researchResult: {
          ...researchResult(),
          providerIdentitySupported: false,
        },
      })
    ).toBeNull()
  })

  it("runs dry by default and writes only with explicit opt-in", () => {
    const directory = mkdtempSync(join(tmpdir(), "eo-private-drafts-"))
    try {
      const candidates = join(directory, "candidates.jsonl")
      const results = join(directory, "results.jsonl")
      const output = join(directory, "drafts.jsonl")
      const report = join(directory, "report.json")
      writeJsonl(candidates, [candidate()])
      writeJsonl(results, [researchResult()])

      const dryRun = JSON.parse(
        execFileSync(
          process.execPath,
          [
            SCRIPT,
            "--candidates",
            candidates,
            "--results",
            results,
            "--output",
            output,
            "--report",
            report,
          ],
          { cwd: ROOT, encoding: "utf8" }
        )
      )
      expect(dryRun).toMatchObject({
        dryRun: true,
        publicationBlocked: true,
        counts: {
          draftsBuilt: 1,
          serviceLocations: 0,
          coordinates: 0,
          aiCalls: 0,
          networkRequests: 0,
          reviewed: 0,
          published: 0,
        },
      })
      expect(() => readFileSync(output, "utf8")).toThrow()

      execFileSync(
        process.execPath,
        [
          SCRIPT,
          "--candidates",
          candidates,
          "--results",
          results,
          "--output",
          output,
          "--report",
          report,
          "--write",
        ],
        { cwd: ROOT, encoding: "utf8" }
      )
      const stored = JSON.parse(readFileSync(output, "utf8").trim())
      expect(stored.publicDisplayEligible).toBe(false)
      expect(stored.readyForReview).toBe(false)
      expect(stored.serviceLocationCandidates).toEqual([])
      expect(stored.coordinatesCandidates).toEqual([])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
