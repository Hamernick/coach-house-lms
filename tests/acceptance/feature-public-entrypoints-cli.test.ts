import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { expect, test } from "vitest"

test("cross-feature imports accept public client entrypoints and reject nested internals", () => {
  const root = mkdtempSync(path.join(tmpdir(), "feature-entrypoints-"))
  const script = path.resolve("scripts/check-feature-contract.mjs")
  try {
    const feature = path.join(root, "src/features/example")
    for (const directory of ["components", "lib", "server"])
      mkdirSync(path.join(feature, directory), { recursive: true })
    mkdirSync(path.join(root, "tests/acceptance"), { recursive: true })
    for (const file of [
      "README.md",
      "index.ts",
      "types.ts",
      "components/index.ts",
      "lib/index.ts",
      "server/actions.ts",
    ])
      writeFileSync(path.join(feature, file), "")
    writeFileSync(path.join(root, "tests/acceptance/example.test.ts"), "")
    const source = path.join(feature, "components/index.ts")
    for (const entrypoint of ["other", "other/index", "other/client"]) {
      writeFileSync(
        source,
        `export { Example } from "@/features/${entrypoint}"`
      )
      expect(
        execFileSync(process.execPath, [script], {
          cwd: root,
          encoding: "utf8",
        })
      ).toContain("Feature contract check passed")
    }
    for (const internal of [
      "other/client/private",
      "other/components/private",
      "other/server/actions",
    ]) {
      writeFileSync(source, `export { Example } from "@/features/${internal}"`)
      expect(() =>
        execFileSync(process.execPath, [script], { cwd: root, stdio: "pipe" })
      ).toThrow()
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 30_000)
