import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { expect, it } from "vitest"

it("accepts the documented client entrypoint while rejecting cross-feature internals", () => {
  const root = mkdtempSync(join(tmpdir(), "coach-house-feature-entry-"))
  const script = join(process.cwd(), "scripts/check-feature-contract.mjs")
  try {
    for (const feature of ["alpha", "beta"]) {
      for (const file of [
        "README.md",
        "index.ts",
        "types.ts",
        "client.ts",
        "components/index.ts",
        "lib/index.ts",
        "server/actions.ts",
      ]) {
        const path = join(root, "src/features", feature, file)
        mkdirSync(join(path, ".."), { recursive: true })
        writeFileSync(path, "")
      }
      mkdirSync(join(root, "tests/acceptance"), { recursive: true })
      writeFileSync(join(root, "tests/acceptance", feature + ".test.ts"), "")
    }
    const consumer = join(root, "src/features/alpha/components/consumer.tsx")
    const run = () =>
      spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" })
    writeFileSync(consumer, 'import { Widget } from "@/features/beta/client"')
    expect(run().status).toBe(0)
    writeFileSync(
      consumer,
      'import { Widget } from "@/features/beta/components/widget"'
    )
    const rejected = run()
    expect(rejected.status).not.toBe(0)
    expect(rejected.stderr + rejected.stdout).toContain(
      "cross-feature imports must use public entrypoint"
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
