import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  DOCUMENTATION_NAVIGATION,
  DOCUMENTATION_PATH,
  KEY_CONCEPTS_GUIDE,
  MISSION_ARTICLE,
  QUICKSTART_GUIDE,
} from "@/features/nonprofit-documentation"

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
    expect(brandIdentity).toMatchObject({ status: "design-pending" })
    expect(brandIdentity).not.toHaveProperty("href")
    expect(items.filter((item) => item.status !== "live" && item.href)).toEqual(
      []
    )
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
