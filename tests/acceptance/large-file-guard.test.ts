import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("large-file guard", () => {
  it("runs as part of the pre-push and quality gates", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))

    expect(packageJson.scripts["check:large-files"]).toBe("node scripts/check-large-files.mjs")
    expect(packageJson.scripts["check:prepush"]).toContain("pnpm check:large-files")
    expect(packageJson.scripts["check:quality"]).toContain("pnpm check:large-files")
  })

  it("budgets public SVGs and duplicate public assets", () => {
    const scriptSource = readFileSync("scripts/check-large-files.mjs", "utf8")

    expect(scriptSource).toContain("public SVG asset")
    expect(scriptSource).toContain("64 * KB")
    expect(scriptSource).toContain("duplicate public assets")
    expect(scriptSource).toContain('execFileSync("git", ["ls-files", "-z"]')
  })
})
