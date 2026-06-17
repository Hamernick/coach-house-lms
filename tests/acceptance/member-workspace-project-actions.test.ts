import "./test-utils"

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetTestMocks } from "./test-utils"

const { resolveMemberWorkspaceActorContextMock } = vi.hoisted(() => ({
  resolveMemberWorkspaceActorContextMock: vi.fn(),
}))

vi.mock(
  "@/features/member-workspace/server/member-workspace-actor-context",
  () => ({
    resolveMemberWorkspaceActorContext: resolveMemberWorkspaceActorContextMock,
  })
)

import {
  createMemberWorkspaceProjectAction,
  deleteMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectAction,
} from "@/features/member-workspace/server/project-actions"
import { MEMBER_WORKSPACE_UPGRADE_MESSAGE } from "@/features/member-workspace/server/access"

describe("member workspace project actions", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveMemberWorkspaceActorContextMock.mockReset()
  })

  it("allows platform admins to create organization projects for a chosen organization", async () => {
    const organizationQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { user_id: "org-1" },
        error: null,
      }),
    }
    const insertProjectQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "project-new" },
        error: null,
      }),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "organizations") return organizationQuery
        if (table === "organization_projects") return insertProjectQuery
        throw new Error(`Unexpected table: ${table}`)
      }),
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
      })
    ).resolves.toEqual({ ok: true, id: "project-new" })

    expect(organizationQuery.maybeSingle).toHaveBeenCalled()
    expect(insertProjectQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org-1",
        project_kind: "standard",
        name: "Internal admin project",
        created_by: "platform-admin-1",
      })
    )
  })

  it("allows platform admins to update existing organization projects", async () => {
    const existingProjectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "project-1", org_id: "org-2" },
        error: null,
      }),
    }
    const updateProjectQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const existingOverviewDocumentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "overview-doc-1" },
        error: null,
      }),
    }
    const updateOverviewDocumentQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    let projectQueryCount = 0
    let overviewDocumentQueryCount = 0
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "organization_project_overview_documents") {
          overviewDocumentQueryCount += 1
          return overviewDocumentQueryCount === 1
            ? existingOverviewDocumentQuery
            : updateOverviewDocumentQuery
        }

        if (table !== "organization_projects") {
          throw new Error(`Unexpected table: ${table}`)
        }
        projectQueryCount += 1
        return projectQueryCount === 1
          ? existingProjectQuery
          : updateProjectQuery
      }),
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
        description: "Rich text stays here.",
        overviewDocumentHtml:
          "<h2>Saved overview</h2><p><strong>Rich</strong> text stays here.</p>",
        status: "active",
        priority: "high",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      })
    ).resolves.toEqual({ ok: true, id: "project-1" })

    expect(existingProjectQuery.maybeSingle).toHaveBeenCalled()
    expect(updateProjectQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Updated org project",
        description: "Rich text stays here.",
        status: "active",
        priority: "high",
        updated_by: "platform-admin-1",
      })
    )
    expect(existingOverviewDocumentQuery.maybeSingle).toHaveBeenCalled()
    expect(updateOverviewDocumentQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        document_html:
          "<h2>Saved overview</h2><p><strong>Rich</strong> text stays here.</p>",
        document_text: "## Saved overview\n\n**Rich** text stays here.",
        updated_by: "platform-admin-1",
      })
    )
    expect(updateOverviewDocumentQuery.eq).toHaveBeenCalledWith(
      "id",
      "overview-doc-1"
    )
  })

  it("rejects free users before creating organization projects", async () => {
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
      createMemberWorkspaceProjectAction({
        orgId: "org-1",
        name: "Free project",
        status: "planned",
        priority: "medium",
        startDate: "2026-04-09",
        endDate: "2026-04-10",
      })
    ).resolves.toEqual({ error: MEMBER_WORKSPACE_UPGRADE_MESSAGE })

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("allows platform admins to delete standard organization projects", async () => {
    const existingProjectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "project-1",
          org_id: "org-2",
          project_kind: "standard",
          canonical_org_id: null,
        },
        error: null,
      }),
    }
    const deleteProjectQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table !== "organization_projects") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return supabase.from.mock.calls.length === 1
          ? existingProjectQuery
          : deleteProjectQuery
      }),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase,
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      deleteMemberWorkspaceProjectAction("project-1")
    ).resolves.toEqual({ ok: true, id: "project-1" })

    expect(existingProjectQuery.maybeSingle).toHaveBeenCalled()
    expect(deleteProjectQuery.delete).toHaveBeenCalled()
    expect(deleteProjectQuery.eq).toHaveBeenCalledWith("id", "project-1")
    expect(deleteProjectQuery.eq).toHaveBeenCalledWith(
      "project_kind",
      "standard"
    )
  })

  it("rejects deletion of canonical admin organization rows", async () => {
    const existingProjectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "project-1",
          org_id: "org-2",
          project_kind: "organization_admin",
          canonical_org_id: "org-2",
        },
        error: null,
      }),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table !== "organization_projects") {
          throw new Error(`Unexpected table: ${table}`)
        }

        return existingProjectQuery
      }),
    }

    resolveMemberWorkspaceActorContextMock.mockResolvedValue({
      supabase,
      userId: "platform-admin-1",
      isAdmin: true,
      activeOrg: { orgId: "org-1", role: "owner" },
      canEdit: true,
    })

    await expect(
      deleteMemberWorkspaceProjectAction("project-1")
    ).resolves.toEqual({
      error:
        "Canonical organization records cannot be deleted from this screen.",
    })

    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it("keeps platform admin organization lists create-enabled with standard rows included", () => {
    const loaderSource = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-loaders.ts"
      ),
      "utf8"
    )

    expect(loaderSource).toContain("loadAdminStandardOrganizationProjects")
    expect(loaderSource).toContain(
      "...standardProjects.map(mapOrganizationProjectToViewModel)"
    )
    expect(loaderSource).toContain("canCreateProjects: true")
  })

  it("preserves user-authored canonical organization overview documents during sync", () => {
    const adminProjectsSource = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/admin-projects.ts"
      ),
      "utf8"
    )

    expect(adminProjectsSource).toContain(
      "const { description: _description, ...syncedFields }"
    )
    expect(adminProjectsSource).not.toContain(
      "(existing.description ?? null) !== (desired.description ?? null)"
    )
    expect(adminProjectsSource).not.toContain(
      "...buildCanonicalAdminOrganizationProjectFields(organization),\n    updated_by"
    )
  })

  it("keeps rich overview documents in a dedicated table instead of overloading project description", () => {
    const projectActionsSource = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-actions.ts"
      ),
      "utf8"
    )
    const overviewDocumentsSource = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-overview-documents.ts"
      ),
      "utf8"
    )
    const migrationSource = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260610194000_add_organization_project_overview_documents.sql"
      ),
      "utf8"
    )

    expect(projectActionsSource).toContain("upsertProjectOverviewDocument")
    expect(projectActionsSource).toContain("hasOverviewDocumentHtml")
    expect(overviewDocumentsSource).toContain(
      'from("organization_project_overview_documents")'
    )
    expect(overviewDocumentsSource).toContain("sanitizeHtml")
    expect(overviewDocumentsSource).toContain("created_by: actorId")
    expect(overviewDocumentsSource).toContain(".update({")
    expect(overviewDocumentsSource).toContain(".insert({")
    expect(migrationSource).toContain(
      "create table if not exists public.organization_project_overview_documents"
    )
    expect(migrationSource).toContain("force row level security")
    expect(migrationSource).toContain(
      "organization_project_overview_documents_project_key"
    )
  })
})
