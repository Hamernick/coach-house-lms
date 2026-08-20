import { readFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  collectAcceptanceInventory,
  QUALITY_GATE_PROFILES,
  runQualityGate,
} from "../../scripts/run-quality-gate.mjs"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  )
})

describe("quality gate runner", () => {
  it("keeps every hosted lane inside the canonical full profile", () => {
    const hostedStages = [
      ...QUALITY_GATE_PROFILES.static,
      ...QUALITY_GATE_PROFILES.acceptance,
      ...QUALITY_GATE_PROFILES.rls,
      ...QUALITY_GATE_PROFILES.build,
      ...QUALITY_GATE_PROFILES.visual,
    ]

    expect(new Set(hostedStages)).toEqual(new Set(QUALITY_GATE_PROFILES.full))
    expect(new Set(QUALITY_GATE_PROFILES.full).size).toBe(
      QUALITY_GATE_PROFILES.full.length
    )
    expect(QUALITY_GATE_PROFILES.full.at(-1)).toBe("check:perf")
  })

  it("keeps package scripts and hosted aggregation on the shared profiles", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8")

    expect(packageJson.scripts["check:quality"]).toBe(
      "node scripts/run-quality-gate.mjs full"
    )
    for (const profile of ["static", "acceptance", "rls", "build", "visual"]) {
      expect(packageJson.scripts[`check:quality:${profile}`]).toBe(
        `node scripts/run-quality-gate.mjs ${profile}`
      )
      expect(workflow).toContain(`pnpm check:quality:${profile}`)
      expect(workflow).toContain(`      - ${profile}`)
    }

    expect(workflow.match(/Install Playwright Chromium/g)).toHaveLength(1)
    expect(workflow).toContain("name: Require every quality lane")
  })

  it("stops on the first failure and writes a bounded timing artifact", async () => {
    const artifactDirectory = await mkdtemp(
      path.join(tmpdir(), "coach-house-quality-gate-")
    )
    temporaryDirectories.push(artifactDirectory)
    const attempted: string[] = []

    const summary = await runQualityGate({
      artifactDirectory,
      executeStage: async (script) => {
        attempted.push(script)
        return script === "check:large-files" ? 9 : 0
      },
      profileName: "static",
    })

    expect(attempted).toEqual(["check:npm-supply-chain", "check:large-files"])
    expect(summary).toMatchObject({
      acceptanceInventory: null,
      failedStage: "check:large-files",
      profile: "static",
      schemaVersion: 1,
      status: "failed",
    })
    expect(summary.stages).toHaveLength(2)

    const artifact = JSON.parse(
      await readFile(path.join(artifactDirectory, "static.json"), "utf8")
    )
    expect(artifact).toEqual(summary)
    expect(JSON.stringify(artifact)).not.toContain("process.env")
  })

  it("reports suite composition without reading environment values", async () => {
    const inventory = await collectAcceptanceInventory()

    expect(inventory.fileCount).toBeGreaterThan(400)
    expect(inventory.testDeclarationCount).toBeGreaterThan(2_000)
    expect(inventory.sourceReadingFileCount).toBeGreaterThan(150)
    expect(inventory.childProcessCallCount).toBeGreaterThan(30)
  })
})
