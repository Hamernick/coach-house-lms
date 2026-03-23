import { describe, expect, it } from "vitest"

import { buildDefaultWorkspaceOnboardingFlowState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-onboarding-flow"
import {
  buildOpenedWorkspaceTutorialFlowState,
  buildPreviousWorkspaceTutorialFlowState,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-state"
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

describe("workspace board tutorial previous navigation", () => {
  it("rewinds shortcut steps back to their unopened prompt state", () => {
    const openedTutorialStepIds: WorkspaceCanvasTutorialStepId[] = ["accelerator"]
    const acknowledgedTutorialStepIds: WorkspaceCanvasTutorialStepId[] = [
      "accelerator",
    ]
    const acceleratorPromptStepIndex = resolveTutorialStepIndex("accelerator")
    const previousFlowState = {
      ...buildDefaultWorkspaceOnboardingFlowState(),
      active: true,
      tutorialStepIndex: resolveTutorialStepIndex("accelerator-picker"),
      openedTutorialStepIds,
      acknowledgedTutorialStepIds,
    }

    const nextFlowState =
      buildPreviousWorkspaceTutorialFlowState(previousFlowState)

    expect(nextFlowState.tutorialStepIndex).toBe(acceleratorPromptStepIndex)
    expect(nextFlowState.openedTutorialStepIds).toEqual([])
    expect(nextFlowState.acknowledgedTutorialStepIds).toEqual(["accelerator"])
  })

  it("marks shortcut steps opened without auto-advancing past the current card prompt", () => {
    const previousFlowState = {
      ...buildDefaultWorkspaceOnboardingFlowState(),
      active: true,
      tutorialStepIndex: resolveTutorialStepIndex("calendar"),
      openedTutorialStepIds: ["accelerator"] satisfies WorkspaceCanvasTutorialStepId[],
      acknowledgedTutorialStepIds: ["accelerator"] satisfies WorkspaceCanvasTutorialStepId[],
    }

    const nextFlowState = buildOpenedWorkspaceTutorialFlowState(previousFlowState)

    expect(nextFlowState.tutorialStepIndex).toBe(previousFlowState.tutorialStepIndex)
    expect(nextFlowState.openedTutorialStepIds).toEqual(["accelerator", "calendar"])
    expect(nextFlowState.acknowledgedTutorialStepIds).toEqual([
      "accelerator",
      "calendar",
    ])
  })
})
