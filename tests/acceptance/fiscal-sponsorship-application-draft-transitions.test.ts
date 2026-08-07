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

import { saveFiscalApplicationDraftTransition } from "@/features/fiscal-sponsorship/server/application-draft-transition-support"

const UPDATED_AT = "2026-08-05T23:30:00.000Z"

describe("fiscal sponsorship draft transitions", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("saves the application and source budget through one service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        applicationId: "application-1",
        ok: true,
        updatedAt: UPDATED_AT,
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      saveFiscalApplicationDraftTransition({
        actorId: "user-1",
        allowLocked: false,
        budgetRows: [{ category: "Equipment", totalCost: "500" }],
        budgetTotalCents: 50_000,
        expectedUpdatedAt: UPDATED_AT,
        hasBudgetRows: true,
        payload: { project_name: "Community kitchen" },
        projectId: "project-1",
        sourceActivityId: "program-1",
      })
    ).resolves.toEqual({
      applicationId: "application-1",
      ok: true,
      updatedAt: UPDATED_AT,
    })

    expect(rpc).toHaveBeenCalledWith(
      "save_fiscal_sponsorship_application_draft_transition",
      {
        p_actor_id: "user-1",
        p_allow_locked: false,
        p_budget_rows: [{ category: "Equipment", totalCost: "500" }],
        p_budget_total_cents: 50_000,
        p_expected_updated_at: UPDATED_AT,
        p_has_budget_rows: true,
        p_payload: { project_name: "Community kitchen" },
        p_project_id: "project-1",
        p_source_activity_id: "program-1",
      }
    )
  })

  it("returns a refresh instruction for stale drafts", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "stale", ok: false },
        error: null,
      }),
    })

    await expect(
      saveFiscalApplicationDraftTransition({
        actorId: "user-1",
        allowLocked: false,
        budgetRows: [],
        budgetTotalCents: 0,
        expectedUpdatedAt: UPDATED_AT,
        hasBudgetRows: false,
        payload: {},
        projectId: "project-1",
        sourceActivityId: null,
      })
    ).resolves.toEqual({
      error: "This draft changed. Refresh before saving again.",
    })
  })

  it("locks the project, application, and program in one restricted transaction", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260805232500_atomic_fiscal_application_draft_saves.sql"
      ),
      "utf8"
    )

    expect(sql.match(/for update;/g)).toHaveLength(3)
    expect(sql).toContain("v_application.updated_at is distinct from")
    expect(sql).toContain("update public.fiscal_sponsorship_applications")
    expect(sql).toContain("insert into public.fiscal_sponsorship_applications")
    expect(sql).toContain("update public.programs")
    expect(sql).toContain("v_program.wizard_snapshot")
    expect(sql).toContain("drop policy if exists")
    expect(sql).toContain('"fiscal_sponsorship_applications_insert"')
    expect(sql).toContain('"fiscal_sponsorship_applications_update"')
    expect(sql).toContain("from public, anon, authenticated")
    expect(sql).toContain("to service_role;")
  })
})
