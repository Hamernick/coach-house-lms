import { describe, expect, it } from "vitest"

import { buildCompletedWorkspaceTutorialBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-canvas-helpers"
import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"

describe("workspace board canvas helpers", () => {
  it("keeps the completion state focused on an organization plus accelerator cluster", () => {
    const initial = buildDefaultBoardState("balanced")
    const next = buildCompletedWorkspaceTutorialBoardState(initial)

    expect(next.onboardingFlow.active).toBe(false)
    expect(next.hiddenCardIds).not.toContain("organization-overview")
    expect(next.hiddenCardIds).not.toContain("accelerator")
    expect(
      next.connections.some(
        (connection) =>
          connection.source === "organization-overview" &&
          connection.target === "accelerator",
      ),
    ).toBe(true)

    const organization = next.nodes.find((node) => node.id === "organization-overview")
    const accelerator = next.nodes.find((node) => node.id === "accelerator")

    expect(organization).toBeTruthy()
    expect(accelerator).toBeTruthy()
    expect((accelerator?.x ?? 0)).toBeGreaterThan(organization?.x ?? 0)
  })
})
