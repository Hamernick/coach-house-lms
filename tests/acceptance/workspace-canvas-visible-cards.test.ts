import { describe, expect, it } from "vitest"

import { resolveVisibleWorkspaceCanvasCardIds } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-visible-cards"

describe("workspace canvas visible cards", () => {
  it("keeps calendar and tasks out of the live canvas card set", () => {
    const visibleCardIds = resolveVisibleWorkspaceCanvasCardIds([])

    expect(visibleCardIds).not.toContain("calendar")
    expect(visibleCardIds).not.toContain("deck")
    expect(visibleCardIds).toEqual(
      expect.arrayContaining([
        "organization-overview",
        "programs",
        "roadmap",
        "accelerator",
      ]),
    )
  })

  it("still respects hidden-card filtering for the remaining live canvas cards", () => {
    const visibleCardIds = resolveVisibleWorkspaceCanvasCardIds([
      "roadmap",
      "deck",
      "communications",
    ])

    expect(visibleCardIds).not.toContain("roadmap")
    expect(visibleCardIds).not.toContain("deck")
    expect(visibleCardIds).not.toContain("communications")
    expect(visibleCardIds).toContain("programs")
  })
})
