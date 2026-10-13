import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

// Exercise the actual CLI runtime and SQLite behavior, including process boundaries.
describe("nonprofit enrichment continuity", () => {
  it("preserves leases, evidence, replay and source boundaries", () => {
    let output: string
    try {
      output = execFileSync(
        process.execPath,
        [
          "--test",
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/corpus-import.test.mjs"
          ),
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/corpus-inventory.test.mjs"
          ),
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/publisher.test.mjs"
          ),
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/publication-audit.test.mjs"
          ),
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/verification.test.mjs"
          ),
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/ledger.test.mjs"
          ),
          join(
            process.cwd(),
            "src/features/nonprofit-enrichment/tests/adapters.test.mjs"
          ),
        ],
        { encoding: "utf8", timeout: 60000 }
      )
    } catch (error) {
      const failure = error as Error & { stdout?: string; stderr?: string }
      throw new Error(
        `${failure.message}\n${failure.stdout ?? ""}\n${failure.stderr ?? ""}`
      )
    }
    expect(output).toContain("# fail 0")
    execFileSync(
      "python3",
      ["src/features/nonprofit-enrichment/tests/irs-archive.test.py"],
      { encoding: "utf8", timeout: 10000 }
    )
  }, 65000)
})
