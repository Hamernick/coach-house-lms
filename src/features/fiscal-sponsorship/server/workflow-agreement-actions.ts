"use server"

import { randomUUID } from "node:crypto"

import { buildFiscalSponsorshipAgreementDocument } from "../lib"
import type {
  FiscalSponsorshipDocumentStatus,
  GenerateFiscalSponsorshipAgreementInput,
  GenerateFiscalSponsorshipAgreementResult,
  SendFiscalSponsorshipAgreementInput,
  SendFiscalSponsorshipAgreementResult,
} from "../types"
import {
  createFiscalSponsorshipDocuSealSubmission,
  getFiscalSponsorshipDocuSealConfig,
} from "./docuseal"
import {
  notifyFiscalAgreementGenerated,
  notifyFiscalAgreementSent,
} from "./workflow-notifications"
import {
  buildWorkflowTableError,
  canCoachManageFiscalSponsorship,
  getApplicationOrganizationName,
  insertFiscalEvent,
  isMissingFiscalWorkflowTableError,
  loadFiscalApplicationForProject,
  loadLatestAgreementDocument,
  mapFiscalApplicationRow,
  revalidateFiscalApplicationRoutes,
  resolveProjectAndContext,
  sanitizeAgreementFilename,
  updateFiscalApplicationStatus,
} from "./workflow-support"

