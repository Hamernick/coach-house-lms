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

  it("preserves post-guide user-customized fiscal sponsorship placement on reload", () => {
    const boardState = buildDefaultBoardState()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: false,
      tutorialStepIndex: resolveWorkspaceCanvasTutorialStepCount() - 1,
    }
    boardState.hiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds().filter(
      (cardId) => cardId !== "fiscal-sponsorship"
    )
    boardState.nodes = boardState.nodes.map((node) =>
      node.id === "fiscal-sponsorship"
        ? { ...node, x: 898, y: -510, size: "sm" as const }
        : node
    )

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: false,
        workspaceOnboardingActive: false,
        workspaceOnboardingCompletedAt: "2026-06-05T15:43:37.000Z",
      },
    )

    expect(next.boardState.hiddenCardIds).not.toContain("fiscal-sponsorship")
    expect(
      next.boardState.nodes.find((node) => node.id === "fiscal-sponsorship")
    ).toMatchObject({
      x: 898,
      y: -510,
      size: "sm",
    })
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
