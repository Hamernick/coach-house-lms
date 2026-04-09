import { beforeEach, describe, expect, it, vi } from "vitest"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

const { loadAdminOrganizationSummariesMock } = vi.hoisted(() => ({
  loadAdminOrganizationSummariesMock: vi.fn(),
}))

const { ensureCanonicalAdminProjectsMock } = vi.hoisted(() => ({
  ensureCanonicalAdminProjectsMock: vi.fn(),
}))

const { loadAccessibleOrganizationsMock } = vi.hoisted(() => ({
  loadAccessibleOrganizationsMock: vi.fn(),
}))

const { loadMemberWorkspacePersonOptionsForOrganizationsMock } = vi.hoisted(() => ({
  loadMemberWorkspacePersonOptionsForOrganizationsMock: vi.fn(),
}))

vi.mock("@/features/member-workspace/server/member-workspace-actor-context", () => ({
  resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
}))

vi.mock("@/features/member-workspace/server/admin-organization-overview", () => ({
  loadAdminOrganizationSummaries: loadAdminOrganizationSummariesMock,
  mapAdminOrganizationSummaryToProject: (organization: {
    orgId: string
    name: string
    setupProgress: number
    missingSetupCount: number
    tags: string[]
    members: Array<{ name: string }>
    publicSlug: string | null
    isPublic: boolean
    organizationStatus: string
    createdAt: string
  }) => ({
    id: organization.orgId,
    name: organization.name,
    taskCount: organization.missingSetupCount,
    progress: organization.setupProgress,
    startDate: new Date(organization.createdAt),
    endDate: new Date(organization.createdAt),
    status: "active",
    priority: "medium",
    tags: organization.tags,
    members: organization.members.map((member) => member.name),
    client: organization.publicSlug,
    typeLabel: organization.organizationStatus,
    durationLabel: null,
    tasks: [],
  }),
}))

vi.mock("@/features/member-workspace/server/admin-projects", () => ({
  ensureCanonicalAdminProjects: ensureCanonicalAdminProjectsMock,
  attachCanonicalProjectIdsToOrganizations: ({
    organizations,
  }: {
    organizations: Array<Record<string, unknown>>
  }) => organizations,
}))

vi.mock("@/features/member-workspace/server/load-accessible-organizations", () => ({
  loadAccessibleOrganizations: loadAccessibleOrganizationsMock,
}))

vi.mock("@/features/member-workspace/server/person-options", () => ({
  loadMemberWorkspacePersonOptionsForOrganizations:
    loadMemberWorkspacePersonOptionsForOrganizationsMock,
}))

import { loadMemberWorkspaceProjectsPage } from "@/features/member-workspace/server/project-loaders"
import { loadMemberWorkspaceTasksPage } from "@/features/member-workspace/server/task-loaders"

const missingProjectsTableError = {
  code: "PGRST205",
  message:
    "Could not find the table 'public.organization_projects' in the schema cache",
}

const missingTasksTableError = {
  code: "42P01",
  message: 'relation "organization_tasks" does not exist',
}

function createProjectsMissingTableSupabase() {
  let projectCalls = 0

  const projectCountQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn(() =>
      Promise.resolve({
        count: null,
        error: missingProjectsTableError,
      }),
    ),
  }

  const projectListQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    returns: vi.fn(() =>
      Promise.resolve({
        data: null,
        error: missingProjectsTableError,
      }),
    ),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === "organization_projects") {
        projectCalls += 1
        return projectCalls === 1 ? projectCountQuery : projectListQuery
      }

      throw new Error(`Unexpected table query: ${table}`)
    }),
  }
}

function createTasksMissingTableSupabase() {
  let taskCalls = 0

  const starterTaskCountQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn(() =>
      Promise.resolve({
        count: null,
        error: missingTasksTableError,
      }),
    ),
  }

  const taskCountQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    returns: vi.fn(() =>
      Promise.resolve({
        data: null,
        error: missingTasksTableError,
      }),
    ),
  }

  const assigneeQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    returns: vi.fn(() =>
      Promise.resolve({
        data: null,
        error: {
          code: "42P01",
          message: 'relation "organization_task_assignees" does not exist',
        },
      }),
    ),
  }

  const projectOptionsQuery = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    returns: vi.fn(() =>
      Promise.resolve({
        data: [],
        error: null,
      }),
    ),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === "organization_projects") {
        return projectOptionsQuery
      }
      if (table === "organization_tasks") {
        taskCalls += 1
        return taskCalls === 1 ? starterTaskCountQuery : taskCountQuery
      }
      if (table === "organization_task_assignees") {
        return assigneeQuery
      }

      throw new Error(`Unexpected table query: ${table}`)
    }),
  }
}