export async function generateFiscalSponsorshipAgreement(
  input: GenerateFiscalSponsorshipAgreementInput
): Promise<GenerateFiscalSponsorshipAgreementResult> {
  const context = await resolveProjectAndContext(input.projectId)
  if ("error" in context) return context

  if (!canCoachManageFiscalSponsorship(context.profileAudience.isAdmin)) {
    return { error: "Only Coach House admins can generate agreements." }
  }

  const loaded = await loadFiscalApplicationForProject(context)
  if ("error" in loaded) return loaded

  if (!["approved", "agreement_ready"].includes(loaded.application.status)) {
    return { error: "Approve the application before generating an agreement." }
  }

  const generatedAt = new Date().toISOString()
  const agreement = buildFiscalSponsorshipAgreementDocument({
    application: mapFiscalApplicationRow(loaded.application),
    generatedAt,
    organizationName: getApplicationOrganizationName(loaded.application),
  })
  const storagePath = `${loaded.application.org_id}/${loaded.application.project_id}/fiscal-sponsorship/${randomUUID()}-${sanitizeAgreementFilename(agreement.filename)}`
  const fileBuffer = Buffer.from(agreement.html, "utf8")

  const { error: uploadError } = await context.supabase.storage
    .from("project-assets")
    .upload(storagePath, fileBuffer, { contentType: agreement.mime })
  if (uploadError) {
    return { error: "Unable to upload generated fiscal sponsorship agreement." }
  }

  const { data: asset, error: assetError } = await context.supabase
    .from("organization_project_assets")
    .insert({
      asset_type: "doc",
      created_by: context.user.id,
      description: "Generated fiscal sponsorship agreement.",
      mime: agreement.mime,
      name: agreement.title,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      size_bytes: agreement.sizeBytes,
      storage_path: storagePath,
      updated_by: context.user.id,
    })
    .select("id")
    .single<{ id: string }>()
  if (assetError) {
    await context.supabase.storage.from("project-assets").remove([storagePath])
    return { error: "Unable to save the generated agreement asset." }
  }

  const { data: previousDocument } = await context.supabase
    .from("fiscal_sponsorship_documents")
    .select("version")
    .eq("application_id", loaded.application.id)
    .eq("kind", "agreement")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>()
  const nextVersion = (previousDocument?.version ?? 0) + 1

  const { data: document, error: documentError } = await context.supabase
    .from("fiscal_sponsorship_documents")
    .insert({
      application_id: loaded.application.id,
      asset_id: asset.id,
      generated_at: generatedAt,
      generated_by: context.user.id,
      kind: "agreement",
      metadata: { filename: agreement.filename },
      mime: agreement.mime,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      size_bytes: agreement.sizeBytes,
      source_snapshot: {
        application: mapFiscalApplicationRow(loaded.application),
        generatedAt,
      },
      status: "generated" satisfies FiscalSponsorshipDocumentStatus,
      storage_path: storagePath,
      title: agreement.title,
      version: nextVersion,
    })
    .select("id")
    .single<{ id: string }>()
  if (documentError) {
    await context.supabase.storage.from("project-assets").remove([storagePath])
    return isMissingFiscalWorkflowTableError(documentError)
      ? buildWorkflowTableError()
      : { error: "Unable to save the generated agreement document." }
  }

  const updated = await updateFiscalApplicationStatus({
    applicationId: loaded.application.id,
    patch: {
      status: "agreement_ready",
      updated_by: context.user.id,
    },
    supabase: context.supabase,
  })
  if ("error" in updated) return updated

  await insertFiscalEvent({
    applicationId: loaded.application.id,
    eventType: "agreement_generated",
    metadata: { assetId: asset.id, documentId: document.id },
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    summary: "Fiscal sponsorship agreement generated.",
    supabase: context.supabase,
    userId: context.user.id,
  })
  await notifyFiscalAgreementGenerated({
    actorId: context.user.id,
    application: loaded.application,
    documentId: document.id,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return {
    ok: true,
    applicationId: loaded.application.id,
    assetId: asset.id,
    documentId: document.id,
  }
}

export async function sendFiscalSponsorshipAgreementForSignature(
  input: SendFiscalSponsorshipAgreementInput
): Promise<SendFiscalSponsorshipAgreementResult> {
  const context = await resolveProjectAndContext(input.projectId)
  if ("error" in context) return context

  if (!canCoachManageFiscalSponsorship(context.profileAudience.isAdmin)) {
    return { error: "Only Coach House admins can send agreements." }
  }

  const loaded = await loadFiscalApplicationForProject(context)
  if ("error" in loaded) return loaded

  const documentResult = await loadLatestAgreementDocument({
    applicationId: loaded.application.id,
    documentId: input.documentId,
    supabase: context.supabase,
  })
  if ("error" in documentResult) return documentResult

  const applicantEmail = loaded.application.primary_email?.trim()
  if (!applicantEmail) {
    return { error: "Add a primary applicant email before sending." }
  }

  const config = getFiscalSponsorshipDocuSealConfig()
  if ("error" in config) return config

  const applicantName =
    loaded.application.applicant_full_name?.trim() ||
    [
      loaded.application.applicant_first_name,
      loaded.application.applicant_last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    applicantEmail
  const providerResult = await createFiscalSponsorshipDocuSealSubmission({
    applicantEmail,
    applicantName,
    coachEmail: config.coachEmail,
    coachName: config.coachName,
    documentName: documentResult.document.title,
    metadata: {
      applicationId: loaded.application.id,
      documentId: documentResult.document.id,
      orgId: loaded.application.org_id,
      projectId: loaded.application.project_id,
    },
  })
  if ("error" in providerResult) return providerResult

  const sentAt = new Date().toISOString()
  const { data: packet, error: packetError } = await context.supabase
    .from("fiscal_sponsorship_signature_packets")
    .insert({
      applicant_signer_email: applicantEmail,
      applicant_signer_name: applicantName,
      application_id: loaded.application.id,
      coach_signer_email: config.coachEmail,
      coach_signer_name: config.coachName,
      document_id: documentResult.document.id,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      provider: "docuseal",
      provider_payload: providerResult.providerPayload,
      provider_submission_id: providerResult.providerSubmissionId,
      provider_template_id: config.templateId,
      sent_at: sentAt,
      sent_by: context.user.id,
      status: "sent",
    })
    .select("id")
    .single<{ id: string }>()
  if (packetError) {
    return isMissingFiscalWorkflowTableError(packetError)
      ? buildWorkflowTableError()
      : { error: "Unable to save fiscal sponsorship signature packet." }
  }

  await context.supabase
    .from("fiscal_sponsorship_documents")
    .update({
      status: "sent_for_signature" satisfies FiscalSponsorshipDocumentStatus,
      updated_at: sentAt,
    })
    .eq("id", documentResult.document.id)

  await insertFiscalEvent({
    applicationId: loaded.application.id,
    eventType: "agreement_sent_for_signature",
    metadata: {
      documentId: documentResult.document.id,
      packetId: packet.id,
      provider: "docuseal",
      providerSubmissionId: providerResult.providerSubmissionId,
    },
    orgId: loaded.application.org_id,
    projectId: loaded.application.project_id,
    summary: "Fiscal sponsorship agreement sent for signature.",
    supabase: context.supabase,
    userId: context.user.id,
  })
  await notifyFiscalAgreementSent({
    actorId: context.user.id,
    application: loaded.application,
    packetId: packet.id,
    providerSubmissionId: providerResult.providerSubmissionId,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return {
    ok: true,
    applicationId: loaded.application.id,
    packetId: packet.id,
    providerSubmissionId: providerResult.providerSubmissionId,
  }
}
