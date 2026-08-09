import { describe, expect, it } from "vitest"

import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import {
  applyWorkspaceTutorialActivationToSeed,
  hydrateWorkspaceSeedAcceleratorState,
} from "@/app/(dashboard)/my-organization/_lib/my-organization-page-content-helpers"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"

describe("my organization page content helpers", () => {
  it("advances past recovered organization setup progress", () => {
    const boardState = buildDefaultBoardState()
    boardState.accelerator = {
      activeStepId: "setup:lesson",
      completedStepIds: [],
    }
    const baseStep = {
      published: true,
      stepKind: "lesson" as const,
      stepDescription: null,
      href: "/accelerator",
      stepSequenceIndex: 0,
      stepSequenceTotal: 2,
      moduleSequenceIndex: 0,
      moduleSequenceTotal: 2,
      groupTitle: "Formation",
      groupOrder: 0,
      videoUrl: null,
      durationMinutes: null,
      resources: [],
      hasAssignment: false,
      hasDeck: false,
    }
    const steps: WorkspaceAcceleratorCardStep[] = [
      {
        ...baseStep,
        id: "setup:lesson",
        moduleId: "setup",
        moduleSlug: "organization-setup",
        moduleTitle: "Organization setup",
        stepTitle: "Organization setup",
        status: "completed",
        moduleContext: {
          classTitle: "Formation",
          lessonNotesContent: null,
          moduleResources: [],
          assignmentFields: [],
          assignmentSubmission: null,
          completeOnSubmit: false,
          workspaceOnboarding: { view: "organization-setup" },
        },
      },
      {
        ...baseStep,
        id: "naming:lesson",
        moduleId: "naming",
        moduleSlug: "naming-your-nfp",
        moduleTitle: "Naming your NFP",
        stepTitle: "Naming your NFP",
        status: "not_started",
        stepSequenceIndex: 1,
        moduleSequenceIndex: 1,
      },
    ]

    const next = hydrateWorkspaceSeedAcceleratorState({ boardState }, steps)

    expect(next.boardState.accelerator).toEqual({
      activeStepId: "naming:lesson",
      completedStepIds: ["setup:lesson"],
    })
  })

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
      }
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
    const completionHiddenCardIds =
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
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
      }
    )

    expect(next.boardState.onboardingFlow.active).toBe(false)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(
      resolveWorkspaceCanvasTutorialStepCount() - 1
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
      }
    )

    expect(next.boardState.onboardingFlow.active).toBe(false)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(
      resolveWorkspaceCanvasTutorialStepCount() - 1
    )
    expect(next.boardState.hiddenCardIds).toEqual(
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
    )
  })

  it("preserves post-guide user-customized fiscal sponsorship placement on reload", () => {
    const boardState = buildDefaultBoardState()
    boardState.onboardingFlow = {
      ...boardState.onboardingFlow,
      active: false,
      tutorialStepIndex: resolveWorkspaceCanvasTutorialStepCount() - 1,
    }
    boardState.hiddenCardIds =
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds().filter(
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
        workspaceTutorialRequested: false,
        workspaceOnboardingCompletedAt: "2026-06-05T15:43:37.000Z",
      }
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

  it("keeps the workspace tutorial inactive until required setup is complete", () => {
    const boardState = buildDefaultBoardState()

    const next = applyWorkspaceTutorialActivationToSeed(
      { boardState },
      {
        initialOnboardingRequired: true,
        workspaceOnboardingActive: false,
        workspaceTutorialRequested: false,
        workspaceOnboardingCompletedAt: null,
      }
    )

    expect(next.boardState.onboardingFlow.active).toBe(false)
    expect(next.boardState.connections).toEqual(boardState.connections)
  })

  it("restarts a completed tutorial when auth metadata reactivates onboarding", () => {
    const boardState = buildDefaultBoardState()
    const completionHiddenCardIds =
      buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
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
      }
    )

    expect(next.boardState.onboardingFlow.active).toBe(true)
    expect(next.boardState.onboardingFlow.tutorialStepIndex).toBe(0)
    expect(next.boardState.onboardingFlow.openedTutorialStepIds).toEqual([])
    expect(next.boardState.onboardingFlow.acknowledgedTutorialStepIds).toEqual(
      []
    )
    expect(next.boardState.hiddenCardIds).toContain("organization-overview")
    expect(next.boardState.hiddenCardIds).toContain("accelerator")
  })
})
