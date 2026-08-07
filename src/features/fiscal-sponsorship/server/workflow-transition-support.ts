import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import type { FiscalSponsorshipReviewDecision } from "../types"
import { buildWorkflowTableError } from "./workflow-support"

type TransitionResult =
  | {
      applicationId: string
      ok: true
      status: string
      transitioned: boolean
    }
  | { code: string; ok: false; status?: string }

type DocumentTransitionResult =
  | {
      documentId: string
      documentKey: string | null
      ok: true
      transitioned: boolean
    }
  | { code: string; ok: false }

function parseTransitionResult(value: unknown): TransitionResult | null {
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
    typeof result.status === "string" &&
    typeof result.transitioned === "boolean"
  ) {
    return {
      applicationId: result.applicationId,
      ok: true,
      status: result.status,
      transitioned: result.transitioned,
    }
  }

  return null
}

function parseDocumentTransitionResult(
  value: unknown
): DocumentTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return { code: result.code, ok: false }
  }

  if (
    result.ok === true &&
    typeof result.documentId === "string" &&
    (typeof result.documentKey === "string" || result.documentKey === null) &&
    typeof result.transitioned === "boolean"
  ) {
    return {
      documentId: result.documentId,
      documentKey: result.documentKey,
      ok: true,
      transitioned: result.transitioned,
    }
  }

  return null
}

function isMissingTransitionFunctionError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42883" || record.code === "PGRST202") return true
  return (
    typeof record.message === "string" && record.message.includes("transition")
  )
}

function transitionFailure(code: string, action: "review" | "submit") {
  if (code === "stale") {
    return { error: "This application changed. Refresh before trying again." }
  }
  if (code === "not_found") {
    return { error: "Unable to load fiscal sponsorship application." }
  }
  if (code === "note_required") {
    return { error: "Add a review note before saving this decision." }
  }
  if (code === "invalid_decision") {
    return { error: "Choose a valid fiscal sponsorship review decision." }
  }
  return {
    error: `This application can no longer be ${action === "submit" ? "submitted" : "reviewed"}. Refresh to see its current status.`,
  }
}

function documentTransitionFailure(code: string, action: "connect" | "review") {
  if (code === "stale") {
    return { error: "This document changed. Refresh before trying again." }
  }
  if (code === "not_found") {
    return { error: "Unable to load fiscal sponsorship application." }
  }
  if (code === "document_not_found") {
    return { error: "Unable to load that fiscal sponsorship document." }
  }
  if (code === "invalid_asset") {
    return { error: "Choose an uploaded project asset for this requirement." }
  }
  if (code === "invalid_w9") {
    return {
      error:
        "Complete and sign the W-9 in Coach House, or connect an existing signed W-9 PDF.",
    }
  }
  if (code === "note_required") {
    return { error: "Add a review note before saving this decision." }
  }
  if (code === "invalid_decision") {
    return { error: "Choose a valid fiscal sponsorship document decision." }
  }
  return {
    error:
      action === "connect"
        ? "Unable to connect that fiscal sponsorship document."
        : "Unable to review that fiscal sponsorship document.",
  }
}

export async function transitionFiscalApplicationSubmission({
  actorId,
  applicationId,
  expectedUpdatedAt,
}: {
  actorId: string
  applicationId: string
  expectedUpdatedAt: string
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "submit_fiscal_sponsorship_application_transition",
    {
      p_actor_id: actorId,
      p_application_id: applicationId,
      p_expected_updated_at: expectedUpdatedAt,
    }
  )

  if (error) {
    return isMissingTransitionFunctionError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to submit fiscal sponsorship application." }
  }

  const result = parseTransitionResult(data)
  if (!result)
    return { error: "Unable to submit fiscal sponsorship application." }
  return result.ok ? result : transitionFailure(result.code, "submit")
}

export async function transitionFiscalApplicationReview({
  actorId,
  applicationId,
  decision,
  expectedUpdatedAt,
  notes,
}: {
  actorId: string
  applicationId: string
  decision: FiscalSponsorshipReviewDecision
  expectedUpdatedAt: string
  notes: string | null
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "review_fiscal_sponsorship_application_transition",
    {
      p_actor_id: actorId,
      p_application_id: applicationId,
      p_decision: decision,
      p_expected_updated_at: expectedUpdatedAt,
      p_notes: notes,
    }
  )

  if (error) {
    return isMissingTransitionFunctionError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to save fiscal sponsorship review." }
  }

  const result = parseTransitionResult(data)
  if (!result) return { error: "Unable to save fiscal sponsorship review." }
  return result.ok ? result : transitionFailure(result.code, "review")
}

export async function transitionFiscalDocumentConnection({
  actorId,
  applicationId,
  assetId,
  documentKey,
  requirementLabel,
  title,
}: {
  actorId: string
  applicationId: string
  assetId: string
  documentKey: string
  requirementLabel: string
  title: string
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "connect_fiscal_sponsorship_document_transition",
    {
      p_actor_id: actorId,
      p_application_id: applicationId,
      p_asset_id: assetId,
      p_document_key: documentKey,
      p_requirement_label: requirementLabel,
      p_title: title,
    }
  )

  if (error) {
    return isMissingTransitionFunctionError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to connect that fiscal sponsorship document." }
  }

  const result = parseDocumentTransitionResult(data)
  if (!result) {
    return { error: "Unable to connect that fiscal sponsorship document." }
  }
  return result.ok ? result : documentTransitionFailure(result.code, "connect")
}

export async function transitionFiscalDocumentReview({
  actorId,
  applicationId,
  decision,
  documentId,
  expectedUpdatedAt,
  notes,
}: {
  actorId: string
  applicationId: string
  decision: string
  documentId: string
  expectedUpdatedAt: string
  notes: string | null
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "review_fiscal_sponsorship_document_transition",
    {
      p_actor_id: actorId,
      p_application_id: applicationId,
      p_decision: decision,
      p_document_id: documentId,
      p_expected_updated_at: expectedUpdatedAt,
      p_notes: notes,
    }
  )

  if (error) {
    return isMissingTransitionFunctionError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to review that fiscal sponsorship document." }
  }

  const result = parseDocumentTransitionResult(data)
  if (!result) {
    return { error: "Unable to review that fiscal sponsorship document." }
  }
  return result.ok ? result : documentTransitionFailure(result.code, "review")
}
