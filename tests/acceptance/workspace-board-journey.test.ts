import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceJourneyGuideState,
  resolveWorkspaceJourneyStage,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-journey"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceSeedData,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

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
      organizationProfileComplete: false,
      teammateCount: 0,
      workspaceDocumentCount: 0,
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

const EMPTY_ACCELERATOR_STATE: WorkspaceBoardAcceleratorState = {
  activeStepId: null,
  completedStepIds: [],
}

describe("workspace board journey", () => {
  it("starts in foundation until the organization profile and teammates exist", () => {
    const stage = resolveWorkspaceJourneyStage({
      seed: buildSeed(),
      acceleratorState: EMPTY_ACCELERATOR_STATE,
      acceleratorStepNodeVisible: false,
    })

    expect(stage).toBe("foundation")
  })

  it("moves to materials once the organization foundation is ready but no documents exist", () => {
    const guide = resolveWorkspaceJourneyGuideState({
      seed: buildSeed({
        journeyReadiness: {
          organizationProfileComplete: true,
          teammateCount: 2,
          workspaceDocumentCount: 0,
        },
      }),
      acceleratorState: EMPTY_ACCELERATOR_STATE,
      acceleratorStepNodeVisible: false,
    })

    expect(guide.stage).toBe("materials")
    expect(guide.targetCardId).toBe("roadmap")
    expect(guide.primaryAction).toMatchObject({
      kind: "focus-card",
      cardId: "roadmap",
    })
  })

  it("moves to accelerator entry once materials exist but accelerator progress has not started", () => {
    const guide = resolveWorkspaceJourneyGuideState({
      seed: buildSeed({
        journeyReadiness: {
          organizationProfileComplete: true,
          teammateCount: 2,
          workspaceDocumentCount: 2,
          acceleratorStarted: false,
          acceleratorCompletedStepCount: 0,
        },
      }),
      acceleratorState: EMPTY_ACCELERATOR_STATE,
      acceleratorStepNodeVisible: false,
    })

    expect(guide.stage).toBe("accelerator-entry")
    expect(guide.targetCardId).toBe("accelerator")
    expect(guide.primaryAction.kind).toBe("open-step-node")
  })

  it("falls back to the paywall-safe accelerator route when accelerator access is unavailable", () => {
    const guide = resolveWorkspaceJourneyGuideState({
      seed: buildSeed({
        hasAcceleratorAccess: false,
        journeyReadiness: {
          organizationProfileComplete: true,
          teammateCount: 2,
          workspaceDocumentCount: 2,
        },
      }),
      acceleratorState: EMPTY_ACCELERATOR_STATE,
      acceleratorStepNodeVisible: false,
    })

    expect(guide.stage).toBe("accelerator-entry")
    expect(guide.primaryAction).toMatchObject({
      kind: "open-accelerator",
    })
  })

  it("moves to operating after the first accelerator completion and recommends the next operating card", () => {
    const guide = resolveWorkspaceJourneyGuideState({
      seed: buildSeed({
        fundingGoalCents: 500_000,
        programsCount: 2,
        journeyReadiness: {
          organizationProfileComplete: true,
          teammateCount: 3,
          workspaceDocumentCount: 2,
          acceleratorStarted: true,
          acceleratorCompletedStepCount: 1,
        },
        initialProfile: {
          brandPrimary: "#0f172a",
          brandColors: ["#0f172a"],
          boilerplate: "A complete public narrative",
        },
      }),
      acceleratorState: {
        activeStepId: "module-1:lesson",
        completedStepIds: ["module-1:lesson"],
      },
      acceleratorStepNodeVisible: false,
    })

    expect(guide.stage).toBe("operating")
    expect(guide.targetCardId).toBe("calendar")
    expect(guide.primaryAction).toMatchObject({
      kind: "focus-card",
      cardId: "calendar",
    })
  })
})
