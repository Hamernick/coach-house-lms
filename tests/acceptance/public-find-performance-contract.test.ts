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
    const source = readSource(
      "src/components/public/home-canvas-find-shell.tsx"
    )

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

  it("keeps the shell interactive before intentional Mapbox startup", () => {
    const source = readSource(
      "src/components/public/public-map-index/public-map-index-runtime.ts"
    )
    const surfaceSource = readSource(
      "src/components/public/public-map-index/map-surface.tsx"
    )

    expect(source).toContain("initializeFrameId = window.requestAnimationFrame")
    expect(source).toContain("PUBLIC_MAP_INTERACTION_READY_DELAY_MS = 8_000")
    expect(source).toContain("initializeTimeoutId = window.setTimeout")
    expect(source).toContain(
      'mapContainer.addEventListener("pointerdown", startMap'
    )
    expect(source).toContain(
      'PUBLIC_MAP_COARSE_POINTER_MEDIA_QUERY = "(pointer: coarse)"'
    )
    expect(source).toContain("if (!hasCoarsePointer)")
    expect(source).toContain(
      'mapContainer.addEventListener("keydown", startMapFromKeyboard)'
    )
    expect(source).toContain("if (cancelled || initializationStarted) return")
    expect(source).toContain(
      'mapContainer.removeEventListener("pointerdown", startMap)'
    )
    expect(source).toContain(
      'mapContainer.removeEventListener("keydown", startMapFromKeyboard)'
    )
    expect(source).toContain("window.cancelAnimationFrame(initializeFrameId)")
    expect(source).toContain("window.clearTimeout(initializeTimeoutId)")
    expect(surfaceSource).toContain('role="region"')
    expect(surfaceSource).toContain("tabIndex={0}")
  })

  it("renders the intended location consent state in the initial shell", () => {
    const source = readSource(
      "src/components/public/public-map-index/use-public-map-user-location.ts"
    )

    expect(source).toContain(
      "const [controlOpen, setControlOpen] = useState(false)"
    )
    expect(source).toContain(
      "const storedGrant = hasGrantedPublicMapLocation(window.sessionStorage)"
    )
    expect(source).toContain("setControlOpen(!storedGrant)")
  })

  it("enforces a dedicated first-load JavaScript budget for Find", () => {
    const source = readSource("scripts/performance-route-budgets.mjs")

    expect(source).toContain('routeKey: "/(public)/find/page"')
    expect(source).toContain('urlLabel: "/find"')
    expect(source).toContain('shell: "public find"')
  })
})
