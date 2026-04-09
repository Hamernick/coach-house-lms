import { describe, expect, it } from "vitest"

import { resolveWorkspaceJourneyGuideState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-journey"
import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import { resolveWorkspaceTutorialCompletionExitRequest } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-helpers"
import { buildCompletedWorkspaceTutorialBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-onboarding-flow"
import type { WorkspaceSeedData } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

function buildSeed(
  overrides?: Omit<Partial<WorkspaceSeedData>, "journeyReadiness" | "initialProfile" | "calendar"> & {
    journeyReadiness?: Partial<WorkspaceSeedData["journeyReadiness"]>
    initialProfile?: Partial<WorkspaceSeedData["initialProfile"]>
    calendar?: Partial<WorkspaceSeedData["calendar"]>
  },
) {
  return {
    hasAcceleratorAccess: true,
    fundingGoalCents: 0,
    programsCount: 0,
    journeyReadiness: {
      organizationProfileComplete: true,
      teammateCount: 2,
      workspaceDocumentCount: 1,
      acceleratorStarted: false,
      acceleratorCompletedStepCount: 0,
      ...(overrides?.journeyReadiness ?? {}),
    },
    initialProfile: {
      brandPrimary: null,
      brandColors: [],
      boilerplate: null,
      ...(overrides?.initialProfile ?? {}),
    },
    calendar: {
      nextEvent: null,
      upcomingEvents: [],
      ...(overrides?.calendar ?? {}),
    },
    ...(overrides ?? {}),
  } as unknown as WorkspaceSeedData
}

describe("workspace board canvas helpers", () => {
  it("lands the completion state on the connected workspace graph", () => {
    const initial = buildDefaultBoardState("balanced")
    const next = buildCompletedWorkspaceTutorialBoardState(initial)

    expect(next.onboardingFlow.active).toBe(false)
    expect(next.autoLayoutMode).toBe("dagre-tree")
    expect(next.onboardingFlow.openedTutorialStepIds).toEqual([])
    expect(next.onboardingFlow.acknowledgedTutorialStepIds).toEqual([])
    expect(next.hiddenCardIds).not.toContain("organization-overview")
    expect(next.hiddenCardIds).not.toContain("programs")
    expect(next.hiddenCardIds).not.toContain("roadmap")
    expect(next.hiddenCardIds).not.toContain("accelerator")
    expect(next.hiddenCardIds).toContain("calendar")
    expect(next.hiddenCardIds).toContain("economic-engine")
    expect(next.hiddenCardIds).toContain("communications")
    expect(
      next.connections.some(
        (connection) =>
          connection.source === "organization-overview" &&
          connection.target === "programs",
      ),
    ).toBe(true)
    expect(
      next.connections.some(
        (connection) =>
          connection.source === "organization-overview" &&
          connection.target === "roadmap",
      ),
    ).toBe(true)
    expect(
      next.connections.some(
        (connection) =>
          connection.source === "roadmap" &&
          connection.target === "accelerator",
      ),
    ).toBe(true)
    expect(
      next.connections.some(
        (connection) =>
          connection.source === "accelerator" &&
          connection.target === "calendar",
      ),
    ).toBe(true)

    const organization = next.nodes.find((node) => node.id === "organization-overview")
    const programs = next.nodes.find((node) => node.id === "programs")
    const roadmap = next.nodes.find((node) => node.id === "roadmap")
    const accelerator = next.nodes.find((node) => node.id === "accelerator")
    const calendar = next.nodes.find((node) => node.id === "calendar")

    expect(organization).toBeTruthy()
    expect(programs).toBeTruthy()
    expect(roadmap).toBeTruthy()
    expect(accelerator).toBeTruthy()
    expect(calendar).toBeTruthy()
    expect(accelerator?.size).toBe("sm")
    expect((roadmap?.x ?? 0)).toBeLessThan(organization?.x ?? 0)
    expect((roadmap?.x ?? 0)).toBeLessThan(accelerator?.x ?? 0)
    expect((accelerator?.x ?? 0)).toBeLessThan(organization?.x ?? 0)
    expect((organization?.x ?? 0)).toBeLessThan(programs?.x ?? 0)
    expect((programs?.y ?? 0)).toBe(organization?.y ?? 0)
    expect((calendar?.x ?? 0)).toBeGreaterThanOrEqual(programs?.x ?? 0)
  })

  it("resolves one explicit completion exit request from the completed board state", () => {
    const seed = buildSeed()
    const timelineBoardState = {
      ...buildDefaultBoardState("balanced"),
      autoLayoutMode: "timeline" as const,
    }
    const nextTimelineBoardState =
      buildCompletedWorkspaceTutorialBoardState(timelineBoardState)
    const journeyGuideState = resolveWorkspaceJourneyGuideState({
      seed,
      acceleratorState: timelineBoardState.accelerator,
      acceleratorStepNodeVisible: false,
    })

    expect(
      resolveWorkspaceTutorialCompletionExitRequest({
        boardState: nextTimelineBoardState,
        targetCardId: journeyGuideState.targetCardId,
        requestKey: 7,
      }),
    ).toEqual({
      kind: "fit-visible",
      requestKey: 7,
    })

    const dagreBoardState = {
      ...buildDefaultBoardState("balanced"),
      autoLayoutMode: "dagre-tree" as const,
    }
    const nextDagreBoardState =
      buildCompletedWorkspaceTutorialBoardState(dagreBoardState)

    expect(
      resolveWorkspaceTutorialCompletionExitRequest({
        boardState: nextDagreBoardState,
        targetCardId: journeyGuideState.targetCardId,
        requestKey: 8,
      }),
    ).toEqual({
      kind: "fit-visible",
      requestKey: 8,
    })
  })
})
