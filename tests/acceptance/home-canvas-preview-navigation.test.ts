import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

vi.mock("@/components/public/legacy-home-sections", () => ({
  LEGACY_HOME_SECTION_NAV: [
    { id: "hero", label: "Hero", icon: () => null },
    { id: "platform", label: "Platform", icon: () => null },
    { id: "accelerator", label: "Accelerator", icon: () => null },
    { id: "process", label: "Process", icon: () => null },
    { id: "team", label: "Team", icon: () => null },
  ],
}))

import {
  SIDEBAR_CANVAS_NAV,
  VISIBLE_CANVAS_NAV,
} from "@/components/public/home-canvas-preview-config"
import { resolveHomeCanvasSectionTransition } from "@/components/public/home-canvas-preview-navigation"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("home canvas preview navigation", () => {
  it("keeps the hero section available while hiding Welcome from the sidebar nav", () => {
    expect(VISIBLE_CANVAS_NAV.map((item) => item.id)).toContain("hero")
    expect(SIDEBAR_CANVAS_NAV.map((item) => item.id)).not.toContain("hero")
    expect(SIDEBAR_CANVAS_NAV.map((item) => item.label)).not.toContain(
      "Welcome"
    )
  })

  it("still syncs hidden auth panels when the section changes via URL", () => {
    expect(resolveHomeCanvasSectionTransition("signup", "login")).toEqual({
      shouldChange: true,
      direction: null,
    })
    expect(resolveHomeCanvasSectionTransition("login", "hero")).toEqual({
      shouldChange: true,
      direction: null,
    })
  })

  it("preserves directional transitions for visible sections", () => {
    expect(resolveHomeCanvasSectionTransition("hero", "platform")).toEqual({
      shouldChange: true,
      direction: 1,
    })
    expect(resolveHomeCanvasSectionTransition("platform", "hero")).toEqual({
      shouldChange: true,
      direction: -1,
    })
  })

  it("keeps mobile brand and menu controls in their expected positions", () => {
    const source = readSource(
      "src/components/public/home-canvas-preview-shell.tsx"
    )

    expect(source).toContain("function HomeCanvasMobileHeaderBrand")
    expect(source).toContain("function HomeCanvasSidebarHeader")
    expect(source).toContain("function HomeCanvasMobileSidebarTrigger")
    expect(source).toContain(
      "const { isMobile, openMobile, toggleSidebar } = useSidebar()"
    )
    expect(source).toContain(
      'aria-label={openMobile ? "Close navigation menu" : "Open navigation menu"}'
    )
    expect(source).toContain("aria-expanded={openMobile}")
    expect(source).toContain("onClick={toggleSidebar}")
    expect(source).toContain("size-11")
    expect(source).toContain('className="hidden md:inline-flex"')
    expect(source).toContain('className="size-10 touch-manipulation md:hidden"')
    expect(source.indexOf("<HomeCanvasMobileHeaderBrand")).toBeLessThan(
      source.indexOf("<HomeCanvasLoginButton")
    )
    expect(source.indexOf("<HomeCanvasMobileSidebarTrigger")).toBeGreaterThan(
      source.indexOf("<HomeCanvasLoginButton")
    )
  })
})
