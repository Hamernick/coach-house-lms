import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public home canvas", () => {
  it("installs the marketplace home while preserving the archived canvas routes", () => {
    const routeSource = readSource("src/app/(public)/page.tsx")
    const archiveSource = readSource("src/app/(public)/home-canvas/page.tsx")

    expect(routeSource).toContain("<HomeMarketplacePage")
    expect(routeSource).toContain("if (!initialSection)")
    expect(routeSource).toContain("<HomeCanvasPreview")
    expect(routeSource).toContain("<PricingSurface embedded />")
    expect(archiveSource).toContain("<HomeCanvasPreview")
    expect(routeSource).not.toContain("HomePageSurface")
  })

  it("keeps the viewport fixed and scrolls the two-section story inside the rounded frame", () => {
    const pageSource = readSource(
      "src/components/public/home-marketplace-page.tsx"
    )
    const motionSource = readSource(
      "src/components/public/home-marketplace-motion.tsx"
    )
    const heroSource = readSource(
      "src/components/public/home-marketplace-hero.tsx"
    )
    const collectSource = readSource(
      "src/components/public/home-marketplace-collect-section.tsx"
    )

    expect(pageSource).toContain("h-svh min-h-0 flex-col overflow-hidden")
    expect(pageSource).toContain("rounded-[28px]")
    expect(pageSource).toContain("border bg-[#006bff]")
    expect(pageSource).toContain("<HomeMarketplaceHero")
    expect(pageSource).toContain("<HomeMarketplaceCollectSection")
    expect(motionSource).toContain("overflow-y-auto overscroll-y-none")
    expect(motionSource).toContain("bg-[#006bff]")
    expect(motionSource).toContain("touch-pan-y")
    expect(motionSource).toContain("[-webkit-overflow-scrolling:touch]")
    expect(motionSource).not.toContain("scroll-smooth")
    expect(heroSource).toContain("Build &amp;")
    expect(heroSource).toContain("Collect NFP&apos;s.")
    expect(heroSource).toContain("Collect NFPs")
    expect(heroSource).toContain("active resources")
    expect(heroSource).toContain(
      "Collect basic resources provided by NFP&apos;s in your area or build"
    )
    expect(heroSource.match(/touch-manipulation rounded-full/g)).toHaveLength(2)
    expect(heroSource).not.toContain("Network of resources")
    expect(heroSource).not.toContain("live map points")
    expect(heroSource).toContain('fetch("/api/public/home-map-preview?v=5"')
    expect(heroSource).toContain("data-marketplace-live-count")
    expect(heroSource).toContain("data-marketplace-live-pulse")
    expect(heroSource).toContain("motion-safe:animate-ping")
    expect(heroSource).toContain("rounded-full border border-white/18")
    expect(heroSource).toContain("whitespace-nowrap text-white/76")
    expect(heroSource).toContain("bg-[#003f9e]/28 px-3.5 py-1.5")
    expect(heroSource).toContain("has-[>svg]:pr-5 has-[>svg]:pl-6")
    expect(heroSource).not.toContain("HomeFindMapMini")
    expect(heroSource).not.toContain("HomeFindMapMini")
    expect(heroSource).not.toContain("HomeMarketplaceHeroStage")
    expect(heroSource).not.toContain("data-marketplace-stage")
    expect(heroSource).not.toContain("data-marketplace-network-card")
    expect(heroSource).not.toContain("Operating layer")
    expect(heroSource).toContain("data-marketplace-hero-sticky")
    expect(heroSource).toContain("flex-col items-center justify-center")
    expect(heroSource).not.toContain("pt-[clamp(3.25rem,8vh,6.5rem)]")
    expect(heroSource).toContain("data-marketplace-hero-grid")
    expect(heroSource).toContain("<GridPattern")
    expect(heroSource).toContain("[perspective:1200px]")
    expect(heroSource).toContain("data-marketplace-hero-grid-plane")
    expect(heroSource).toContain("[transform:rotateX(67deg)]")
    expect(heroSource).not.toContain("[transform:rotate(-7deg)]")
    expect(heroSource).toContain("text-center sm:px-10")
    expect(heroSource).not.toContain("lg:grid-cols")
    expect(heroSource).not.toContain("left-[62%]")
    expect(heroSource).not.toContain("Featured now")
    expect(heroSource).toContain("bg-[#006bff]")
    expect(heroSource).not.toContain("bg-[#050505]")
    expect(collectSource).not.toContain("<HomeFindMapMini")
    expect(collectSource).not.toContain("data-marketplace-product-stage")
    expect(collectSource).not.toContain("data-marketplace-map-card")
    expect(collectSource).not.toContain("data-marketplace-collection-card")
    expect(collectSource).not.toContain("data-marketplace-map-link")
    expect(collectSource).not.toContain("data-marketplace-collect-copy")
    expect(collectSource).not.toContain("Keep the work close.")
    expect(collectSource).not.toContain(
      "One map for every update, need, and next move."
    )
    expect(collectSource).not.toContain("Open your map")
    expect(collectSource).not.toContain("PlusIcon")
    expect(collectSource).not.toContain("<Button")
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
    expect(source.match(/variant=\{null\}/g)).toHaveLength(3)
    expect(source).not.toContain("hover:")
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

  it("uses GSAP for restrained copy reveals and respects reduced motion", () => {
    const source = readSource(
      "src/components/public/home-canvas-product-motion.tsx"
    )

    expect(source).toContain('import { gsap } from "gsap"')
    expect(source).toContain("prefers-reduced-motion: reduce")
    expect(source).toContain("IntersectionObserver")
    expect(source).toContain('ease: "power3.out"')
    expect(source).not.toContain('"[data-home-canvas-hero-media]"')
    expect(source).not.toContain("scale: 1.06")
  })

  it("gives the marketplace hero visible GSAP choreography", () => {
    const motionSource = readSource(
      "src/components/public/home-marketplace-motion.tsx"
    )
    const heroSource = readSource(
      "src/components/public/home-marketplace-hero.tsx"
    )

    expect(motionSource).toContain('import { gsap } from "gsap"')
    expect(motionSource).toContain("prefers-reduced-motion: reduce")
    expect(motionSource).toContain('"[data-marketplace-hero-line]"')
    expect(motionSource).toContain("{ autoAlpha: 0, y: 64 }")
    expect(motionSource).not.toContain("data-marketplace-hero-visual")
    expect(motionSource).toContain(
      'import { ScrollTrigger } from "gsap/ScrollTrigger"'
    )
    expect(motionSource).toContain("scrub: true")
    expect(motionSource).toContain("invalidateOnRefresh: true")
    expect(motionSource).toContain("yPercent: -8")
    expect(motionSource).not.toContain("scale: 0.96")
    expect(motionSource).not.toContain("[data-marketplace-stage-shell]")
    expect(motionSource).not.toContain("[data-marketplace-network-card]")
    expect(motionSource).not.toContain("[data-marketplace-map-card]")
    expect(motionSource).not.toContain("[data-marketplace-collection-card]")
    expect(motionSource).not.toContain("[data-marketplace-map-link]")
    expect(motionSource).not.toContain("[data-marketplace-collect-copy]")
    expect(heroSource.match(/data-marketplace-hero-line/g)).toHaveLength(2)
  })

  it("uses a bounded live product vignette instead of a raster map capture", () => {
    const previewSource = readSource(
      "src/components/public/home-find-map-mini.tsx"
    )
    const assetPath = join(ROOT, "public/home/find-map-preview.webp")
    const obsoleteMarkerPath = join(
      ROOT,
      "src/components/public/home-find-map-marker-canvas.ts"
    )

    expect(existsSync(assetPath)).toBe(false)
    expect(existsSync(obsoleteMarkerPath)).toBe(false)
    expect(previewSource).toContain('import("mapbox-gl")')
    expect(previewSource).toContain("resolvePublicMapStyleForTheme")
    expect(previewSource).toContain("resolvePublicMapBasemapConfig")
    expect(previewSource).toContain('map.on("idle", markGlobeReady)')
    expect(previewSource).not.toContain('status !== "ready"')
    expect(previewSource).not.toContain("startSpinningMapGlobe")
    expect(previewSource).not.toContain("openfreemap.org")
    expect(previewSource).toContain("fitHomeMapToPreviewFeatures")
    expect(previewSource).toContain("HOME_MAP_PREVIEW_MAX_ZOOM = 7")
    expect(previewSource).toContain('cameraMode = "preview-bounds"')
    expect(previewSource).toContain("data-home-map-camera={cameraMode}")
    expect(previewSource).toContain('"collection-globe"')
    expect(previewSource).toContain("syncPublicMapMarkerArtwork")
    expect(previewSource.match(/showLabels: false/g)).toHaveLength(2)
    expect(previewSource).toContain("PublicMapPointFeature[]")
    expect(previewSource).not.toContain("HOME_MAP_POINTS")
    expect(previewSource).not.toContain("satellite-v9")
    expect(previewSource).toContain("interactive = false")
    expect(previewSource).toContain('logoPosition: "bottom-left"')
    expect(previewSource).toContain(
      "new mapboxgl.AttributionControl({ compact: false })"
    )
    expect(previewSource).not.toContain(
      "new mapboxgl.AttributionControl({ compact: true })"
    )
    expect(previewSource).toContain(
      'data-home-map-controls-position="bottom-right"'
    )
    expect(previewSource).toContain("<figure")
    expect(previewSource).toContain('<figcaption className="sr-only">')
    expect(previewSource).not.toContain('role="img"')
    expect(previewSource).not.toContain(
      'aria-label="Public organizations and community resources on a rotating globe"'
    )
    expect(previewSource).toContain("className={`absolute inset-0")
    expect(previewSource).not.toContain("mapboxgl-map absolute inset-0")
    expect(previewSource).toContain("[&_.mapboxgl-ctrl-attrib]:!text-[10px]")
    expect(previewSource).not.toContain("mapbox-improve-map]:hidden")
    expect(previewSource).not.toContain("mapboxgl-ctrl-top-left")
    expect(previewSource).toContain("mapRef.current?.remove()")
    expect(previewSource).not.toContain("PublicMapIndex")
    expect(previewSource).not.toContain("/api/public/resource-map/items")
    expect(previewSource).not.toContain("HomeMapFallback")
    expect(previewSource).not.toContain("FALLBACK_MARKERS")
    expect(previewSource).not.toContain("clip-path:polygon")
    expect(previewSource).not.toContain("HomeMapSelectedPreview")
    expect(previewSource).not.toContain("data-home-map-selected-preview")
    expect(previewSource).not.toContain("Public resource map")
    expect(previewSource).not.toContain("geolocation")
    expect(previewSource).not.toContain("usePublicMapUserLocation")
  })

  it("builds the home globe from a capped published marker preview", () => {
    const routeSource = readSource("src/app/(public)/page.tsx")
    const previewComponentSource = readSource(
      "src/components/public/home-find-map-mini.tsx"
    )
    const previewDataSource = readSource(
      "src/lib/public-map/home-map-preview.ts"
    )
    const previewQuerySource = readSource("src/lib/queries/home-map-preview.ts")

    expect(routeSource).not.toContain("fetchPublicMapOrganizations")
    expect(routeSource).not.toContain("fetchPublicResourceMapItems")
    expect(previewComponentSource).toContain(
      'fetch("/api/public/home-map-preview?v=5"'
    )
    expect(previewQuerySource).toContain("fetchPublicResourceMapItemsPageById")
    expect(previewQuerySource).toContain("ignoreLocalPreviewFile: true")
    expect(previewQuerySource).toContain("includeDiscoveryCandidates: false")
    expect(previewQuerySource).toContain(
      "HOME_MAP_PREVIEW_RESOURCE_LIMIT = 5_000"
    )
    expect(previewQuerySource).toContain(
      "HOME_MAP_PREVIEW_RESOURCE_PAGE_SIZE = 500"
    )
    expect(previewQuerySource).toContain("public-home-map-preview-v13")
    expect(previewDataSource).toContain("HOME_MAP_PREVIEW_MARKER_LIMIT = 18")
    expect(previewDataSource).toContain("resolveCandidateSpreadScore")
    expect(previewDataSource).toContain("markerOverviewOffsetIndex: 0")
    expect(previewDataSource).toContain('item.visibility === "published"')
    expect(previewDataSource).toContain("includeSeedItems: false")
    expect(previewDataSource).not.toContain("resource-seed-items")
  })

  it("keeps public fiscal sponsorship actions active", () => {
    const source = readSource(
      "src/components/public/home-canvas-product-panels.tsx"
    )

    expect(source).toContain('openFlowHref="/?section=signup&intent=fund"')
  })

  it("only serializes a public Mapbox token into the archived canvas preview", () => {
    const tokenSource = readSource("src/lib/mapbox/token.ts")
    const routeSource = readSource("src/app/(public)/page.tsx")

    expect(tokenSource).toContain("getPublicMapboxToken")
    expect(tokenSource).toContain('startsWith("pk.")')
    expect(routeSource).toContain("const mapboxToken = getPublicMapboxToken()")
    expect(routeSource).toContain("return <HomeMarketplacePage />")
    expect(routeSource).not.toContain(
      "<HomeMarketplacePage mapboxToken={getPublicMapboxToken()} />"
    )
    expect(routeSource.match(/mapboxToken=\{mapboxToken\}/g)).toHaveLength(1)
  })
})
