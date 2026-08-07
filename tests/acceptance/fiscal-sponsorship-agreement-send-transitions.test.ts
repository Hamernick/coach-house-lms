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

import { transitionFiscalFormBSend } from "@/features/fiscal-sponsorship/server/agreement-send-transition-support"

const APPLICATION_UPDATED_AT = "2026-08-06T00:05:00.000Z"
const DOCUMENT_UPDATED_AT = "2026-08-06T00:05:01.000Z"

const transitionInput = {
  actorId: "coach-1",
  applicantSignerEmail: "applicant@example.org",
  applicantSignerId: "applicant-1",
  applicantSignerName: "Ana Torres",
  applicationId: "application-1",
  documentId: "document-1",
  expectedApplicationUpdatedAt: APPLICATION_UPDATED_AT,
  expectedDocumentUpdatedAt: DOCUMENT_UPDATED_AT,
  fields: { applicantFullName: "Ana Torres" },
  templateKey: "form-b",
  templateSha256: "a".repeat(64),
  templateVersion: 1,
}

describe("fiscal sponsorship agreement send transition", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("creates the native signing packet through one service RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        applicationId: "application-1",
        documentId: "document-1",
        ok: true,
        packetId: "packet-1",
        transitioned: true,
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(transitionFiscalFormBSend(transitionInput)).resolves.toEqual({
      applicationId: "application-1",
      documentId: "document-1",
      ok: true,
      packetId: "packet-1",
      transitioned: true,
    })

    expect(rpc).toHaveBeenCalledWith(
      "send_fiscal_sponsorship_form_b_transition",
      {
        p_actor_id: "coach-1",
        p_applicant_signer_email: "applicant@example.org",
        p_applicant_signer_id: "applicant-1",
        p_applicant_signer_name: "Ana Torres",
        p_application_id: "application-1",
        p_document_id: "document-1",
        p_expected_application_updated_at: APPLICATION_UPDATED_AT,
        p_expected_document_updated_at: DOCUMENT_UPDATED_AT,
        p_fields: { applicantFullName: "Ana Torres" },
        p_template_key: "form-b",
        p_template_sha256: "a".repeat(64),
        p_template_version: 1,
      }
    )
  })

  it("surfaces concurrent packet creation instead of duplicating it", async () => {
    createSupabaseAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: { code: "existing_packet", ok: false },
        error: null,
      }),
    })

    await expect(transitionFiscalFormBSend(transitionInput)).resolves.toEqual({
      error:
        "This application already has a signing packet. Refresh to view it.",
    })
  })

  it("locks packet, draft, document, and audit creation together", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260806002000_atomic_form_b_signature_packet_sends.sql"
      ),
      "utf8"
    )

    expect(sql.match(/for update;/g)).toHaveLength(3)
    expect(sql).toContain("v_application.updated_at is distinct from")
    expect(sql).toContain("v_document.updated_at is distinct from")
    expect(sql).toContain(
      "insert into public.fiscal_sponsorship_signature_packets"
    )
    expect(sql).toContain(
      "insert into public.fiscal_sponsorship_signing_drafts"
    )
    expect(sql).toContain("update public.fiscal_sponsorship_documents")
    expect(sql).toContain("insert into public.fiscal_sponsorship_events")
    expect(sql).toContain("'agreement_sent_for_signature'")
    expect(sql).toContain('"fiscal_sponsorship_signature_packets_insert"')
    expect(sql).toContain('"fiscal_sponsorship_signature_packets_update"')
    expect(sql).toContain("from public, anon, authenticated;")
    expect(sql).toContain("to service_role;")
  })

  it("uses only the atomic send transition in the server action", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/fiscal-sponsorship/server/workflow-agreement-actions.ts"
      ),
      "utf8"
    )
    const sendSource = source.split(
      "export async function sendFiscalSponsorshipAgreementForSignature"
    )[1]

    expect(sendSource).toContain("transitionFiscalFormBSend")
    expect(sendSource).toContain("expectedApplicationUpdatedAt:")
    expect(sendSource).toContain("expectedDocumentUpdatedAt:")
    expect(sendSource).not.toContain(
      '.from("fiscal_sponsorship_signature_packets")\n    .insert('
    )
    expect(sendSource).not.toContain(
      '.from("fiscal_sponsorship_signing_drafts")\n    .insert('
    )
  })
})
