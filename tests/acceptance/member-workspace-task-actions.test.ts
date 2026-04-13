import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { revalidatePathMock, resetTestMocks } from "./test-utils"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock("@/features/member-workspace/server/member-workspace-actor-context", () => ({
  resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import {
  createMemberWorkspaceTaskAction,
  deleteMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskAction,
} from "@/features/member-workspace/server/task-actions"

function createProjectQuery(project: {
  id: string
  org_id: string
  task_count: number
  project_kind: string
  created_source: string
}) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() =>
      Promise.resolve({
        data: project,
        error: null,
      }),
    ),
  }
}

describe("member workspace task actions", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveMemberWorkspaceActorContextMock.mockReset()
    createSupabaseAdminClientMock.mockReset()
  })

  it("rejects platform admins when they try to create organization tasks", async () => {
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
      createMemberWorkspaceTaskAction({
        projectId: "project-standard",
        title: "Internal follow-up",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      }),
    ).resolves.toEqual({
      error: "Platform admins can view organization tasks here, but cannot edit them.",
    })

    expect(supabase.from).not.toHaveBeenCalled()
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it("rejects non-standard system projects when org members create tasks", async () => {
    const projectQuery = createProjectQuery({
      id: "project-admin",
      org_id: "org-1",
      task_count: 3,
      project_kind: "organization_admin",
      created_source: "system",
    })

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_projects") {
            return projectQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "user-1",
      isAdmin: false,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-admin",
        title: "Wire project summary",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      }),
    ).resolves.toEqual({
      error: "Choose a valid project.",
    })

    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("rejects non-standard system projects when org members retarget existing tasks", async () => {
    const existingTaskQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: {
            id: "task-1",
            org_id: "org-1",
            project_id: "project-standard",
          },
          error: null,
        }),
      ),
    }

    const projectQuery = createProjectQuery({
      id: "project-admin",
      org_id: "org-1",
      task_count: 3,
      project_kind: "organization_admin",
      created_source: "system",
    })

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_tasks") {
            return existingTaskQuery
          }
          if (table === "organization_projects") {
            return projectQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "user-1",
      isAdmin: false,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      updateMemberWorkspaceTaskAction("task-1", {
        projectId: "project-admin",
        title: "Wire project summary",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      }),
    ).resolves.toEqual({
      error: "Choose a valid project.",
    })

    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("rejects platform-admin assignees for organization editors when they are not part of the org team", async () => {
    const projectQuery = createProjectQuery({
      id: "project-standard",
      org_id: "org-1",
      task_count: 3,
      project_kind: "standard",
      created_source: "user",
    })

    const organizationsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [{ user_id: "org-1" }],
          error: null,
        }),
      ),
    }

    const membershipsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              org_id: "org-1",
              member_id: "staff-1",
              member_email: "staff@example.com",
              role: "staff",
            },
          ],
          error: null,
        }),
      ),
    }

    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "org-1",
              full_name: "Owner Person",
              avatar_url: null,
              email: "owner@example.com",
              role: "member",
            },
            {
              id: "staff-1",
              full_name: "Staff Person",
              avatar_url: null,
              email: "staff@example.com",
              role: "member",
            },
          ],
          error: null,
        }),
      ),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_projects") {
            return projectQuery
          }
          if (table === "organizations") {
            return organizationsQuery
          }
          if (table === "organization_memberships") {
            return membershipsQuery
          }
          if (table === "profiles") {
            return profilesQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "owner-1",
      isAdmin: false,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-standard",
        title: "Review grant timeline",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
        assigneeUserId: "platform-admin-2",
      }),
    ).resolves.toEqual({
      error: "Choose a valid assignee.",
    })

    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it("rejects platform admins even when they try to assign other platform admins", async () => {
    const projectQuery = createProjectQuery({
      id: "project-standard",
      org_id: "org-1",
      task_count: 3,
      project_kind: "standard",
      created_source: "user",
    })

    const organizationsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [{ user_id: "org-1" }],
          error: null,
        }),
      ),
    }

    const membershipsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              org_id: "org-1",
              member_id: "staff-1",
              member_email: "staff@example.com",
              role: "staff",
            },
          ],
          error: null,
        }),
      ),
    }

    const platformAdminsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "platform-admin-1",
              full_name: "Alex Admin",
              avatar_url: null,
              email: "alex.admin@example.com",
              role: "admin",
            },
            {
              id: "platform-admin-2",
              full_name: "Paula Admin",
              avatar_url: null,
              email: "paula.admin@example.com",
              role: "admin",
            },
          ],
          error: null,
        }),
      ),
    }

    const profilesByIdQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "org-1",
              full_name: "Owner Person",
              avatar_url: null,
              email: "owner@example.com",
              role: "member",
            },
            {
              id: "staff-1",
              full_name: "Staff Person",
              avatar_url: null,
              email: "staff@example.com",
              role: "member",
            },
            {
              id: "platform-admin-1",
              full_name: "Alex Admin",
              avatar_url: null,
              email: "alex.admin@example.com",
              role: "admin",
            },
            {
              id: "platform-admin-2",
              full_name: "Paula Admin",
              avatar_url: null,
              email: "paula.admin@example.com",
              role: "admin",
            },
          ],
          error: null,
        }),
      ),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_projects") {
            return projectQuery
          }
          if (table === "organizations") {
            return organizationsQuery
          }
          if (table === "organization_memberships") {
            return membershipsQuery
          }
          if (table === "profiles") {
            return platformAdminsQuery.select.mock.calls.length === 0
              ? platformAdminsQuery
              : profilesByIdQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-standard",
        title: "Review grant timeline",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
        assigneeUserId: "platform-admin-2",
      }),
    ).resolves.toEqual({
      error: "Platform admins can view organization tasks here, but cannot edit them.",
    })

    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it("deletes a task and revalidates the project surfaces", async () => {
    const taskQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: {
            id: "task-1",
            org_id: "org-1",
            project_id: "project-standard",
          },
          error: null,
        }),
      ),
    }

    const assigneeDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    const taskDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    const projectSelectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: {
            id: "project-standard",
            org_id: "org-1",
            task_count: 2,
          },
          error: null,
        }),
      ),
    }

    const projectUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_tasks") {
            return taskQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "user-1",
      isAdmin: false,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "organization_task_assignees") {
          return assigneeDeleteQuery
        }
        if (table === "organization_tasks") {
          return taskDeleteQuery
        }
        if (table === "organization_projects") {
          return projectSelectQuery.select.mock.calls.length === 0
            ? projectSelectQuery
            : projectUpdateQuery
        }
        throw new Error(`Unexpected admin table query: ${table}`)
      }),
    })

    await expect(deleteMemberWorkspaceTaskAction("task-1")).resolves.toEqual({
      ok: true,
      taskId: "task-1",
      projectId: "project-standard",
    })

    expect(assigneeDeleteQuery.delete).toHaveBeenCalledTimes(1)
    expect(taskDeleteQuery.delete).toHaveBeenCalledTimes(1)
    expect(projectUpdateQuery.update).toHaveBeenCalledWith({
      task_count: 1,
      updated_by: "user-1",
    })
    expect(revalidatePathMock).toHaveBeenCalledWith("/my-tasks")
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects")
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects/project-standard")
  })
})
