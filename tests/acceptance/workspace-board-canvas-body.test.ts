import { describe, expect, it } from "vitest"

import { resolveWorkspaceCanvasTutorialCallout } from "@/features/workspace-canvas-tutorial"
import { shouldAutoOpenRightRailForWorkspaceTutorialCallout } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-tutorial-right-rail"

describe("workspace board canvas body", () => {
  it("auto-opens the right rail for the team access tutorial step", () => {
    const tutorialCallout = resolveWorkspaceCanvasTutorialCallout(9, [])

    expect(
      shouldAutoOpenRightRailForWorkspaceTutorialCallout(tutorialCallout),
    ).toBe(true)
  })

  it("does not auto-open the right rail for tool shortcut steps", () => {
    const tutorialCallout = resolveWorkspaceCanvasTutorialCallout(3, [])

    expect(
      shouldAutoOpenRightRailForWorkspaceTutorialCallout(tutorialCallout),
    ).toBe(false)
  })
})
