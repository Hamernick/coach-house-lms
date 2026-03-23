import { describe, expect, it } from "vitest"

import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import { applyWorkspaceTutorialActivationToSeed } from "@/app/(dashboard)/my-organization/_lib/my-organization-workspace-seed-helpers"
import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"

describe("my organization workspace seed helpers", () => {
  it("forces the post-guide workspace state when completion metadata is present", () => {
    const boardState = buildDefaultBoardState()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: true,
      tutorialStepIndex: 0,
    }

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: false,
        workspaceOnboardingActive: true,
        workspaceOnboardingCompletedAt: "2026-03-18T21:00:00.000Z",
      },
    )

    expect(next.boardState.onboardingFlow.active).toBe(false)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(
      resolveWorkspaceCanvasTutorialStepCount() - 1,
    )
    expect(next.boardState.hiddenCardIds).toEqual(
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds(),
    )
  })

  it("still forces the post-guide workspace state after onboarding has already been marked inactive", () => {
    const boardState = buildDefaultBoardState()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: true,
      tutorialStepIndex: 0,
    }

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: false,
        workspaceOnboardingActive: false,
        workspaceOnboardingCompletedAt: "2026-03-19T00:00:00.000Z",
      },
    )

    expect(next.boardState.onboardingFlow.active).toBe(false)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(
      resolveWorkspaceCanvasTutorialStepCount() - 1,
    )
    expect(next.boardState.hiddenCardIds).toEqual(
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds(),
    )
  })

  it("restarts a completed tutorial when onboarding is reactivated", () => {
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
        workspaceOnboardingActive: true,
        workspaceOnboardingCompletedAt: null,
      },
    )

    expect(next.boardState.onboardingFlow.active).toBe(true)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(0)
    expect(next.boardState.onboardingFlow.openedTutorialStepIds).toEqual([])
    expect(next.boardState.onboardingFlow.acknowledgedTutorialStepIds).toEqual([])
    expect(next.boardState.hiddenCardIds).toContain("organization-overview")
    expect(next.boardState.hiddenCardIds).toContain("accelerator")
  })
})
