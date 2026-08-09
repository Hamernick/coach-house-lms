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

import { transitionOrganizationProjectUpdate } from "@/features/member-workspace/server/project-transition-support"

const UPDATED_AT = "2026-08-06T00:20:00.000Z"
const input = {
  actorId: "owner-1",
  expectedOrgId: "org-1",
  expectedUpdatedAt: UPDATED_AT,
  hasOverviewDocument: true,
  overviewDocumentHtml: "<p>Updated overview</p>",
  overviewDocumentText: "Updated overview",
  project: {
    end_date: "2026-09-30",
    name: "Community kitchen",
    priority: "high",
    start_date: "2026-09-01",
    status: "active",
  },
  projectId: "project-1",
}

describe("member workspace project update transitions", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("updates project and overview through one service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        projectId: "project-1",
        updatedAt: "2026-08-06T00:21:00.000Z",
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(transitionOrganizationProjectUpdate(input)).resolves.toEqual({
      ok: true,
      projectId: "project-1",
      updatedAt: "2026-08-06T00:21:00.000Z",
    })
    expect(rpc).toHaveBeenCalledWith("update_organization_project_transition", {
      p_actor_id: "owner-1",
      p_expected_org_id: "org-1",
      p_expected_updated_at: UPDATED_AT,
      p_has_overview_document: true,
      p_overview_document_html: "<p>Updated overview</p>",
      p_overview_document_text: "Updated overview",
      p_project: input.project,
      p_project_id: "project-1",
    })
  })

  it("rejects a stale project instead of overwriting it", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "stale", ok: false },
        error: null,
      }),
    })

    await expect(transitionOrganizationProjectUpdate(input)).resolves.toEqual({
      error: "This project changed. Refresh before saving again.",
    })
  })

  it("locks revision, project fields, and overview upsert together", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806004000_atomic_organization_project_updates.sql"
      ),
      "utf8"
    )

    expect(sql).toContain("for update;")
    expect(sql).toContain("v_existing.updated_at is distinct from")
    expect(sql).toContain("update public.organization_projects")
    expect(sql).toContain(
      "insert into public.organization_project_overview_documents"
    )
    expect(sql).toContain("on conflict (org_id, project_id) do update")
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("routes full project edits through the atomic transition", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-actions.ts"
      ),
      "utf8"
    )
    const updateSource = source
      .split("export async function updateMemberWorkspaceProjectAction")[1]
      .split(
        "export async function updateMemberWorkspaceProjectStatusAction"
      )[0]

    expect(updateSource).toContain("transitionOrganizationProjectUpdate")
    expect(updateSource).toContain("expectedUpdatedAt:")
    expect(updateSource).not.toContain(
      '.from("organization_projects")\n    .update('
    )
  })
})
