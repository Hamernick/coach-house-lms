import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { revalidatePathMock, resetTestMocks } from "./test-utils"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock(
  "@/features/member-workspace/server/member-workspace-actor-context",
  () => ({
    resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
  })
)

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import {
  createMemberWorkspaceTaskAction,
  deleteMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskOrderAction,
  updateMemberWorkspaceTaskStatusAction,
} from "@/features/member-workspace/server/task-actions"
import { MEMBER_WORKSPACE_UPGRADE_MESSAGE } from "@/features/member-workspace/server/access"

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
      })
    ),
  }
}

describe("member workspace task actions", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveMemberWorkspaceActorContextMock.mockReset()
    createSupabaseAdminClientMock.mockReset()
  })

  it("validates the target project before a platform-admin task mutation", async () => {
    const projectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
    }
    const supabase = {
      from: vi.fn(() => projectQuery),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase,
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: false,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-standard",
        title: "Internal follow-up",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      })
    ).resolves.toEqual({ error: "Choose a valid project." })

    expect(supabase.from).toHaveBeenCalledWith("organization_projects")
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it("rejects free users before creating organization tasks", async () => {
    const supabase = {
      from: vi.fn(),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase,
      userId: "free-user-1",
      isAdmin: false,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
      hasMemberWorkspaceAccess: false,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-standard",
        title: "Free task",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      })
    ).resolves.toEqual({ error: MEMBER_WORKSPACE_UPGRADE_MESSAGE })

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
      hasMemberWorkspaceAccess: true,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-admin",
        title: "Wire project summary",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      })
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
        })
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
      hasMemberWorkspaceAccess: true,
    })

    await expect(
      updateMemberWorkspaceTaskAction("task-1", {
        projectId: "project-admin",
        title: "Wire project summary",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      })
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
        })
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
        })
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
        })
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
      hasMemberWorkspaceAccess: true,
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-standard",
        title: "Review grant timeline",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
        assigneeUserId: "platform-admin-2",
      })
    ).resolves.toEqual({
      error: "Choose a valid assignee.",
    })

    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it("allows platform admins to create tasks on canonical organization workstreams", async () => {
    const projectQuery = createProjectQuery({
      id: "project-organization",
      org_id: "org-1",
      task_count: 3,
      project_kind: "organization_admin",
      created_source: "system",
    })

    const organizationsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [{ user_id: "org-1" }],
          error: null,
        })
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
        })
      ),
    }

    const platformStaffQuery = {
      select: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              user_id: "platform-admin-1",
              access_level: "developer",
            },
            {
              user_id: "platform-admin-2",
              access_level: "coach",
            },
          ],
          error: null,
        })
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
        })
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
          if (table === "platform_staff_members") return platformStaffQuery
          if (table === "profiles") return profilesByIdQuery
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: false,
    })

    const taskInsertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(() =>
        Promise.resolve({ data: { id: "task-admin-created" }, error: null })
      ),
    }
    const assigneeMutationQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    }
    const projectUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "organization_tasks") return taskInsertQuery
        if (table === "organization_task_assignees") {
          return assigneeMutationQuery
        }
        if (table === "organization_projects") return projectUpdateQuery
        throw new Error(`Unexpected admin table query: ${table}`)
      }),
    })

    await expect(
      createMemberWorkspaceTaskAction({
        projectId: "project-organization",
        title: "Review grant timeline",
        status: "todo",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
        assigneeUserId: "platform-admin-2",
      })
    ).resolves.toEqual({ ok: true, taskId: "task-admin-created" })

    expect(taskInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org-1",
        project_id: "project-organization",
        created_by: "platform-admin-1",
      })
    )
    expect(assigneeMutationQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        task_id: "task-admin-created",
        user_id: "platform-admin-2",
      })
    )
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
        })
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
        })
      ),
    }

    const projectUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    const actorProjectQuery = createProjectQuery({
      id: "project-standard",
      org_id: "org-1",
      task_count: 2,
      project_kind: "standard",
      created_source: "user",
    })

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_tasks") {
            return taskQuery
          }
          if (table === "organization_projects") {
            return actorProjectQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: false,
      hasMemberWorkspaceAccess: true,
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
      updated_by: "platform-admin-1",
    })
    expect(revalidatePathMock).toHaveBeenCalledWith("/tasks")
    expect(revalidatePathMock).toHaveBeenCalledWith("/organizations")
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/organizations/project-standard"
    )
  })

  it("allows platform admins to change task status for a real project", async () => {
    const taskQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: {
            id: "task-1",
            org_id: "org-2",
            project_id: "project-2",
            status: "todo",
          },
          error: null,
        })
      ),
    }
    const projectQuery = createProjectQuery({
      id: "project-2",
      org_id: "org-2",
      task_count: 1,
      project_kind: "standard",
      created_source: "user",
    })
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_tasks") return taskQuery
          if (table === "organization_projects") return projectQuery
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "admin-active-org", role: "member" },
      canEdit: false,
    })

    const taskUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => taskUpdateQuery),
    })

    await expect(
      updateMemberWorkspaceTaskStatusAction("task-1", "done")
    ).resolves.toEqual({ ok: true, taskId: "task-1", status: "done" })

    expect(taskUpdateQuery.update).toHaveBeenCalledWith({
      status: "done",
      updated_by: "platform-admin-1",
    })
  })

  it("allows platform admins to update task details for a real project", async () => {
    const existingTaskQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: {
            id: "task-1",
            org_id: "org-2",
            project_id: "project-2",
          },
          error: null,
        })
      ),
    }
    const projectQuery = createProjectQuery({
      id: "project-2",
      org_id: "org-2",
      task_count: 1,
      project_kind: "standard",
      created_source: "user",
    })
    const organizationsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({ data: [{ user_id: "org-2" }], error: null })
      ),
    }
    const membershipsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }
    const platformStaffQuery = {
      select: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              user_id: "platform-admin-1",
              access_level: "developer",
            },
          ],
          error: null,
        })
      ),
    }
    const profilesByIdQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "org-2",
              full_name: "Owner Person",
              avatar_url: null,
              email: "owner@example.com",
              role: "member",
            },
            {
              id: "platform-admin-1",
              full_name: "Alex Admin",
              avatar_url: null,
              email: "alex.admin@example.com",
              role: "admin",
            },
          ],
          error: null,
        })
      ),
    }
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "organization_tasks") return existingTaskQuery
          if (table === "organization_projects") return projectQuery
          if (table === "organizations") return organizationsQuery
          if (table === "organization_memberships") return membershipsQuery
          if (table === "platform_staff_members") return platformStaffQuery
          if (table === "profiles") return profilesByIdQuery
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "admin-active-org", role: "member" },
      canEdit: false,
    })

    const taskUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    const assigneeMutationQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    }
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "organization_tasks") return taskUpdateQuery
        if (table === "organization_task_assignees") {
          return assigneeMutationQuery
        }
        throw new Error(`Unexpected admin table query: ${table}`)
      }),
    })

    await expect(
      updateMemberWorkspaceTaskAction("task-1", {
        projectId: "project-2",
        title: "Updated by Coach House",
        status: "in-progress",
        startDate: "2026-04-09",
        endDate: "2026-04-12",
      })
    ).resolves.toEqual({ ok: true, taskId: "task-1" })

    expect(taskUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Updated by Coach House",
        org_id: "org-2",
        project_id: "project-2",
        updated_by: "platform-admin-1",
      })
    )
  })

  it("allows platform admins to reorder every task in a real project", async () => {
    const projectQuery = createProjectQuery({
      id: "project-2",
      org_id: "org-2",
      task_count: 2,
      project_kind: "standard",
      created_source: "user",
    })
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn(() => projectQuery),
      },
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "admin-active-org", role: "member" },
      canEdit: false,
    })

    const taskRowsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [{ id: "task-1" }, { id: "task-2" }],
          error: null,
        })
      ),
    }
    const taskUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    let taskTableCalls = 0
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => {
        taskTableCalls += 1
        return taskTableCalls === 1 ? taskRowsQuery : taskUpdateQuery
      }),
    })

    await expect(
      updateMemberWorkspaceTaskOrderAction("project-2", ["task-2", "task-1"])
    ).resolves.toEqual({ ok: true, projectId: "project-2" })

    expect(taskUpdateQuery.update).toHaveBeenNthCalledWith(1, {
      sort_order: 0,
      updated_by: "platform-admin-1",
    })
    expect(taskUpdateQuery.update).toHaveBeenNthCalledWith(2, {
      sort_order: 1,
      updated_by: "platform-admin-1",
    })
  })
})
