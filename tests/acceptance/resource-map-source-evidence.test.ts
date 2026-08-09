import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const EVIDENCE_LIBRARY = join(
  ROOT,
  "scripts/resource-map/lib/source-evidence.mjs"
)
const COLLECT_SCRIPT = join(
  ROOT,
  "scripts/resource-map/collect-source-evidence.mjs"
)

describe("resource map source evidence", () => {
  it("extracts stable page evidence and compares source fields", async () => {
    const { compareRecordToSourceEvidence, extractSourcePageEvidence } =
      await import(pathToFileURL(EVIDENCE_LIBRARY).href)
    const evidence = extractSourcePageEvidence({
      body: `<!doctype html><html><head><title>Humboldt Park | Chicago Public Library</title><meta name="description" content="Books, learning, and public services at Humboldt Park."></head><body><nav>Unrelated navigation</nav><main><h1>Humboldt Park</h1><h2>Services</h2><p>1605 N. Troy Street, Chicago, IL 60647</p><p>(773) 235-3870</p><p>humboldtpark@chipublib.org</p><p>Computers, Wi-Fi, meeting rooms, homework help, and social services.</p></main><script>ignore()</script></body></html>`,
      contentType: "text/html; charset=utf-8",
      url: "https://www.chipublib.org/locations/36/",
    })
    const comparisons = compareRecordToSourceEvidence(
      {
        extractedFields: {
          title: "Humboldt Park",
          address: "1605 N. Troy Street, Chicago, IL 60647",
          phone: "(773) 235-3870",
          email: "humboldtpark@chipublib.org",
        },
      },
      evidence
    )

    expect(evidence).toMatchObject({
      evidenceUrl: "https://www.chipublib.org/locations/36/",
      headings: ["Humboldt Park", "Services"],
      metaDescription: "Books, learning, and public services at Humboldt Park.",
      pageTitle: "Humboldt Park | Chicago Public Library",
      truncated: false,
    })
    expect(evidence.contentSha256).toMatch(/^[a-f0-9]{64}$/u)
    expect(evidence.textExcerpt).not.toContain("Unrelated navigation")
    expect(evidence.textExcerpt).not.toContain("ignore()")
    expect(comparisons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldPath: "title", status: "matched" }),
        expect.objectContaining({ fieldPath: "address", status: "matched" }),
        expect.objectContaining({ fieldPath: "phone", status: "matched" }),
        expect.objectContaining({ fieldPath: "email", status: "matched" }),
      ])
    )
  })

  it("treats common address abbreviations as the same provider address", async () => {
    const { compareRecordToSourceEvidence } = await import(
      pathToFileURL(EVIDENCE_LIBRARY).href
    )
    const comparisons = compareRecordToSourceEvidence(
      { extractedFields: { address: "6100 W. Irving Park Rd." } },
      {
        evidenceUrl: "https://www.chipublib.org/locations/7/",
        headings: [],
        textExcerpt: "6100 W. Irving Park Road Chicago, IL 60634",
      }
    )

    expect(comparisons).toEqual([
      expect.objectContaining({ fieldPath: "address", status: "matched" }),
    ])
  })

  it("prefers provider pages over technical dataset endpoints", async () => {
    const { selectProviderEvidenceUrl } = await import(
      pathToFileURL(EVIDENCE_LIBRARY).href
    )
    expect(
      selectProviderEvidenceUrl({
        sourceUrl: "https://data.cityofchicago.org/resource/x8fc-8rcq.json",
        extractedFields: {
          websiteUrl: "https://www.chipublib.org/locations/36/",
        },
      })
    ).toBe("https://www.chipublib.org/locations/36/")
  })

  it("rejects local source URLs before making a request", async () => {
    const { collectSourceEvidence } = await import(
      pathToFileURL(EVIDENCE_LIBRARY).href
    )
    let requested = false
    const result = await collectSourceEvidence(
      {
        sourceRecordId: "unsafe-source",
        extractedFields: { websiteUrl: "http://localhost/private" },
      },
      {
        fetchImpl: async () => {
          requested = true
          return new Response("unexpected")
        },
        now: () => "2026-07-14T18:00:00.000Z",
      }
    )

    expect(requested).toBe(false)
    expect(result).toMatchObject({
      error: "source_url_not_public",
      fetchedAt: "2026-07-14T18:00:00.000Z",
      recordId: "unsafe-source",
      status: "failed",
    })
  })

  it("plans evidence collection without network access by default", () => {
    const directory = mkdtempSync(join(tmpdir(), "resource-evidence-"))
    const input = join(directory, "records.jsonl")
    writeFileSync(
      input,
      `${JSON.stringify({
        sourceRecordId: "library",
        sourceName: "Chicago Libraries",
        extractedFields: {
          websiteUrl: "https://www.chipublib.org/locations/36/",
        },
      })}\n`
    )

    try {
      const output = execFileSync(
        process.execPath,
        [COLLECT_SCRIPT, "--input", input],
        { cwd: ROOT, encoding: "utf8" }
      )
      expect(output).toContain(
        "Dry run: 1/1 records have provider evidence URLs across 1 unique pages."
      )
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
