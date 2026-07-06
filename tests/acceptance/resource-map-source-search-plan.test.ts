import { execFileSync } from "node:child_process"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SCRIPT = join(ROOT, "scripts/resource-map/build-source-search-plan.mjs")

describe("resource map source search plan", () => {
  it("generates auditable non-network search tasks for locations and categories", () => {
    const output = execFileSync(
      process.execPath,
      [
        SCRIPT,
        "--location",
        "Chicago, IL",
        "--categories",
        "food,health",
        "--pretty",
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const plan = JSON.parse(output) as {
      safetyBoundary: string
      tasks: Array<{
        category: string
        location: string
        query: string
        requiredChecks: string[]
        vettedSourceCandidateShape: {
          categories: string[]
          coverageAreas: string[]
          manualConfirmationRequired: boolean
          publicDisplayAllowed: boolean
          scrapeStrategy: { importTarget: string; mode: string }
        }
      }>
    }

    expect(plan.safetyBoundary).toContain("does not scrape or import data")
    expect(plan.tasks).toHaveLength(8)
    expect(plan.tasks.map((task) => task.category)).toEqual(
      expect.arrayContaining(["food", "health"])
    )
    expect(plan.tasks[0]).toMatchObject({
      location: "Chicago, IL",
      category: "food",
    })
    expect(plan.tasks[0]?.query).toContain('"Chicago, IL"')
    expect(plan.tasks[0]?.requiredChecks).toEqual(
      expect.arrayContaining([
        "Confirm terms/license allow storage, transformation, and public display.",
        "Do not import private contact/link data as public.",
      ])
    )
    expect(plan.tasks[0]?.vettedSourceCandidateShape).toMatchObject({
      categories: ["food"],
      coverageAreas: ["Chicago, IL"],
      manualConfirmationRequired: true,
      publicDisplayAllowed: false,
      scrapeStrategy: {
        mode: "manual-vetting-required",
        importTarget: "resource_map_import_records",
      },
    })
  })

  it("can emit JSONL tasks for agent or spreadsheet review queues", () => {
    const output = execFileSync(
      process.execPath,
      [
        SCRIPT,
        "--location",
        "Miami, FL",
        "--category",
        "housing",
        "--format",
        "jsonl",
      ],
      { cwd: ROOT, encoding: "utf8" }
    )
    const rows = output
      .trim()
      .split(/\r?\n/)
      .map(
        (line) => JSON.parse(line) as { category: string; searchIntent: string }
      )

    expect(rows).toHaveLength(4)
    expect(rows.every((row) => row.category === "housing")).toBe(true)
    expect(rows.map((row) => row.searchIntent)).toEqual(
      expect.arrayContaining([
        "official_open_data",
        "official_directory",
        "211_referral",
        "provider_service_page",
      ])
    )
  })

  it("rejects unknown resource categories before a search plan is trusted", () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [SCRIPT, "--location", "Austin, TX", "--category", "not_real"],
        { cwd: ROOT, encoding: "utf8", stdio: "pipe" }
      )
    ).toThrow(/Unknown resource categories: not_real/)
  })
})
