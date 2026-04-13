import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { revalidatePathMock, resetTestMocks } from "./test-utils"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

vi.mock("@/features/member-workspace/server/member-workspace-actor-context", () => ({
  resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
}))

import { clearMemberWorkspaceStarterDataAction } from "@/features/member-workspace/server/project-actions"

describe("member workspace starter-data actions", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveMemberWorkspaceActorContextMock.mockReset()
  })

  it("clears only starter-seeded demo data and revalidates the projects and tasks surfaces", async () => {
    const starterStateUpsert = vi.fn(() =>
      Promise.resolve({
        error: null,
      }),
    )
    const taskDeleteEqSource = vi.fn(() =>
      Promise.resolve({
        error: null,
      }),
    )
    const taskDeleteEqOrg = vi.fn().mockReturnValue({
      eq: taskDeleteEqSource,
    })
    const projectDeleteEqSource = vi.fn(() =>
      Promise.resolve({
        error: null,
      }),
    )
    const projectDeleteEqKind = vi.fn().mockReturnValue({
      eq: projectDeleteEqSource,
    })
    const projectDeleteEqOrg = vi.fn().mockReturnValue({
      eq: projectDeleteEqKind,
    })

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_workspace_starter_state") {
            return {
              upsert: starterStateUpsert,
            }
          }
          if (table === "organization_tasks") {
            return {
              delete: vi.fn(() => ({
                eq: taskDeleteEqOrg,
              })),
            }
          }
          if (table === "organization_projects") {
            return {
              delete: vi.fn(() => ({
                eq: projectDeleteEqOrg,
              })),
            }
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "user-1",
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(clearMemberWorkspaceStarterDataAction()).resolves.toEqual({
      ok: true,
    })

    expect(starterStateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org-1",
        updated_by: "user-1",
        last_reset_at: expect.any(String),
      }),
      { onConflict: "org_id" },
    )
    expect(taskDeleteEqOrg).toHaveBeenCalledWith("org_id", "org-1")
    expect(taskDeleteEqSource).toHaveBeenCalledWith("created_source", "starter_seed")
    expect(projectDeleteEqOrg).toHaveBeenCalledWith("org_id", "org-1")
    expect(projectDeleteEqKind).toHaveBeenCalledWith("project_kind", "standard")
    expect(projectDeleteEqSource).toHaveBeenCalledWith("created_source", "starter_seed")
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects")
    expect(revalidatePathMock).toHaveBeenCalledWith("/my-tasks")
  })

  it("rejects non-editors", async () => {
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      canEdit: false,
    })

    await expect(clearMemberWorkspaceStarterDataAction()).resolves.toEqual({
      error: "Only organization editors can clear demo data.",
    })
  })
})
