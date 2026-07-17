"use server"

import { randomUUID } from "node:crypto"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  FISCAL_SPONSORSHIP_FORM_B_TEMPLATE,
  formatFiscalSponsorshipLegalEntityType,
  normalizeFiscalSponsorshipFormBFields,
  validateFiscalSponsorshipFormBFields,
} from "../lib/form-b-field-manifest"
import { buildFiscalSponsorshipFormBPdf, sha256Hex } from "../lib/form-b-pdf"
import type {
  FiscalSponsorshipDocumentStatus,
  GenerateFiscalSponsorshipAgreementInput,
  GenerateFiscalSponsorshipAgreementResult,
  SendFiscalSponsorshipAgreementInput,
  SendFiscalSponsorshipAgreementResult,
} from "../types"
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
  const fields = normalizeFiscalSponsorshipFormBFields({
    applicationDate:
      loaded.application.submitted_at?.slice(0, 10) ?? generatedAt.slice(0, 10),
    applicantFullName:
      loaded.application.applicant_full_name ??
      [
        loaded.application.applicant_first_name,
        loaded.application.applicant_last_name,
      ]
        .filter(Boolean)
        .join(" "),
    legalEntityName: getApplicationOrganizationName(loaded.application),
    legalEntityType: formatFiscalSponsorshipLegalEntityType(
      loaded.application.legal_entity_type
    ),
    mailingCity: loaded.application.mailing_city ?? "",
    mailingPostalCode: loaded.application.mailing_postal_code ?? "",
    mailingState: loaded.application.mailing_state ?? "",
    mailingStreetAddress: loaded.application.mailing_street_address ?? "",
    mailingStreetAddress2: loaded.application.mailing_street_address_2 ?? "",
    phoneNumber: loaded.application.phone_number ?? "",
    primaryEmail: loaded.application.primary_email ?? "",
    projectId: `CH-${loaded.application.project_id.replaceAll("-", "").slice(0, 8).toUpperCase()}`,
    projectName: loaded.application.project_name ?? "",
  })
  const fieldErrors = validateFiscalSponsorshipFormBFields(fields)
  const firstFieldError = Object.values(fieldErrors)[0]
  if (firstFieldError) return { error: firstFieldError }

  const agreement = await buildFiscalSponsorshipFormBPdf({ fields })
  const filename = "form-b-fiscal-sponsorship-agreement.pdf"
  const title = "Form B Fiscal Sponsorship Agreement"
  const mime = "application/pdf"
  const storagePath = `${loaded.application.org_id}/${loaded.application.project_id}/${loaded.application.id}/generated/${randomUUID()}-${sanitizeAgreementFilename(filename)}`
  const admin = createSupabaseAdminClient()
  const { error: uploadError } = await admin.storage
    .from("fiscal-signing")
    .upload(storagePath, agreement.bytes, { contentType: mime })
  if (uploadError) {
    return { error: "Unable to upload generated fiscal sponsorship agreement." }
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
      asset_id: null,
      field_values: fields,
      field_values_sha256: sha256Hex(JSON.stringify(fields)),
      file_sha256: agreement.sha256,
      generated_at: generatedAt,
      generated_by: context.user.id,
      kind: "agreement",
      metadata: { filename, storageBucket: "fiscal-signing" },
      mime,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      size_bytes: agreement.bytes.length,
      source_snapshot: {
        application: mapFiscalApplicationRow(loaded.application),
        generatedAt,
      },
      status: "generated" satisfies FiscalSponsorshipDocumentStatus,
      storage_bucket: "fiscal-signing",
      storage_path: storagePath,
      template_key: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.key,
      template_sha256: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256,
      template_version: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version,
      title,
      version: nextVersion,
    })
    .select("id")
    .single<{ id: string }>()
  if (documentError) {
    await admin.storage.from("fiscal-signing").remove([storagePath])
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
    metadata: { documentId: document.id, fileSha256: agreement.sha256 },
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
    assetId: null,
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
  if (
    documentResult.document.storage_bucket !== "fiscal-signing" ||
    documentResult.document.template_key !==
      FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.key ||
    documentResult.document.template_sha256 !==
      FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256 ||
    documentResult.document.template_version !==
      FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version ||
    !documentResult.document.file_sha256
  ) {
    return { error: "Generate the native Form B agreement before sending." }
  }
  const fields = normalizeFiscalSponsorshipFormBFields(
    (documentResult.document.field_values ?? {}) as Record<string, string>
  )

  const sentAt = new Date().toISOString()
  const { data: packet, error: packetError } = await context.supabase
    .from("fiscal_sponsorship_signature_packets")
    .insert({
      applicant_signer_email: applicantEmail,
      applicant_signer_id: loaded.application.org_id,
      applicant_signer_name: applicantName,
      application_id: loaded.application.id,
      coach_signer_email: null,
      coach_signer_name: null,
      document_id: documentResult.document.id,
      org_id: loaded.application.org_id,
      project_id: loaded.application.project_id,
      current_document_sha256: documentResult.document.file_sha256,
      provider: "native",
      provider_payload: {},
      provider_submission_id: null,
      provider_template_id: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.key,
      sent_at: sentAt,
      sent_by: context.user.id,
      status: "sent",
      source_document_sha256: documentResult.document.file_sha256,
      template_version: String(FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version),
    })
    .select("id")
    .single<{ id: string }>()
  if (packetError) {
    return isMissingFiscalWorkflowTableError(packetError)
      ? buildWorkflowTableError()
      : { error: "Unable to save fiscal sponsorship signature packet." }
  }

  const { error: draftError } = await context.supabase
    .from("fiscal_sponsorship_signing_drafts")
    .insert({
      application_id: loaded.application.id,
      confirmed_fields: [],
      field_values: fields,
      org_id: loaded.application.org_id,
      packet_id: packet.id,
      project_id: loaded.application.project_id,
      signature_method: "typed",
      signature_value: applicantName,
      signer_id: loaded.application.org_id,
      signer_role: "applicant",
    })
  if (draftError) {
    await createSupabaseAdminClient()
      .from("fiscal_sponsorship_signature_packets")
      .delete()
      .eq("id", packet.id)
    return { error: "Unable to initialize the native signing draft." }
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
      provider: "native",
      providerSubmissionId: null,
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
    providerSubmissionId: null,
  })

  revalidateFiscalApplicationRoutes(loaded.application.project_id)
  return {
    ok: true,
    applicationId: loaded.application.id,
    packetId: packet.id,
    providerSubmissionId: null,
  }
}
