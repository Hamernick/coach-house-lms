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

import { transitionOrganizationProjectStatus } from "@/features/member-workspace/server/project-transition-support"

const input = {
  actorId: "owner-1",
  expectedOrgId: "org-1",
  expectedUpdatedAt: "2026-08-06T00:25:00.000Z",
  projectId: "project-1",
  status: "active",
}

describe("member workspace project status transitions", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("updates status through one revision-checked service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        projectId: "project-1",
        updatedAt: "2026-08-06T00:26:00.000Z",
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(transitionOrganizationProjectStatus(input)).resolves.toEqual({
      ok: true,
      projectId: "project-1",
      updatedAt: "2026-08-06T00:26:00.000Z",
    })
    expect(rpc).toHaveBeenCalledWith(
      "update_organization_project_status_transition",
      {
        p_actor_id: "owner-1",
        p_expected_org_id: "org-1",
        p_expected_updated_at: "2026-08-06T00:25:00.000Z",
        p_project_id: "project-1",
        p_status: "active",
      }
    )
  })

  it("rejects stale status changes", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "stale", ok: false },
        error: null,
      }),
    })
    await expect(transitionOrganizationProjectStatus(input)).resolves.toEqual({
      error: "This project changed. Refresh before saving again.",
    })
  })

  it("locks scope and revision before updating status", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806005000_atomic_organization_project_status_updates.sql"
      ),
      "utf8"
    )

    expect(sql).toContain("for update;")
    expect(sql).toContain("v_project.org_id <> p_expected_org_id")
    expect(sql).toContain("v_project.updated_at is distinct from")
    expect(sql).toContain("update public.organization_projects")
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("routes quick status changes through the atomic transition", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-actions.ts"
      ),
      "utf8"
    )
    const statusSource = source
      .split(
        "export async function updateMemberWorkspaceProjectStatusAction"
      )[1]
      .split(
        "export async function updateMemberWorkspaceProjectScheduleAction"
      )[0]

    expect(statusSource).toContain("transitionOrganizationProjectStatus")
    expect(statusSource).toContain("expectedUpdatedAt:")
    expect(statusSource).not.toContain(
      '.from("organization_projects")\n    .update('
    )
  })
})
