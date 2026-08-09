import "./test-utils"

import { readFileSync } from "node:fs"
import { join } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import { transitionOrganizationProjectCreation } from "@/features/member-workspace/server/project-transition-support"

const project = {
  end_date: "2026-09-30",
  name: "Community kitchen",
  priority: "high",
  start_date: "2026-09-01",
  status: "planned",
}

describe("member workspace project transitions", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("creates the project and overview through one service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { ok: true, projectId: "project-1" },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      transitionOrganizationProjectCreation({
        actorId: "owner-1",
        hasOverviewDocument: true,
        orgId: "org-1",
        overviewDocumentHtml: "<p>Overview</p>",
        overviewDocumentText: "Overview",
        project,
      })
    ).resolves.toEqual({ ok: true, projectId: "project-1" })

    expect(rpc).toHaveBeenCalledWith("create_organization_project_transition", {
      p_actor_id: "owner-1",
      p_has_overview_document: true,
      p_org_id: "org-1",
      p_overview_document_html: "<p>Overview</p>",
      p_overview_document_text: "Overview",
      p_project: project,
    })
  })

  it("returns the migration instruction when the transition is unavailable", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST202" },
      }),
    })

    await expect(
      transitionOrganizationProjectCreation({
        actorId: "owner-1",
        hasOverviewDocument: false,
        orgId: "org-1",
        overviewDocumentHtml: null,
        overviewDocumentText: null,
        project,
      })
    ).resolves.toEqual({
      error:
        "Organizations are not available until the latest workspace database migrations are applied.",
    })
  })

  it("commits the project and optional overview in one restricted transaction", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806003000_atomic_organization_project_creation.sql"
      ),
      "utf8"
    )

    expect(sql).toContain("for key share;")
    expect(sql).toContain("insert into public.organization_projects")
    expect(sql).toContain(
      "insert into public.organization_project_overview_documents"
    )
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("routes project creation through the atomic transition", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-actions.ts"
      ),
      "utf8"
    )
    const createSource = source.split(
      "export async function updateMemberWorkspaceProjectAction"
    )[0]

    expect(createSource).toContain("transitionOrganizationProjectCreation")
    expect(createSource).toContain("buildProjectOverviewDocumentContent")
    expect(createSource).not.toContain(
      '.from("organization_projects")\n    .insert('
    )
  })
})
