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

import { transitionFiscalW9Completion } from "@/features/fiscal-sponsorship/server/w9-transition-support"

const UPDATED_AT = "2026-08-06T00:50:00.000Z"
const input = {
  actorId: "applicant-1",
  applicationId: "application-1",
  document: {
    document_key: "tax_id_confirmation",
    field_values: { tinLast4: "6789" },
    field_values_sha256: "a".repeat(64),
    file_sha256: "b".repeat(64),
    kind: "tax_form",
    review_status: "pending",
    status: "executed",
    storage_bucket: "fiscal-signing",
  },
  expectedUpdatedAt: UPDATED_AT,
}

describe("fiscal sponsorship W-9 transitions", () => {
  beforeEach(() => createSupabaseAdminClientMock.mockReset())

  it("commits the signed W-9 through one service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        applicationId: "application-1",
        documentId: "document-1",
        ok: true,
        version: 2,
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })
    await expect(transitionFiscalW9Completion(input)).resolves.toMatchObject({
      documentId: "document-1",
      ok: true,
      version: 2,
    })
    expect(rpc).toHaveBeenCalledWith(
      "complete_fiscal_sponsorship_w9_transition",
      {
        p_actor_id: "applicant-1",
        p_application_id: "application-1",
        p_document: input.document,
        p_expected_updated_at: UPDATED_AT,
      }
    )
  })

  it("rejects a concurrent completion", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "stale", ok: false },
        error: null,
      }),
    })
    await expect(transitionFiscalW9Completion(input)).resolves.toEqual({
      error: "This application changed. Refresh before signing again.",
    })
  })

  it("locks version, document, application revision, and audit together", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806008000_atomic_fiscal_w9_completion.sql"
      ),
      "utf8"
    )
    expect(sql).toContain("for update;")
    expect(sql).toContain("v_application.updated_at is distinct from")
    expect(sql).toContain("select coalesce(max(version), 0) + 1")
    expect(sql).toContain("insert into public.fiscal_sponsorship_documents")
    expect(sql).toContain("update public.fiscal_sponsorship_applications")
    expect(sql).toContain("insert into public.fiscal_sponsorship_events")
    expect(sql).toContain("'w9_completed'")
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("removes the uploaded PDF when the transition rejects it", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/fiscal-sponsorship/server/w9-actions.ts"
      ),
      "utf8"
    )
    expect(source).toContain("transitionFiscalW9Completion")
    expect(source).toContain("expectedUpdatedAt:")
    expect(source).toContain(".remove([storagePath])")
    expect(source).not.toContain(
      '.from("fiscal_sponsorship_documents")\n      .insert('
    )
  })
})