describe("member workspace loaders", () => {
  beforeEach(() => {
    resolveMemberWorkspaceActorContextMock.mockReset()
    loadAdminOrganizationSummariesMock.mockReset()
    ensureCanonicalAdminProjectsMock.mockReset()
    loadAccessibleOrganizationsMock.mockReset()
    loadMemberWorkspacePersonOptionsForOrganizationsMock.mockReset()
    loadMemberWorkspacePersonOptionsForOrganizationsMock.mockResolvedValue([])
  })

  it("returns an empty projects state when member workspace project tables are missing", async () => {
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: createProjectsMissingTableSupabase(),
      userId: "user-1",
      activeOrg: { orgId: "org-1", role: "owner" },
      isAdmin: false,
      canEdit: true,
    })
    loadAccessibleOrganizationsMock.mockResolvedValue([
      { orgId: "org-1", name: "Org One", role: "owner", publicSlug: "org-one" },
    ])

    await expect(loadMemberWorkspaceProjectsPage()).resolves.toEqual({
      projects: [],
      storageMode: "empty",
      starterProjectCount: 0,
      hasUserProjects: false,
      canResetStarterData: false,
      canCreateProjects: true,
      scope: "organization",
      organizationOptions: [{ orgId: "org-1", name: "Org One" }],
      assigneeOptions: [],
    })
  })

  it("returns a global admin projects state for platform admins", async () => {
    loadAdminOrganizationSummariesMock.mockResolvedValue([
      {
        orgId: "org-1",
        canonicalProjectId: null,
        name: "Community Builders",
        setupProgress: 68,
        missingSetupCount: 2,
        tags: ["organization", "approved"],
        members: [{ name: "Paula" }],
        publicSlug: "community-builders",
        isPublic: true,
        organizationStatus: "approved",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ])
    ensureCanonicalAdminProjectsMock.mockResolvedValue([
      {
        id: "project-1",
        org_id: "org-1",
        canonical_org_id: "org-1",
        project_kind: "organization_admin",
        name: "Community Builders",
        status: "active",
        priority: "medium",
        progress: 68,
        start_date: "2026-01-01",
        end_date: "2026-01-15",
        client_name: "community-builders",
        type_label: "approved",
        duration_label: null,
        tags: ["organization", "approved"],
        member_labels: ["Paula"],
        task_count: 2,
        created_source: "system",
        starter_seed_key: null,
        starter_seed_version: null,
        created_by: "org-1",
        updated_by: "org-1",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ])

    const adminProjectsQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "project-1",
              org_id: "org-1",
              canonical_org_id: "org-1",
              project_kind: "organization_admin",
              name: "Community Builders",
              status: "active",
              priority: "medium",
              progress: 68,
              start_date: "2026-01-01",
              end_date: "2026-01-15",
              client_name: "community-builders",
              type_label: "approved",
              duration_label: null,
              tags: ["organization", "approved"],
              member_labels: ["Paula"],
              task_count: 2,
              created_source: "system",
              starter_seed_key: null,
              starter_seed_version: null,
              created_by: "org-1",
              updated_by: "org-1",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
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
            return adminProjectsQuery
          }
          throw new Error(`Unexpected table query: ${table}`)
        }),
      },
      userId: "admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(loadMemberWorkspaceProjectsPage()).resolves.toMatchObject({
      storageMode: "custom",
      starterProjectCount: 0,
      hasUserProjects: true,
      canResetStarterData: false,
      canCreateProjects: true,
      scope: "platform-admin",
      organizationOptions: [{ orgId: "org-1", name: "Community Builders" }],
      assigneeOptions: [],
      projects: [
        expect.objectContaining({
          id: "project-1",
          name: "Community Builders",
        }),
      ],
    })
  })

  it("returns an empty tasks state when member workspace task tables are missing", async () => {
    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase: createTasksMissingTableSupabase(),
      userId: "user-1",
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(loadMemberWorkspaceTasksPage()).resolves.toEqual({
      taskGroups: [],
      storageMode: "empty",
      starterTaskCount: 0,
      hasAnyOrgTasks: false,
      canResetStarterData: false,
      canManageTasks: true,
      scope: "organization",
      assigneeOptions: [],
      projectOptions: [],
    })
  })
})
