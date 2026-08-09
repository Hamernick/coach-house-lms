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

import { transitionOrganizationProjectSchedule } from "@/features/member-workspace/server/project-transition-support"

const input = {
  actorId: "owner-1",
  endDate: "2026-10-31",
  expectedOrgId: "org-1",
  expectedUpdatedAt: "2026-08-06T00:28:00.000Z",
  projectId: "project-1",
  startDate: "2026-10-01",
}

describe("member workspace project schedule transitions", () => {
  beforeEach(() => createSupabaseAdminClientMock.mockReset())

  it("updates dates through one revision-checked service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        projectId: "project-1",
        updatedAt: "2026-08-06T00:29:00.000Z",
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      transitionOrganizationProjectSchedule(input)
    ).resolves.toMatchObject({ ok: true, projectId: "project-1" })
    expect(rpc).toHaveBeenCalledWith(
      "update_organization_project_schedule_transition",
      {
        p_actor_id: "owner-1",
        p_end_date: "2026-10-31",
        p_expected_org_id: "org-1",
        p_expected_updated_at: "2026-08-06T00:28:00.000Z",
        p_project_id: "project-1",
        p_start_date: "2026-10-01",
      }
    )
  })

  it("rejects stale date changes", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "stale", ok: false },
        error: null,
      }),
    })
    await expect(transitionOrganizationProjectSchedule(input)).resolves.toEqual(
      {
        error: "This project changed. Refresh before saving again.",
      }
    )
  })

  it("locks scope and revision before updating dates", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806006000_atomic_organization_project_schedule_updates.sql"
      ),
      "utf8"
    )
    expect(sql).toContain("for update;")
    expect(sql).toContain("v_project.updated_at is distinct from")
    expect(sql).toContain("update public.organization_projects")
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("routes quick date changes through the atomic transition", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/server/project-actions.ts"
      ),
      "utf8"
    )
    const scheduleSource = source
      .split(
        "export async function updateMemberWorkspaceProjectScheduleAction"
      )[1]
      .split("export async function deleteMemberWorkspaceProjectAction")[0]

    expect(scheduleSource).toContain("transitionOrganizationProjectSchedule")
    expect(scheduleSource).toContain("expectedUpdatedAt:")
    expect(scheduleSource).not.toContain(
      '.from("organization_projects")\n    .update('
    )
  })
})
