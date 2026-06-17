"use server"

import type {
  ConnectFiscalSponsorshipDocumentAssetInput,
  ConnectFiscalSponsorshipDocumentAssetResult,
  FiscalSponsorshipApplicationStatus,
  FiscalSponsorshipDocumentStatus,
  FiscalSponsorshipReviewInput,
  FiscalSponsorshipWorkflowActionResult,
  ReviewFiscalSponsorshipDocumentInput,
  ReviewFiscalSponsorshipDocumentResult,
} from "../types"
import {
  formatDocumentKeyLabel,
  loadProjectAssetForFiscalDocument,
  normalizeFiscalDocumentKey,
  resolveDocumentKindForKey,
} from "./workflow-document-actions-support"
import {
  notifyFiscalApplicationReviewed,
  notifyFiscalApplicationSubmitted,
  notifyFiscalDocumentConnected,
  notifyFiscalDocumentReviewed,
} from "./workflow-notifications"
import {
  buildWorkflowTableError,
  canCoachManageFiscalSponsorship,
  canEditFiscalProject,
  insertFiscalEvent,
  isMissingFiscalWorkflowTableError,
  loadFiscalApplicationForProject,
  revalidateFiscalApplicationRoutes,
  resolveProjectAndContext,
  updateFiscalApplicationStatus,
} from "./workflow-support"
import { validateApplicationForSubmission } from "./workflow-validation"

function formatReviewDecisionLabel(decision: string) {
  return decision.replaceAll("_", " ")
}

function getRequiredReviewNoteError({
  decision,
  notes,
  subject,
}: {
  decision: string
  notes?: string | null
  subject: "application" | "document"
}) {
  if (
    decision !== "needs_info" &&
    decision !== "declined" &&
    decision !== "rejected"
  ) {
    return null
  }

  return notes?.trim()
    ? null
    : `Add a review note before marking this ${subject} ${formatReviewDecisionLabel(decision)}.`
}

