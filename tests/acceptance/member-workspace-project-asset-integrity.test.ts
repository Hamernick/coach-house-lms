import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("member workspace project asset integrity", () => {
  it("prevalidates every file before creating any asset", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/account/project-assets/route.ts"),
      "utf8"
    )
    const postSource = source
      .split("export async function POST")[1]
      .split("export async function PATCH")[0]

    expect(postSource.indexOf("for (const file of files)")).toBeLessThan(
      postSource.indexOf("if (link) {")
    )
    expect(postSource.indexOf("getProjectAssetFileError(file)")).toBeLessThan(
      postSource.indexOf("if (link) {")
    )
  })

  it("removes prior rows and storage objects when a later write fails", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/account/project-assets/route.ts"),
      "utf8"
    )
    const supportSource = readFileSync(
      join(
        process.cwd(),
        "src/app/api/account/project-assets/route-support.ts"
      ),
      "utf8"
    )

    expect(source).toContain("cleanupProjectAssetCreation")
    expect(source).toContain("storagePaths: uploadedPaths")
    expect(source).toContain(
      "assetIds: insertedAssets.map((asset) => asset.id)"
    )
    expect(supportSource).toContain('.from("organization_project_assets")')
    expect(supportSource).toMatch(/\.delete\(\)\s*\.in\("id", assetIds\)/)
    expect(supportSource).toContain(".remove(storagePaths)")
    expect(source.match(/await cleanupProjectAssetCreation\(/g)).toHaveLength(3)
  })
})
