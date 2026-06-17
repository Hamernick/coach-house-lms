import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { redirectMock, resetTestMocks } from "./test-utils"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

vi.mock("@/features/member-workspace/server/member-workspace-actor-context", () => ({
  resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
}))

import {
  actorHasMemberWorkspaceAccess,
  requireMemberWorkspacePageAccess,
} from "@/features/member-workspace/server/access"

describe("member workspace access", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveMemberWorkspaceActorContextMock.mockReset()
  })

  it("redirects free users away from project and task routes", async () => {
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      isAdmin: false,
      hasMemberWorkspaceAccess: false,
    })

    await expect(requireMemberWorkspacePageAccess("tasks")).rejects.toThrow(
      "redirect:/workspace?paywall=organization&plan=organization&upgrade=member-workspace-access&source=tasks",
    )

    expect(redirectMock).toHaveBeenCalledWith(
      "/workspace?paywall=organization&plan=organization&upgrade=member-workspace-access&source=tasks",
    )
  })

  it("treats platform admins as having member workspace access", () => {
    expect(
      actorHasMemberWorkspaceAccess({
        isAdmin: true,
        hasMemberWorkspaceAccess: false,
      }),
    ).toBe(true)
  })
})
