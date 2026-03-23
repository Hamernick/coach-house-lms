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
    const completionHiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: false,
      tutorialStepIndex: resolveWorkspaceCanvasTutorialStepCount() - 1,
    }
    boardState.hiddenCardIds = [...completionHiddenCardIds].reverse()

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
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(
      resolveWorkspaceCanvasTutorialStepCount() - 1,
    )
    expect(next.boardState.hiddenCardIds).toEqual(boardState.hiddenCardIds)
  })

  it("forces the real post-guide workspace state when auth metadata says the tutorial is complete", () => {
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
        workspaceTutorialRequested: false,
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

  it("activates the workspace tutorial when initial onboarding is still required", () => {
    const boardState = buildDefaultBoardState()

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: true,
        workspaceOnboardingActive: false,
        workspaceTutorialRequested: false,
        workspaceOnboardingCompletedAt: null,
      },
    )

    expect(next.boardState.onboardingFlow.active).toBe(true)
    expect(next.boardState.connections.length).toBeGreaterThanOrEqual(
      boardState.connections.length,
    )
  })

  it("restarts a completed tutorial when auth metadata reactivates onboarding", () => {
    const boardState = buildDefaultBoardState()
    const completionHiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: false,
      tutorialStepIndex: resolveWorkspaceCanvasTutorialStepCount() - 1,
    }
    boardState.hiddenCardIds = [...completionHiddenCardIds]

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: false,
        workspaceOnboardingActive: true,
        workspaceTutorialRequested: false,
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
