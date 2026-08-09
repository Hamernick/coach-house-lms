import type { Json } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import { buildWorkflowTableError } from "./workflow-support"

type AgreementGenerationTransitionResult =
  | {
      applicationId: string
      documentId: string
      ok: true
      version: number
    }
  | { code: string; ok: false; status?: string }

function parseAgreementGenerationTransitionResult(
  value: unknown
): AgreementGenerationTransitionResult | null {
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
    typeof result.version === "number"
  ) {
    return {
      applicationId: result.applicationId,
      documentId: result.documentId,
      ok: true,
      version: result.version,
    }
  }

  return null
}

function isMissingAgreementGenerationTransition(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42883" || record.code === "PGRST202") return true
  return (
    typeof record.message === "string" &&
    record.message.includes("generate_fiscal_sponsorship_form_b_transition")
  )
}

function agreementGenerationFailure(code: string) {
  if (code === "stale") {
    return { error: "This application changed. Refresh before trying again." }
  }
  if (code === "not_found") {
    return { error: "Unable to load fiscal sponsorship application." }
  }
  if (code === "invalid_status") {
    return { error: "Approve the application before preparing an agreement." }
  }
  if (code === "missing_w9") {
    return {
      error:
        "Accept the applicant’s completed W-9 before preparing an agreement.",
    }
  }
  return { error: "Unable to save the prepared agreement document." }
}

export async function transitionFiscalFormBGeneration({
  actorId,
  applicationId,
  document,
  expectedUpdatedAt,
}: {
  actorId: string
  applicationId: string
  document: Json
  expectedUpdatedAt: string
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "generate_fiscal_sponsorship_form_b_transition",
    {
      p_actor_id: actorId,
      p_application_id: applicationId,
      p_document: document,
      p_expected_updated_at: expectedUpdatedAt,
    }
  )

  if (error) {
    return isMissingAgreementGenerationTransition(error)
      ? buildWorkflowTableError()
      : { error: "Unable to save the prepared agreement document." }
  }

  const result = parseAgreementGenerationTransitionResult(data)
  if (!result) {
    return { error: "Unable to save the prepared agreement document." }
  }
  return result.ok ? result : agreementGenerationFailure(result.code)
}
