import { describe, expect, it } from "vitest"

import { resolveWorkspaceCanvasPresentationPlan } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/runtime/workspace-canvas-presentation-engine"
import {
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

function resolveTutorialStepIndex(stepId: WorkspaceCanvasTutorialStepId) {
  for (let index = 0; index < resolveWorkspaceCanvasTutorialStepCount(); index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }

  throw new Error(`Unable to resolve tutorial step index for ${stepId}.`)
}

describe("workspace canvas presentation engine", () => {
  it("keeps unresolved shortcut steps centered and skips autofocus", () => {
    const plan = resolveWorkspaceCanvasPresentationPlan({
      tutorialActive: true,
      previousStepIndex: resolveTutorialStepIndex("accelerator-close-module"),
      tutorialStepIndex: resolveTutorialStepIndex("calendar"),
      openedTutorialStepIds: ["accelerator-close-module"],
      prefersReducedMotion: false,
      tutorialNodeAttached: false,
      tutorialSelectedCardId: "organization-overview",
      visibleCardIds: ["organization-overview"],
    })

    expect(plan.transitionKind).toBe("accelerator-preview-exit")
    expect(plan.shellMode).toBe("centered-prompt")
    expect(plan.autofocusTarget).toBeNull()
    expect(plan.layoutDurationMs).toBe(220)
    expect(plan.cameraDurationMs).toBe(240)
  })

  it("uses the accelerator-entry grammar while keeping the opened accelerator intro centered", () => {
    const plan = resolveWorkspaceCanvasPresentationPlan({
      tutorialActive: true,
      previousStepIndex: resolveTutorialStepIndex("tool-buttons"),
      tutorialStepIndex: resolveTutorialStepIndex("accelerator"),
      openedTutorialStepIds: ["accelerator"],
      prefersReducedMotion: false,
      tutorialNodeAttached: false,
      tutorialSelectedCardId: "accelerator",
      visibleCardIds: ["accelerator"],
    })

    expect(plan.transitionKind).toBe("accelerator-entry")
    expect(plan.shellMode).toBe("centered-prompt")
    expect(plan.autofocusTarget).toBe("accelerator")
    expect(plan.layoutDurationMs).toBe(360)
    expect(plan.cameraDelayMs).toBe(72)
    expect(plan.cameraDurationMs).toBe(420)
  })

  it("removes staged timing under reduced motion without changing the semantic shell mode", () => {
    const plan = resolveWorkspaceCanvasPresentationPlan({
      tutorialActive: true,
      previousStepIndex: resolveTutorialStepIndex("organization"),
      tutorialStepIndex: resolveTutorialStepIndex("tool-buttons"),
      openedTutorialStepIds: [],
      prefersReducedMotion: true,
      tutorialNodeAttached: false,
      tutorialSelectedCardId: "organization-overview",
      visibleCardIds: ["organization-overview"],
    })

    expect(plan.shellMode).toBe("centered-prompt")
    expect(plan.layoutDurationMs).toBe(0)
    expect(plan.cameraDelayMs).toBe(0)
    expect(plan.cameraDurationMs).toBe(0)
  })
})
