import { describe, expect, it, vi } from "vitest"

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

describe("home canvas preview navigation", () => {
  it("keeps the hero section available while hiding Welcome from the sidebar nav", () => {
    expect(VISIBLE_CANVAS_NAV.map((item) => item.id)).toContain("hero")
    expect(SIDEBAR_CANVAS_NAV.map((item) => item.id)).not.toContain("hero")
    expect(SIDEBAR_CANVAS_NAV.map((item) => item.label)).not.toContain("Welcome")
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
})
