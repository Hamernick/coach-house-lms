import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

function readSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8")
}

describe("public Find performance contract", () => {
  it("uses 50-item compact pages without pre-rendering the pricing surface", () => {
    for (const route of [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]) {
      const source = readSource(route)

      expect(source).toContain("/api/public/resource-map/index?limit=50")
      expect(source).not.toContain("PricingSurface")
      expect(source).not.toContain("pricingPanel=")
    }
  })

  it("uses a dedicated shell that excludes hidden home and authentication panels", () => {
    const source = readSource("src/components/public/home-canvas-find-shell.tsx")

    expect(source).toContain("HomeCanvasPreviewHeader")
    expect(source).toContain("HomeCanvasPreviewSidebar")
    expect(source).not.toContain("CanvasAuthPanel")
    expect(source).not.toContain("HomeSectionPanel")
    expect(source).not.toContain("PricingSurface")
  })

  it("loads the account sheet only after the user opens it", () => {
    const source = readSource(
      "src/components/public/public-map-index/map-surface.tsx"
    )

    expect(source).toContain('dynamic(() =>\n  import("./auth-sheet")')
    expect(source).toContain("{authSheetOpen ? (")
    expect(source).not.toContain(
      'import { PublicMapAuthSheet } from "./auth-sheet"'
    )
  })

  it("enforces a dedicated first-load JavaScript budget for Find", () => {
    const source = readSource("scripts/performance-route-budgets.mjs")

    expect(source).toContain('routeKey: "/(public)/find/page"')
    expect(source).toContain('urlLabel: "/find"')
    expect(source).toContain('shell: "public find"')
  })
})
