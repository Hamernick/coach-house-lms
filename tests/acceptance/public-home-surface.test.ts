import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public home canvas", () => {
  it("keeps the established shell as the home route owner", () => {
    const routeSource = readSource("src/app/(public)/page.tsx")

    expect(routeSource).toContain("<HomeCanvasPreview")
    expect(routeSource).toContain("<PricingSurface embedded />")
    expect(routeSource).not.toContain("HomePageSurface")
  })

  it("leads with the real map and presents the complete product story inside canvas panels", () => {
    const source = readSource(
      "src/components/public/home-canvas-product-panels.tsx"
    )

    expect(source).toContain('data-public-home-hero=""')
    expect(source).toContain("<HomeFindMapMini")
    expect(source).not.toContain("next/image")
    expect(source).not.toContain(".webp")
    expect(source).toContain("Build, find, and fund nonprofit work.")
    expect(source).toContain("One workspace from board to team.")
    expect(source).toContain("Every document, next to the work it supports.")
    expect(source).toContain(
      "Qualified projects can apply for fiscal sponsorship"
    )
    expect(source).toContain(
      "Fiscal sponsorship is subject to eligibility review and approval."
    )
    expect(source).toContain("FiscalSponsorshipWorkspaceCardSurface")
    expect(source).toContain('import("@/features/fiscal-sponsorship")')
    expect(source).not.toContain(
      "FiscalSponsorshipWorkspaceCardSurface,\n  type FiscalSponsorshipProgramOption"
    )
    expect(source).not.toContain("HomeFundingPreview")
    expect(source).toContain("data-public-home-build-pricing")
    expect(source).toContain('action="/find"')
    expect(source).toContain('href="/?section=platform"')
  })

  it("keeps Find, Build, and Fund centered over the rounded canvas", () => {
    const source = readSource(
      "src/components/public/home-canvas-product-navigator.tsx"
    )
    const shellSource = readSource(
      "src/components/public/home-canvas-preview.tsx"
    )
    const sidebarSource = readSource(
      "src/components/public/home-canvas-preview-sidebar.tsx"
    )
    const headerSource = readSource(
      "src/components/public/home-canvas-preview-shell.tsx"
    )

    expect(source).toContain('href="/find"')
    expect(source).toContain(
      'aria-current={activeSection === "hero" ? "true" : undefined}'
    )
    expect(source).toContain('aria-pressed={activeSection === "platform"}')
    expect(source).toContain('aria-pressed={activeSection === "accelerator"}')
    expect(source).toContain('changeSection("platform")')
    expect(source).toContain('changeSection("accelerator")')
    expect(source).toContain("grid-cols-3 rounded-full")
    expect(source).toContain("backdrop-blur-xl")
    expect(source).toContain('data-public-home-product-navigator=""')
    expect(shellSource).toContain("<HomeCanvasPreviewSidebar")
    expect(shellSource).toContain("showFindSidebarShell ? (")
    expect(shellSource).toContain("<ShellRightRail")
    expect(shellSource).toContain("<HomeCanvasProductNavigator")
    expect(shellSource).toContain("rounded-[28px]")
    expect(shellSource).not.toContain("onWheel=")
    expect(shellSource).not.toContain("goToAdjacentSection")
    expect(shellSource).not.toContain("Scroll down")
    expect(sidebarSource).not.toContain("SIDEBAR_CANVAS_NAV")
    expect(sidebarSource).not.toContain("About")
    expect(sidebarSource).not.toContain("Sign up")
    expect(headerSource).toContain('onClick={() => changeSection("signup")}')
  })

  it("uses GSAP for focused reveals and respects reduced motion", () => {
    const source = readSource(
      "src/components/public/home-canvas-product-motion.tsx"
    )

    expect(source).toContain('import { gsap } from "gsap"')
    expect(source).toContain("prefers-reduced-motion: reduce")
    expect(source).toContain("IntersectionObserver")
    expect(source).toContain('ease: "power3.out"')
  })

  it("uses a bounded live product vignette instead of a raster map capture", () => {
    const previewSource = readSource(
      "src/components/public/home-find-map-mini.tsx"
    )
    const markerSource = readSource(
      "src/components/public/home-find-map-marker-canvas.ts"
    )
    const assetPath = join(ROOT, "public/home/find-map-preview.webp")

    expect(existsSync(assetPath)).toBe(false)
    expect(previewSource).toContain('import("mapbox-gl")')
    expect(previewSource).toContain("createHomeFindMapMarkerImage")
    expect(previewSource).not.toContain("public-map-marker-canvas")
    expect(previewSource).toContain("HOME_MAP_POINTS")
    expect(previewSource).toContain("interactive: false")
    expect(previewSource).toContain('logoPosition: "top-left"')
    expect(previewSource).toContain('"top-left"')
    expect(previewSource).toContain(
      'data-home-map-controls-position="top-left"'
    )
    expect(previewSource).toContain(
      "[&_.mapboxgl-ctrl-top-left]:!top-16"
    )
    expect(previewSource).toContain(
      "[&_.mapboxgl-ctrl-top-left]:!left-3"
    )
    expect(previewSource).toContain(
      "[&_.mapboxgl-ctrl-top-left_.mapboxgl-ctrl]:!m-0"
    )
    expect(previewSource).toContain("mapRef.current?.remove()")
    expect(previewSource).not.toContain("PublicMapIndex")
    expect(previewSource).not.toContain("/api/public/resource-map/items")
    expect(markerSource).toContain("PUBLIC_MAP_GROUP_ACCENTS")
    expect(markerSource).toContain("HOME_MAP_MARKER_BACKING_SCALE = 4")
    expect(markerSource).toContain("HOME_MAP_MARKER_IMAGE_PIXEL_RATIO = 8")
    expect(markerSource).not.toContain("resource-categories")
  })

  it("keeps public fiscal sponsorship actions active", () => {
    const source = readSource(
      "src/components/public/home-canvas-product-panels.tsx"
    )

    expect(source).toContain("onOpenFlow={() =>")
    expect(source).toContain('router.push("/?section=signup&intent=fund")')
  })

  it("only serializes a public Mapbox token into the home preview", () => {
    const tokenSource = readSource("src/lib/mapbox/token.ts")
    const routeSource = readSource("src/app/(public)/page.tsx")

    expect(tokenSource).toContain("getPublicMapboxToken")
    expect(tokenSource).toContain('startsWith("pk.")')
    expect(routeSource).toContain("mapboxToken={getPublicMapboxToken()}")
  })
})
