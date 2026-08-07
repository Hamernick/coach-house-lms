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

import { transitionFiscalFormBGeneration } from "@/features/fiscal-sponsorship/server/agreement-transition-support"

const UPDATED_AT = "2026-08-05T23:55:00.000Z"

const documentPayload = {
  field_values: { projectName: "Community kitchen" },
  field_values_sha256: "a".repeat(64),
  file_sha256: "b".repeat(64),
  generated_at: UPDATED_AT,
  kind: "agreement",
  metadata: { filename: "form-b.pdf" },
  mime: "application/pdf",
  size_bytes: 42_000,
  source_snapshot: { application: { id: "application-1" } },
  status: "generated",
  storage_bucket: "fiscal-signing",
  storage_path: "org-1/project-1/application-1/generated/document-form-b.pdf",
  template_key: "form-b",
  template_sha256: "c".repeat(64),
  template_version: 1,
  title: "Form B Fiscal Sponsorship Agreement",
}

describe("fiscal sponsorship agreement generation transition", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("commits generated Form B state through one service RPC", async () => {
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

    await expect(
      transitionFiscalFormBGeneration({
        actorId: "coach-1",
        applicationId: "application-1",
        document: documentPayload,
        expectedUpdatedAt: UPDATED_AT,
      })
    ).resolves.toEqual({
      applicationId: "application-1",
      documentId: "document-1",
      ok: true,
      version: 2,
    })

    expect(rpc).toHaveBeenCalledWith(
      "generate_fiscal_sponsorship_form_b_transition",
      {
        p_actor_id: "coach-1",
        p_application_id: "application-1",
        p_document: documentPayload,
        p_expected_updated_at: UPDATED_AT,
      }
    )
  })

  it("requires a refresh when the application changed after PDF generation", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "stale", ok: false },
        error: null,
      }),
    })

    await expect(
      transitionFiscalFormBGeneration({
        actorId: "coach-1",
        applicationId: "application-1",
        document: documentPayload,
        expectedUpdatedAt: UPDATED_AT,
      })
    ).resolves.toEqual({
      error: "This application changed. Refresh before trying again.",
    })
  })

  it("locks revision, W-9, version, document, status, and audit state together", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806001000_atomic_form_b_generation.sql"
      ),
      "utf8"
    )

    expect(sql).toContain("for update;")
    expect(sql).toContain(
      "v_application.updated_at is distinct from p_expected_updated_at"
    )
    expect(sql).toContain("document.document_key = 'tax_id_confirmation'")
    expect(sql).toContain("document.review_status = 'accepted'")
    expect(sql).toContain("document.kind = 'tax_form'")
    expect(sql).toContain("document.status = 'executed'")
    expect(sql).toContain("select coalesce(max(version), 0) + 1")
    expect(sql).toContain("insert into public.fiscal_sponsorship_documents")
    expect(sql).toContain("update public.fiscal_sponsorship_applications")
    expect(sql).toContain("insert into public.fiscal_sponsorship_events")
    expect(sql).toContain("'agreement_generated'")
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("removes an uploaded PDF when the atomic transition rejects it", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/fiscal-sponsorship/server/workflow-agreement-actions.ts"
      ),
      "utf8"
    )
    const generationSource = source.split(
      "export async function sendFiscalSponsorshipAgreementForSignature"
    )[0]

    expect(generationSource).toContain("transitionFiscalFormBGeneration")
    expect(generationSource).toContain("expectedUpdatedAt:")
    expect(generationSource).toContain(
      '.from("fiscal-signing").remove([storagePath])'
    )
    expect(generationSource).not.toContain(
      '.from("fiscal_sponsorship_documents")\n    .insert('
    )
  })
})
