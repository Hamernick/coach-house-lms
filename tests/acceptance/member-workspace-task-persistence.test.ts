import { beforeEach, describe, expect, it, vi } from "vitest"

const { ensureStarterProjectsForOrgMock, loadOrganizationProjectStarterIdMapMock } =
  vi.hoisted(() => ({
    ensureStarterProjectsForOrgMock: vi.fn(),
    loadOrganizationProjectStarterIdMapMock: vi.fn(),
  }))

const { loadTaskProjectScopeMock } = vi.hoisted(() => ({
  loadTaskProjectScopeMock: vi.fn(),
}))

const { buildStarterOrganizationTasksMock, buildStarterOrganizationTaskAssigneesMock } =
  vi.hoisted(() => ({
    buildStarterOrganizationTasksMock: vi.fn(),
    buildStarterOrganizationTaskAssigneesMock: vi.fn(),
  }))

vi.mock("@/features/member-workspace/server/project-persistence", () => ({
  ensureStarterProjectsForOrg: ensureStarterProjectsForOrgMock,
  loadOrganizationProjectStarterIdMap: loadOrganizationProjectStarterIdMapMock,
}))

vi.mock("@/features/member-workspace/server/task-project-scope", () => ({
  loadTaskProjectScope: loadTaskProjectScopeMock,
}))

vi.mock("@/features/member-workspace/server/task-starter-data", () => ({
  buildStarterOrganizationTasks: buildStarterOrganizationTasksMock,
  buildStarterOrganizationTaskAssignees: buildStarterOrganizationTaskAssigneesMock,
}))

import { ensureStarterTasksForOrg } from "@/features/member-workspace/server/task-persistence"

describe("member workspace task persistence", () => {
  beforeEach(() => {
    ensureStarterProjectsForOrgMock.mockReset()
    loadOrganizationProjectStarterIdMapMock.mockReset()
    loadTaskProjectScopeMock.mockReset()
    buildStarterOrganizationTasksMock.mockReset()
    buildStarterOrganizationTaskAssigneesMock.mockReset()

    ensureStarterProjectsForOrgMock.mockResolvedValue(undefined)
    loadTaskProjectScopeMock.mockResolvedValue({
      projectIds: new Set(["project-standard"]),
      projectOptions: [{ id: "project-standard", label: "Starter Project" }],
    })
    loadOrganizationProjectStarterIdMapMock.mockResolvedValue(
      new Map([["starter-project", "project-standard"]]),
    )
    buildStarterOrganizationTasksMock.mockReturnValue([
      {
        org_id: "org-1",
        project_id: "project-standard",
        title: "Seeded task",
      },
    ])
    buildStarterOrganizationTaskAssigneesMock.mockReturnValue([
      {
        org_id: "org-1",
        task_id: "task-seeded",
        user_id: "user-1",
      },
    ])
  })

  it("scopes starter-task existence checks to member-workspace projects before deciding to seed", async () => {
    const taskCountQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn(() =>
        Promise.resolve({
          count: 0,
          error: null,
        }),
      ),
    }

    const taskUpsertQuery = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [{ id: "task-seeded", starter_seed_key: "starter-project:task-1" }],
          error: null,
        }),
      ),
    }

    const assigneeUpsertQuery = {
      upsert: vi.fn(() =>
        Promise.resolve({
          error: null,
        }),
      ),
    }

    let organizationTaskCalls = 0
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "organization_tasks") {
          organizationTaskCalls += 1
          return organizationTaskCalls === 1 ? taskCountQuery : taskUpsertQuery
        }
        if (table === "organization_task_assignees") {
          return assigneeUpsertQuery
        }
        throw new Error(`Unexpected table query: ${table}`)
      }),
    }

    await expect(
      ensureStarterTasksForOrg({
        canEdit: true,
        orgId: "org-1",
        userId: "user-1",
        supabase: supabase as never,
      }),
    ).resolves.toBeUndefined()

    expect(ensureStarterProjectsForOrgMock).toHaveBeenCalledWith({
      canEdit: true,
      orgId: "org-1",
      userId: "user-1",
      supabase,
    })
    expect(loadTaskProjectScopeMock).toHaveBeenCalledWith({
      orgId: "org-1",
      supabase,
    })
    expect(taskCountQuery.in).toHaveBeenCalledWith("project_id", ["project-standard"])
    expect(taskUpsertQuery.upsert).toHaveBeenCalledTimes(1)
    expect(assigneeUpsertQuery.upsert).toHaveBeenCalledTimes(1)
  })
})
