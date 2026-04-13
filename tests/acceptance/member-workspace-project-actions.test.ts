import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetTestMocks } from "./test-utils"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

vi.mock("@/features/member-workspace/server/member-workspace-actor-context", () => ({
  resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
}))

import {
  createMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectAction,
} from "@/features/member-workspace/server/project-actions"

describe("member workspace project actions", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveMemberWorkspaceActorContextMock.mockReset()
  })

  it("rejects platform admins when they try to create organization projects", async () => {
    const supabase = {
      from: vi.fn(),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase,
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      createMemberWorkspaceProjectAction({
        orgId: "org-1",
        name: "Internal admin project",
        status: "planned",
        priority: "medium",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      }),
    ).resolves.toEqual({
      error: "Platform admins can view organization projects here, but cannot edit them.",
    })

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("rejects platform admins when they try to update organization projects", async () => {
    const supabase = {
      from: vi.fn(),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase,
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      updateMemberWorkspaceProjectAction("project-1", {
        name: "Updated org project",
        status: "active",
        priority: "high",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      }),
    ).resolves.toEqual({
      error: "Platform admins can view organization projects here, but cannot edit them.",
    })

    expect(supabase.from).not.toHaveBeenCalled()
  })
})
