import { describe, expect, it } from "vitest"

import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import { applyWorkspaceTutorialActivationToSeed } from "@/app/(dashboard)/my-organization/_lib/my-organization-page-content-helpers"
import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"

describe("my organization page content helpers", () => {
  it("preserves the current tutorial step on refresh activation", () => {
    const boardState = buildDefaultBoardState()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: true,
      tutorialStepIndex: 4,
      openedTutorialStepIds: ["accelerator"],
      acknowledgedTutorialStepIds: ["organization", "tool-buttons"],
    }

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: false,
        workspaceOnboardingActive: false,
        workspaceTutorialRequested: true,
        workspaceOnboardingCompletedAt: null,
      },
    )

    expect(next.boardState.onboardingFlow.active).toBe(true)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(4)
    expect(next.boardState.onboardingFlow.openedTutorialStepIds).toEqual([
      "accelerator",
    ])
    expect(next.boardState.onboardingFlow.acknowledgedTutorialStepIds).toEqual([
      "organization",
      "tool-buttons",
    ])
  })

  it("does not reactivate a completed tutorial from the onboarding query", () => {
    const boardState = buildDefaultBoardState()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: false,
      tutorialStepIndex: resolveWorkspaceCanvasTutorialStepCount() - 1,
    }
    boardState.hiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds()

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: false,
        workspaceOnboardingActive: false,
        workspaceTutorialRequested: true,
        workspaceOnboardingCompletedAt: null,
      },
    )

    expect(next.boardState.onboardingFlow.active).toBe(false)
    expect(next.boardState.hiddenCardIds).toEqual(
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds(),
    )
  })
})
