import type { Json } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import { buildWorkflowTableError } from "./workflow-support"

type AgreementSendTransitionResult =
  | {
      applicationId: string
      documentId: string
      ok: true
      packetId: string
      transitioned: boolean
    }
  | { code: string; ok: false; status?: string }

function parseAgreementSendTransitionResult(
  value: unknown
): AgreementSendTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return {
      code: result.code,
      ok: false,
      ...(typeof result.status === "string" ? { status: result.status } : {}),
    }
  }

  if (
    result.ok === true &&
    typeof result.applicationId === "string" &&
    typeof result.documentId === "string" &&
    typeof result.packetId === "string" &&
    typeof result.transitioned === "boolean"
  ) {
    return {
      applicationId: result.applicationId,
      documentId: result.documentId,
      ok: true,
      packetId: result.packetId,
      transitioned: result.transitioned,
    }
  }

  return null
}

function isMissingAgreementSendTransition(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42883" || record.code === "PGRST202") return true
  return (
    typeof record.message === "string" &&
    record.message.includes("send_fiscal_sponsorship_form_b_transition")
  )
}

function agreementSendFailure(code: string) {
  if (code === "stale_application" || code === "stale_document") {
    return { error: "This agreement changed. Refresh before sending it." }
  }
  if (code === "not_found") {
    return { error: "Unable to load fiscal sponsorship application." }
  }
  if (code === "document_not_found") {
    return { error: "Unable to load the generated agreement." }
  }
  if (code === "invalid_status") {
    return { error: "Prepare the agreement before sending it." }
  }
  if (code === "invalid_signer") {
    return { error: "Choose a valid applicant signer before sending." }
  }
  if (code === "existing_packet") {
    return {
      error:
        "This application already has a signing packet. Refresh to view it.",
    }
  }
  return { error: "Unable to send the fiscal sponsorship agreement." }
}

export async function transitionFiscalFormBSend({
  actorId,
  applicantSignerEmail,
  applicantSignerId,
  applicantSignerName,
  applicationId,
  documentId,
  expectedApplicationUpdatedAt,
  expectedDocumentUpdatedAt,
  fields,
  templateKey,
  templateSha256,
  templateVersion,
}: {
  actorId: string
  applicantSignerEmail: string
  applicantSignerId: string
  applicantSignerName: string
  applicationId: string
  documentId: string
  expectedApplicationUpdatedAt: string
  expectedDocumentUpdatedAt: string
  fields: Json
  templateKey: string
  templateSha256: string
  templateVersion: number
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "send_fiscal_sponsorship_form_b_transition",
    {
      p_actor_id: actorId,
      p_applicant_signer_email: applicantSignerEmail,
      p_applicant_signer_id: applicantSignerId,
      p_applicant_signer_name: applicantSignerName,
      p_application_id: applicationId,
      p_document_id: documentId,
      p_expected_application_updated_at: expectedApplicationUpdatedAt,
      p_expected_document_updated_at: expectedDocumentUpdatedAt,
      p_fields: fields,
      p_template_key: templateKey,
      p_template_sha256: templateSha256,
      p_template_version: templateVersion,
    }
  )

  if (error) {
    return isMissingAgreementSendTransition(error)
      ? buildWorkflowTableError()
      : { error: "Unable to send the fiscal sponsorship agreement." }
  }

  const result = parseAgreementSendTransitionResult(data)
  if (!result) {
    return { error: "Unable to send the fiscal sponsorship agreement." }
  }
  return result.ok ? result : agreementSendFailure(result.code)
}
