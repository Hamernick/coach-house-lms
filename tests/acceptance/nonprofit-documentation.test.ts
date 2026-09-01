import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  DOCUMENTATION_NAVIGATION,
  DOCUMENTATION_PATH,
  KEY_CONCEPTS_GUIDE,
  MISSION_ARTICLE,
  QUICKSTART_GUIDE,
  BRAND_IDENTITY_PATH,
  BRAND_FONT_GROUPS,
  BRAND_FONT_OPTIONS,
  DEFAULT_BRAND_IDENTITY_DRAFT,
  brandColorLabel,
  buildBrandTokens,
  brandFontStack,
  contrastRating,
  contrastRatio,
  normalizeHex,
  normalizeProportions,
  sanitizeBrandDraft,
  typeScale,
} from "@/features/nonprofit-documentation"
import { createBrowserZip } from "@/features/nonprofit-documentation/lib/brand-identity-export"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("nonprofit documentation feature", () => {
  it("publishes one canonical navigation registry without dead links", () => {
    expect(DOCUMENTATION_PATH).toBe("/documentation")
    expect(DOCUMENTATION_NAVIGATION.map((section) => section.title)).toEqual([
      "Get started",
      "Best practices",
      "The toolbox",
      "Resources",
    ])

    const items = DOCUMENTATION_NAVIGATION.flatMap((section) => section.items)
    expect(items.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Quickstart",
        "Mission",
        "Compliance",
        "Fundraising",
        "Measuring impact",
        "Brand identity",
        "Finance",
        "Legal",
        "Map",
        "Marketplace",
      ])
    )
    expect(items.find((item) => item.title === "Map")?.href).toBe("/")
    expect(items.find((item) => item.title === "Quickstart")?.href).toBe(
      "/documentation/quickstart"
    )
    expect(items.find((item) => item.title === "Key concepts")?.href).toBe(
      "/documentation/key-concepts"
    )
    const brandIdentity = items.find((item) => item.title === "Brand identity")
    expect(brandIdentity).toMatchObject({
      status: "live",
      href: "/documentation/toolbox/brand-identity",
    })
    expect(items.filter((item) => item.status !== "live" && item.href)).toEqual(
      []
    )
  })

  it("publishes the public brand identity builder without an auth boundary", () => {
    const route = readSource(
      "src/app/(public)/documentation/toolbox/brand-identity/page.tsx"
    )
    const tool = readSource(
      "src/features/nonprofit-documentation/components/brand-identity/brand-identity-tool.tsx"
    )
    const hook = readSource(
      "src/features/nonprofit-documentation/hooks/use-brand-identity-tool.ts"
    )

    expect(BRAND_IDENTITY_PATH).toBe("/documentation/toolbox/brand-identity")
    expect(route).toContain("<BrandIdentityTool />")
    expect(route).toContain(
      'canonical: "/documentation/toolbox/brand-identity"'
    )
    expect(tool).toContain('"@type": "WebApplication"')
    expect(tool).toContain("No account required")
    expect(tool).toContain("Private to this browser")
    expect(tool).toContain("<DocumentationSurface")
    expect(hook).toContain("window.localStorage")
    expect(hook).toContain("loadBrandAssets")
    expect(tool).not.toContain("hasActiveSubscription")
  })

  it("computes valid accessible brand values and portable tokens", () => {
    expect(normalizeHex("#abc")).toBe("#AABBCC")
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5)
    expect(contrastRating(7)).toBe("AAA")
    expect(contrastRating(4.5)).toBe("AA")
    expect(contrastRating(4.49)).toBe("Fail")

    const proportions = normalizeProportions([
      ...DEFAULT_BRAND_IDENTITY_DRAFT.colors.slice(0, 3),
      { ...DEFAULT_BRAND_IDENTITY_DRAFT.colors[3], proportion: 30 },
    ])
    expect(
      proportions.reduce((sum, color) => sum + color.proportion, 0)
    ).toBeCloseTo(100, 2)

    const scale = typeScale(16, 1.25)
    expect(scale.body).toBe(16)
    expect(scale.h1).toBeCloseTo(31.25, 2)
    const tokens = buildBrandTokens(DEFAULT_BRAND_IDENTITY_DRAFT)
    expect(tokens).toContain("--brand-canvas: #F3F0E8;")
    expect(tokens).toContain("--brand-type-h1: 31.25px;")
  })

  it("uses fixed palette roles, optional names, and portable fonts", () => {
    expect(
      DEFAULT_BRAND_IDENTITY_DRAFT.colors.map(({ role, name }) => ({
        role,
        name,
      }))
    ).toEqual([
      { role: "Background", name: "" },
      { role: "Primary", name: "" },
      { role: "Secondary", name: "" },
      { role: "Text", name: "" },
    ])
    expect(brandColorLabel(DEFAULT_BRAND_IDENTITY_DRAFT.colors[0])).toBe(
      "Background"
    )
    expect(
      brandColorLabel({
        ...DEFAULT_BRAND_IDENTITY_DRAFT.colors[0],
        name: "Harbor Blue",
      })
    ).toBe("Background — Harbor Blue")
    expect(BRAND_FONT_OPTIONS.length).toBeGreaterThanOrEqual(30)
    expect(BRAND_FONT_GROUPS.map((group) => group.label)).toEqual([
      "Sans serif",
      "Serif",
      "Display",
      "Monospace",
    ])
    expect(brandFontStack("Georgia")).toBe("Georgia, serif")

    for (const legacyName of ["Community cream", "Warm canvas"]) {
      const migrated = sanitizeBrandDraft({
        ...DEFAULT_BRAND_IDENTITY_DRAFT,
        colors: DEFAULT_BRAND_IDENTITY_DRAFT.colors.map((color) =>
          color.id === "canvas" ? { ...color, name: legacyName } : color
        ),
      })
      expect(migrated.colors[0]).toMatchObject({
        role: "Background",
        name: "",
      })
    }
  })

  it("creates a valid browser ZIP archive for public downloads", () => {
    const archive = createBrowserZip([
      { name: "README.txt", data: new TextEncoder().encode("Coach House") },
      { name: "brand/tokens.css", data: new TextEncoder().encode(":root {}") },
    ])
    const view = new DataView(archive.buffer)

    expect(view.getUint32(0, true)).toBe(0x04034b50)
    expect(view.getUint32(archive.length - 22, true)).toBe(0x06054b50)
    expect(view.getUint16(archive.length - 12, true)).toBe(2)
  })

  it("publishes complete stage-specific foundation guides", () => {
    for (const guide of [QUICKSTART_GUIDE, KEY_CONCEPTS_GUIDE]) {
      expect(guide.stages.map((stage) => stage.id)).toEqual([
        "exploring",
        "forming",
        "operating",
        "growing",
      ])
      expect(guide.sections.length).toBeGreaterThanOrEqual(2)
      expect(guide.checklist.length).toBeGreaterThanOrEqual(6)
      expect(guide.sources.length).toBeGreaterThanOrEqual(3)
      expect(
        guide.sources.every((source) =>
          source.url.startsWith("https://www.irs.gov/")
        )
      ).toBe(true)
    }
  })

  it("provides complete stage-specific mission guidance", () => {
    expect(MISSION_ARTICLE.stages.map((stage) => stage.id)).toEqual([
      "exploring",
      "forming",
      "operating",
      "growing",
    ])
    expect(MISSION_ARTICLE.framework).toHaveLength(5)
    expect(MISSION_ARTICLE.checklist.length).toBeGreaterThanOrEqual(6)
    expect(MISSION_ARTICLE.mistakes.length).toBeGreaterThanOrEqual(4)
    expect(MISSION_ARTICLE.measures.length).toBeGreaterThanOrEqual(5)
    expect(MISSION_ARTICLE.sources.length).toBeGreaterThanOrEqual(3)
    expect(
      MISSION_ARTICLE.sources.every((source) =>
        source.url.startsWith("https://www.irs.gov/")
      )
    ).toBe(true)
  })

  it("uses the shared public and authenticated canvas shells", () => {
    const layout = readSource("src/app/(public)/documentation/layout.tsx")
    const shell = readSource(
      "src/features/nonprofit-documentation/components/documentation-shell.tsx"
    )
    const appShellTypes = readSource("src/components/app-shell/types.ts")

    expect(layout).toContain("resolveDashboardLayoutState")
    expect(layout).toContain("readAppSidebarDefaultOpen")
    expect(layout).toContain("shellState.userPresent ? shellState : null")
    expect(shell).toContain("HomeCanvasFindShell")
    expect(shell).toContain("<AppShell")
    expect(shell).toContain("<DocumentationRail contextual />")
    expect(shell).toContain("allowOnboardingLockedContent")
    expect(appShellTypes).toContain("contextualNavigation?: ReactNode")
  })

  it("keeps route files composition-only and exposes crawlable metadata", () => {
    const homeRoute = readSource("src/app/(public)/documentation/page.tsx")
    const missionRoute = readSource(
      "src/app/(public)/documentation/best-practices/mission/page.tsx"
    )
    const quickstartRoute = readSource(
      "src/app/(public)/documentation/quickstart/page.tsx"
    )
    const conceptsRoute = readSource(
      "src/app/(public)/documentation/key-concepts/page.tsx"
    )
    const home = readSource(
      "src/features/nonprofit-documentation/components/documentation-home.tsx"
    )
    const mission = readSource(
      "src/features/nonprofit-documentation/components/mission-article.tsx"
    )

    expect(homeRoute).toContain("<DocumentationHome />")
    expect(missionRoute).toContain("<MissionArticlePage />")
    expect(quickstartRoute).toContain(
      "<FoundationGuidePage guide={QUICKSTART_GUIDE} />"
    )
    expect(conceptsRoute).toContain(
      "<FoundationGuidePage guide={KEY_CONCEPTS_GUIDE} />"
    )
    expect(missionRoute).toContain(
      'canonical: "/documentation/best-practices/mission"'
    )
    expect(home).toContain('"@type": "CollectionPage"')
    expect(mission).toContain('"@type": "Article"')
    expect(mission).toContain('"@type": "BreadcrumbList"')
    expect(quickstartRoute).toContain('canonical: "/documentation/quickstart"')
    expect(conceptsRoute).toContain('canonical: "/documentation/key-concepts"')
  })
})
