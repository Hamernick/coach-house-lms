import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SOURCE_ROOT = join(ROOT, "src")
const ALLOWED_PRODUCTION_IMPORTERS = [
  "src/app/(admin)/admin/platform/prototypes/page.tsx",
]

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : []
  })
}

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("Prototype Lab production boundary", () => {
  it("keeps the feature bundle exclusive to the admin prototype route", () => {
    const importers = listSourceFiles(SOURCE_ROOT)
      .filter((path) => !path.includes("/src/features/prototype-lab/"))
      .filter((path) =>
        readFileSync(path, "utf8").includes("@/features/prototype-lab")
      )
      .map((path) => relative(ROOT, path))
      .sort()

    expect(importers).toEqual(ALLOWED_PRODUCTION_IMPORTERS)
  })

  it("authorizes the admin route before resolving or rendering prototype data", () => {
    const route = readSource(
      "src/app/(admin)/admin/platform/prototypes/page.tsx"
    )
    const navData = readSource("src/components/app-sidebar/nav-data.ts")

    expect(route.indexOf("await requireAdmin()")).toBeGreaterThan(-1)
    expect(route.indexOf("await requireAdmin()")).toBeLessThan(
      route.indexOf("buildPrototypeLabInput({")
    )
    expect(navData.indexOf("if (isAdmin) {")).toBeLessThan(
      navData.indexOf("tree: listPrototypeLabSidebarTree()")
    )
  })
})
