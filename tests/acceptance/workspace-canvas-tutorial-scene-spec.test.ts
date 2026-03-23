import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen,
  resolveWorkspaceTutorialTransitionKind,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-scene-spec"
import { resolveWorkspaceCanvasTutorialStep, resolveWorkspaceCanvasTutorialStepCount } from "@/features/workspace-canvas-tutorial"

function findTutorialStepIndex(stepId: ReturnType<typeof resolveWorkspaceCanvasTutorialStep>["id"]) {
  for (let index = 0; index < resolveWorkspaceCanvasTutorialStepCount(); index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }

  throw new Error(`Missing tutorial step: ${stepId}`)
}

describe("workspace tutorial scene spec", () => {
  it("only treats the close-module step as an open accelerator preview scene", () => {
    expect(
      resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen({
        tutorialStepIndex: findTutorialStepIndex("accelerator-close-module"),
        acceleratorModuleViewerOpen: true,
      }),
    ).toBe(true)

    expect(
      resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen({
        tutorialStepIndex: findTutorialStepIndex("calendar"),
        acceleratorModuleViewerOpen: true,
      }),
    ).toBe(false)
  })

  it("uses a dedicated transition kind when Calendar follows the module preview", () => {
    expect(
      resolveWorkspaceTutorialTransitionKind({
        previousStepIndex: findTutorialStepIndex("accelerator-close-module"),
        nextStepIndex: findTutorialStepIndex("calendar"),
        openedTutorialStepIds: ["accelerator", "accelerator-first-module"],
      }),
    ).toBe("accelerator-preview-exit")
  })

  it("uses a dedicated transition kind when the guide enters the accelerator presentation", () => {
    expect(
      resolveWorkspaceTutorialTransitionKind({
        previousStepIndex: findTutorialStepIndex("tool-buttons"),
        nextStepIndex: findTutorialStepIndex("accelerator"),
        openedTutorialStepIds: ["accelerator"],
      }),
    ).toBe("accelerator-entry")
  })
})
