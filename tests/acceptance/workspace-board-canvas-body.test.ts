import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceCanvasTutorialCallout,
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"
import { shouldAutoOpenRightRailForWorkspaceTutorialCallout } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-tutorial-right-rail"

function resolveTutorialStepIndex(stepId: string) {
  const stepCount = resolveWorkspaceCanvasTutorialStepCount()
  for (let index = 0; index < stepCount; index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }
  throw new Error(`Tutorial step not found: ${stepId}`)
}

describe("workspace board canvas body", () => {
  it("auto-opens the right rail for the team access tutorial step", () => {
    const tutorialCallout = resolveWorkspaceCanvasTutorialCallout(
      resolveTutorialStepIndex("collaboration"),
      [],
    )

    expect(
      shouldAutoOpenRightRailForWorkspaceTutorialCallout(tutorialCallout),
    ).toBe(true)
  })

  it("does not auto-open the right rail for tool shortcut steps", () => {
    const tutorialCallout = resolveWorkspaceCanvasTutorialCallout(
      resolveTutorialStepIndex("accelerator"),
      [],
    )

    expect(
      shouldAutoOpenRightRailForWorkspaceTutorialCallout(tutorialCallout),
    ).toBe(false)
  })
})