export async function submitFiscalSponsorshipApplication(
  projectId: string
): Promise<FiscalSponsorshipWorkflowActionResult> {
  const context = await resolveProjectAndContext(projectId)
  if ("error" in context) return context

  if (
    !canEditFiscalProject({
      activeOrgId: context.activeOrg.orgId,
      activeOrgRole: context.activeOrg.role,
      isAdmin: context.profileAudience.isAdmin,
      project: context.project,
    })
  ) {
    return { error: "Only organization editors can submit this application." }
  }

  const loaded = await loadFiscalApplicationForProject(context)
  if ("error" in loaded) return loaded

  const validationError = validateApplicationForSubmission(loaded.application)
  if (validationError) {
    return { error: validationError }
  }

  const submittedAt = new Date().toISOString()
  const updated = await updateFiscalApplicationStatus({
    applicationId: loaded.application.id,
    patch: {
      status: "submitted",
      submitted_at: submittedAt,
      updated_by: context.user.id,
    },
    supabase: context.supabase,
  })
  if ("error" in updated) return updated

  await insertFiscalEvent({
    applicationId: loaded.application.id,
    eventType: "application_submitted",
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    summary: "Fiscal sponsorship application submitted.",
    supabase: context.supabase,
    userId: context.user.id,
  })
  await notifyFiscalApplicationSubmitted({
    actorId: context.user.id,
    application: loaded.application,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return { ok: true, applicationId: loaded.application.id }
}

export async function reviewFiscalSponsorshipApplication(
  input: FiscalSponsorshipReviewInput
): Promise<FiscalSponsorshipWorkflowActionResult> {
  const context = await resolveProjectAndContext(input.projectId)
  if ("error" in context) return context

  if (!canCoachManageFiscalSponsorship(context.profileAudience.isAdmin)) {
    return { error: "Only Coach House admins can review fiscal applications." }
  }

  const loaded = await loadFiscalApplicationForProject(context)
  if ("error" in loaded) return loaded

  const reviewNotes = input.notes?.trim() || null
  const reviewNoteError = getRequiredReviewNoteError({
    decision: input.decision,
    notes: reviewNotes,
    subject: "application",
  })
  if (reviewNoteError) return { error: reviewNoteError }

  const reviewedAt = new Date().toISOString()
  const { error: reviewError } = await context.supabase
    .from("fiscal_sponsorship_reviews")
    .insert({
      application_id: loaded.application.id,
      decision: input.decision,
      notes: reviewNotes,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      reviewed_at: reviewedAt,
      reviewed_by: context.user.id,
    })

  if (reviewError) {
    return isMissingFiscalWorkflowTableError(reviewError)
      ? buildWorkflowTableError()
      : { error: "Unable to save fiscal sponsorship review." }
  }

  const statusByDecision: Record<
    FiscalSponsorshipReviewInput["decision"],
    FiscalSponsorshipApplicationStatus
  > = {
    approved: "approved",
    declined: "declined",
    needs_info: "needs_info",
  }
  const updated = await updateFiscalApplicationStatus({
    applicationId: loaded.application.id,
    patch: {
      review_notes: reviewNotes,
      reviewed_at: reviewedAt,
      reviewed_by: context.user.id,
      status: statusByDecision[input.decision],
      updated_by: context.user.id,
    },
    supabase: context.supabase,
  })
  if ("error" in updated) return updated

  await insertFiscalEvent({
    applicationId: loaded.application.id,
    eventType: `application_${input.decision}`,
    metadata: { decision: input.decision },
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    summary: `Fiscal sponsorship application marked ${formatReviewDecisionLabel(input.decision)}.`,
    supabase: context.supabase,
    userId: context.user.id,
  })
  await notifyFiscalApplicationReviewed({
    actorId: context.user.id,
    application: loaded.application,
    decision: input.decision,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return { ok: true, applicationId: loaded.application.id }
}

export async function connectFiscalSponsorshipDocumentAsset(
  input: ConnectFiscalSponsorshipDocumentAssetInput
): Promise<ConnectFiscalSponsorshipDocumentAssetResult> {
  const context = await resolveProjectAndContext(input.projectId)
  if ("error" in context) return context

  if (
    !canEditFiscalProject({
      activeOrgId: context.activeOrg.orgId,
      activeOrgRole: context.activeOrg.role,
      isAdmin: context.profileAudience.isAdmin,
      project: context.project,
    })
  ) {
    return { error: "Only organization editors can connect fiscal documents." }
  }

  const documentKey = normalizeFiscalDocumentKey(input.documentKey)
  if (!documentKey) {
    return { error: "Choose a valid fiscal document requirement." }
  }

  const loaded = await loadFiscalApplicationForProject(context)
  if ("error" in loaded) return loaded

  const assetResult = await loadProjectAssetForFiscalDocument({
    assetId: input.assetId,
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    supabase: context.supabase,
  })
  if ("error" in assetResult) return assetResult

  const kind = resolveDocumentKindForKey(documentKey)
  const connectedAt = new Date().toISOString()
  const { data: previousDocument } = await context.supabase
    .from("fiscal_sponsorship_documents")
    .select("version")
    .eq("application_id", loaded.application.id)
    .eq("kind", kind)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>()
  const nextVersion = (previousDocument?.version ?? 0) + 1
  const title =
    input.title?.trim() ||
    assetResult.asset.name ||
    formatDocumentKeyLabel(documentKey)

  const { data: document, error: documentError } = await context.supabase
    .from("fiscal_sponsorship_documents")
    .insert({
      application_id: loaded.application.id,
      asset_id: assetResult.asset.id,
      document_key: documentKey,
      generated_at: connectedAt,
      kind,
      metadata: {
        assetType: assetResult.asset.asset_type,
        externalUrl: assetResult.asset.external_url,
        requirementLabel: formatDocumentKeyLabel(documentKey),
      },
      mime: assetResult.asset.mime,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      review_status: "pending",
      size_bytes: assetResult.asset.size_bytes,
      source_snapshot: {
        asset: {
          id: assetResult.asset.id,
          name: assetResult.asset.name,
          description: assetResult.asset.description,
        },
        connectedAt,
        documentKey,
        source: "project-assets",
      },
      status: "draft" satisfies FiscalSponsorshipDocumentStatus,
      storage_path: assetResult.asset.storage_path,
      title,
      uploaded_at: connectedAt,
      uploaded_by: context.user.id,
      version: nextVersion,
    })
    .select("id")
    .single<{ id: string }>()

  if (documentError) {
    return isMissingFiscalWorkflowTableError(documentError)
      ? buildWorkflowTableError()
      : { error: "Unable to connect that fiscal sponsorship document." }
  }

  await insertFiscalEvent({
    applicationId: loaded.application.id,
    eventType: "document_connected",
    metadata: {
      assetId: assetResult.asset.id,
      documentId: document.id,
      documentKey,
    },
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    summary: `${formatDocumentKeyLabel(documentKey)} connected to fiscal sponsorship.`,
    supabase: context.supabase,
    userId: context.user.id,
  })
  await notifyFiscalDocumentConnected({
    actorId: context.user.id,
    application: loaded.application,
    documentId: document.id,
    documentKey,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return { ok: true, documentId: document.id }
}

export async function reviewFiscalSponsorshipDocument(
  input: ReviewFiscalSponsorshipDocumentInput
): Promise<ReviewFiscalSponsorshipDocumentResult> {
  const context = await resolveProjectAndContext(input.projectId)
  if ("error" in context) return context

  if (!canCoachManageFiscalSponsorship(context.profileAudience.isAdmin)) {
    return { error: "Only Coach House admins can review fiscal documents." }
  }

  const loaded = await loadFiscalApplicationForProject(context)
  if ("error" in loaded) return loaded

  const reviewNotes = input.notes?.trim() || null
  const reviewNoteError = getRequiredReviewNoteError({
    decision: input.decision,
    notes: reviewNotes,
    subject: "document",
  })
  if (reviewNoteError) return { error: reviewNoteError }

  const reviewedAt = new Date().toISOString()
  const { data: document, error: documentError } = await context.supabase
    .from("fiscal_sponsorship_documents")
    .update({
      review_notes: reviewNotes,
      review_status: input.decision,
      reviewed_at: reviewedAt,
      reviewed_by: context.user.id,
      updated_at: reviewedAt,
    })
    .eq("id", input.documentId)
    .eq("application_id", loaded.application.id)
    .eq("project_id", loaded.application.project_id)
    .select("id, document_key")
    .single<{ id: string; document_key: string | null }>()

  if (documentError) {
    return isMissingFiscalWorkflowTableError(documentError)
      ? buildWorkflowTableError()
      : { error: "Unable to review that fiscal sponsorship document." }
  }

  const documentKey = normalizeFiscalDocumentKey(document.document_key ?? "")

  await insertFiscalEvent({
    applicationId: loaded.application.id,
    eventType: "document_reviewed",
    metadata: {
      decision: input.decision,
      documentId: document.id,
      documentKey,
    },
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    summary: `${documentKey ? formatDocumentKeyLabel(documentKey) : "Fiscal sponsorship document"} marked ${formatReviewDecisionLabel(input.decision)}.`,
    supabase: context.supabase,
    userId: context.user.id,
  })
  await notifyFiscalDocumentReviewed({
    actorId: context.user.id,
    application: loaded.application,
    decision: input.decision,
    documentId: document.id,
    documentKey,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return { ok: true, documentId: document.id }
}
