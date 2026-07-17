"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  FISCAL_SPONSORSHIP_FORM_B_REQUIRED_FIELDS,
  FISCAL_SPONSORSHIP_FORM_B_TEMPLATE,
  normalizeFiscalSponsorshipFormBFields,
  validateFiscalSponsorshipFormBFields,
  type FiscalSponsorshipFormBFields,
} from "../lib/form-b-field-manifest"
import {
  buildFiscalSponsorshipAuditCertificatePdf,
  buildFiscalSponsorshipFormBPdf,
  sha256Hex,
  type FiscalSponsorshipNativeSignature,
} from "../lib/form-b-pdf"
import type {
  CompleteFiscalSponsorshipSignatureInput,
  CompleteFiscalSponsorshipSignatureResult,
  SaveFiscalSponsorshipSigningDraftInput,
  SaveFiscalSponsorshipSigningDraftResult,
} from "../types"
import {
  FISCAL_SPONSORSHIP_CONSENT_TEXT,
  FISCAL_SPONSORSHIP_CONSENT_VERSION,
  FISCAL_SPONSORSHIP_SIGNING_BUCKET,
  canRoleSign,
  getSignatureForRole,
  parseFormBFields,
  resolveSigningContext,
  toNativeSignature,
  validateSignerTitle,
  validateSignatureValue,
  type SigningContext,
} from "./native-signing-context"
import { notifyFiscalNativeAgreementCompleted } from "./workflow-notifications"

export async function saveFiscalSponsorshipSigningDraft(
  input: SaveFiscalSponsorshipSigningDraftInput
): Promise<SaveFiscalSponsorshipSigningDraftResult> {
  try {
    const context = await resolveSigningContext(input.packetId)
    if ("error" in context) return context
    if (!canRoleSign(context))
      return { error: "This signature step is not currently available." }

    const fields =
      context.role === "applicant"
        ? normalizeFiscalSponsorshipFormBFields(input.fields)
        : parseFormBFields(context.document.field_values)
    if (!fields) return { error: "The Form B field snapshot is unavailable." }
    const signatureError = input.signatureValue
      ? validateSignatureValue({
          method: input.signatureMethod,
          value: input.signatureValue,
        })
      : null
    if (signatureError && input.signatureMethod === "drawn")
      return { error: signatureError }
    if (input.signerTitle.length > 120) {
      return { error: "Signer titles must be 120 characters or fewer." }
    }

    const currentRevision = context.draft?.revision ?? 0
    if (input.expectedRevision !== currentRevision) {
      return {
        error:
          "This draft changed in another session. Reload before continuing.",
        stale: true,
      }
    }

    const now = new Date().toISOString()
    const nextRevision = currentRevision + 1
    const payload = {
      application_id: context.packet.application_id,
      confirmed_fields: input.confirmed
        ? [...FISCAL_SPONSORSHIP_FORM_B_REQUIRED_FIELDS]
        : [],
      field_values: fields,
      org_id: context.packet.org_id,
      packet_id: context.packet.id,
      project_id: context.packet.project_id,
      revision: nextRevision,
      signature_method: input.signatureMethod,
      signature_value: input.signatureValue || null,
      signer_id: context.appContext.user.id,
      signer_role: context.role,
      signer_title: input.signerTitle.trim() || null,
      updated_at: now,
    }
    const mutation = context.draft
      ? context.appContext.supabase
          .from("fiscal_sponsorship_signing_drafts")
          .update(payload)
          .eq("id", context.draft.id)
          .eq("revision", currentRevision)
      : context.appContext.supabase
          .from("fiscal_sponsorship_signing_drafts")
          .insert(payload)
    const { data, error } = await mutation
      .select("revision, updated_at")
      .maybeSingle<{ revision: number; updated_at: string }>()
    if (error || !data) {
      return {
        error: "Unable to save this signing draft. Reload and try again.",
        stale: true,
      }
    }

    return { ok: true, revision: data.revision, updatedAt: data.updated_at }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the signing draft.",
    }
  }
}

async function uploadPrivatePdf({
  bytes,
  path,
}: {
  bytes: Uint8Array
  path: string
}) {
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage
    .from(FISCAL_SPONSORSHIP_SIGNING_BUCKET)
    .upload(path, bytes, {
      cacheControl: "private, max-age=0, no-store",
      contentType: "application/pdf",
      upsert: false,
    })
  if (error) throw new Error("Unable to store the signed agreement.")
}

async function verifyApplicantSourceIntegrity(context: SigningContext) {
  const expectedSha256 = context.document.file_sha256
  if (
    !expectedSha256 ||
    !context.document.storage_path ||
    context.document.template_key !== FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.key ||
    context.document.template_sha256 !==
      FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256 ||
    context.document.template_version !==
      FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version ||
    context.packet.source_document_sha256 !== expectedSha256 ||
    context.packet.current_document_sha256 !== expectedSha256
  ) {
    throw new Error(
      "Agreement integrity check failed. Void and regenerate this packet."
    )
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.storage
    .from(context.document.storage_bucket)
    .download(context.document.storage_path)
  if (error || !data) throw new Error("Agreement source file is unavailable.")
  const actualSha256 = sha256Hex(new Uint8Array(await data.arrayBuffer()))
  if (actualSha256 !== expectedSha256) {
    throw new Error(
      "Agreement integrity check failed. Void and regenerate this packet."
    )
  }
}

function buildSignatureEvidence({
  context,
  documentSha256,
  input,
  signedAt,
}: {
  context: SigningContext
  documentSha256: string
  input: CompleteFiscalSponsorshipSignatureInput
  signedAt: string
}) {
  const consentSha256 = sha256Hex(
    `${FISCAL_SPONSORSHIP_CONSENT_VERSION}\n${FISCAL_SPONSORSHIP_CONSENT_TEXT}`
  )
  const signatureSha256 = sha256Hex(
    JSON.stringify({
      consentSha256,
      documentSha256,
      method: input.signatureMethod,
      packetId: context.packet.id,
      role: context.role,
      signedAt,
      signerId: context.appContext.user.id,
      signerTitle: input.signerTitle.trim(),
      value: input.signatureValue,
    })
  )
  return { consentSha256, signatureSha256 }
}

async function completeApplicantSignature({
  context,
  fields,
  input,
}: {
  context: SigningContext
  fields: FiscalSponsorshipFormBFields
  input: CompleteFiscalSponsorshipSignatureInput
}) {
  await verifyApplicantSourceIntegrity(context)
  const signedAt = new Date().toISOString()
  const unsigned = await buildFiscalSponsorshipFormBPdf({ fields })
  const evidence = buildSignatureEvidence({
    context,
    documentSha256: unsigned.sha256,
    input,
    signedAt,
  })
  const applicantSignature: FiscalSponsorshipNativeSignature = {
    method: input.signatureMethod,
    signatureSha256: evidence.signatureSha256,
    signedAt,
    signerEmail: context.signerEmail || null,
    signerName: context.signerName,
    signerTitle: input.signerTitle.trim(),
    value: input.signatureValue,
  }
  const partial = await buildFiscalSponsorshipFormBPdf({
    applicantSignature,
    fields,
  })
  const storagePath = `${context.packet.org_id}/${context.packet.project_id}/${context.packet.application_id}/${context.packet.id}/partial/${randomUUID()}.pdf`
  await uploadPrivatePdf({ bytes: partial.bytes, path: storagePath })
  const requestHeaders = await headers()
  const admin = createSupabaseAdminClient()
  const { error } = await admin.rpc(
    "finalize_fiscal_sponsorship_applicant_signature",
    {
      p_packet_id: context.packet.id,
      p_payload: {
        consentSha256: evidence.consentSha256,
        consentText: FISCAL_SPONSORSHIP_CONSENT_TEXT,
        consentVersion: FISCAL_SPONSORSHIP_CONSENT_VERSION,
        expectedRevision: input.expectedRevision,
        fields,
        fieldValuesSha256: sha256Hex(JSON.stringify(fields)),
        partialDocumentSha256: partial.sha256,
        partialSizeBytes: partial.bytes.length,
        partialStoragePath: storagePath,
        signatureMethod: input.signatureMethod,
        signatureSha256: evidence.signatureSha256,
        signatureValue: input.signatureValue,
        signedAt,
        signedDocumentSha256: unsigned.sha256,
        signerEmail: context.signerEmail,
        signerId: context.appContext.user.id,
        signerName: context.signerName,
        signerTitle: input.signerTitle.trim(),
        templateKey: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.key,
        templateSha256: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256,
        templateVersion: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version,
        userAgent: requestHeaders.get("user-agent") ?? "",
      },
    }
  )
  if (error) throw new Error("Unable to finalize the applicant signature.")
  return "applicant_signed" as const
}

async function completeCoachSignature({
  context,
  fields,
  input,
}: {
  context: SigningContext
  fields: FiscalSponsorshipFormBFields
  input: CompleteFiscalSponsorshipSignatureInput
}) {
  const applicantRow = getSignatureForRole(context.signatures, "applicant")
  if (!applicantRow) throw new Error("Applicant signature evidence is missing.")
  const applicantSignature = toNativeSignature(applicantRow)
  const partial = await buildFiscalSponsorshipFormBPdf({
    applicantSignature,
    fields,
  })
  if (
    context.packet.current_document_sha256 &&
    partial.sha256 !== context.packet.current_document_sha256
  ) {
    throw new Error(
      "Agreement integrity check failed. Void and regenerate this packet."
    )
  }

  const signedAt = new Date().toISOString()
  const evidence = buildSignatureEvidence({
    context,
    documentSha256: partial.sha256,
    input,
    signedAt,
  })
  const coachHouseSignature: FiscalSponsorshipNativeSignature = {
    method: input.signatureMethod,
    signatureSha256: evidence.signatureSha256,
    signedAt,
    signerEmail: context.signerEmail || null,
    signerName: context.signerName,
    signerTitle: input.signerTitle.trim(),
    value: input.signatureValue,
  }
  const executed = await buildFiscalSponsorshipFormBPdf({
    applicantSignature,
    coachHouseSignature,
    fields,
  })
  const audit = await buildFiscalSponsorshipAuditCertificatePdf({
    applicant: applicantSignature,
    applicationId: context.packet.application_id,
    coachHouse: coachHouseSignature,
    consentVersion: FISCAL_SPONSORSHIP_CONSENT_VERSION,
    executedDocumentSha256: executed.sha256,
    packetId: context.packet.id,
    projectId: context.packet.project_id,
    templateSha256: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256,
  })
  const basePath = `${context.packet.org_id}/${context.packet.project_id}/${context.packet.application_id}/${context.packet.id}`
  const executedPath = `${basePath}/executed/${randomUUID()}.pdf`
  const auditPath = `${basePath}/audit/${randomUUID()}.pdf`
  await uploadPrivatePdf({ bytes: executed.bytes, path: executedPath })
  await uploadPrivatePdf({ bytes: audit.bytes, path: auditPath })
  const requestHeaders = await headers()
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "finalize_fiscal_sponsorship_coach_signature",
    {
      p_packet_id: context.packet.id,
      p_payload: {
        auditDocumentSha256: audit.sha256,
        auditSizeBytes: audit.bytes.length,
        auditStoragePath: auditPath,
        consentSha256: evidence.consentSha256,
        consentText: FISCAL_SPONSORSHIP_CONSENT_TEXT,
        consentVersion: FISCAL_SPONSORSHIP_CONSENT_VERSION,
        executedDocumentSha256: executed.sha256,
        executedSizeBytes: executed.bytes.length,
        executedStoragePath: executedPath,
        expectedRevision: input.expectedRevision,
        fields,
        fieldValuesSha256: sha256Hex(JSON.stringify(fields)),
        signatureMethod: input.signatureMethod,
        signatureSha256: evidence.signatureSha256,
        signatureValue: input.signatureValue,
        signedAt,
        signedDocumentSha256: partial.sha256,
        signerEmail: context.signerEmail,
        signerId: context.appContext.user.id,
        signerName: context.signerName,
        signerTitle: input.signerTitle.trim(),
        templateKey: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.key,
        templateSha256: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256,
        templateVersion: FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version,
        userAgent: requestHeaders.get("user-agent") ?? "",
      },
    }
  )
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Unable to finalize the Coach House signature.")
  }
  const auditDocumentId = data.auditDocumentId
  const executedDocumentId = data.executedDocumentId
  if (
    typeof auditDocumentId !== "string" ||
    typeof executedDocumentId !== "string"
  ) {
    throw new Error("Completed agreement document references are unavailable.")
  }
  await notifyFiscalNativeAgreementCompleted({
    actorId: context.appContext.user.id,
    applicationId: context.packet.application_id,
    auditDocumentId,
    executedDocumentId,
    orgId: context.packet.org_id,
    packetId: context.packet.id,
    projectId: context.packet.project_id,
    projectName: context.projectName,
  })
  return "completed" as const
}

export async function completeFiscalSponsorshipSignature(
  input: CompleteFiscalSponsorshipSignatureInput
): Promise<CompleteFiscalSponsorshipSignatureResult> {
  try {
    const context = await resolveSigningContext(input.packetId)
    if ("error" in context) return context
    if (!canRoleSign(context))
      return { error: "This signature step is not currently available." }
    if (input.expectedRevision !== (context.draft?.revision ?? 0)) {
      return {
        error: "This draft changed in another session. Reload before signing.",
      }
    }
    if (!input.consented || !input.authorized || !input.confirmed) {
      return {
        error:
          "Confirm the document, electronic consent, and signing authority.",
      }
    }

    const signatureError = validateSignatureValue({
      method: input.signatureMethod,
      value: input.signatureValue,
    })
    if (signatureError) return { error: signatureError, field: "signature" }
    const signerTitleError = validateSignerTitle(input.signerTitle)
    if (signerTitleError) {
      return { error: signerTitleError, field: "signerTitle" }
    }

    const fields =
      context.role === "applicant"
        ? normalizeFiscalSponsorshipFormBFields(input.fields)
        : parseFormBFields(context.document.field_values)
    if (!fields) return { error: "The Form B field snapshot is unavailable." }
    const fieldErrors = validateFiscalSponsorshipFormBFields(fields)
    const firstFieldError = Object.entries(fieldErrors)[0]
    if (firstFieldError)
      return { error: firstFieldError[1], field: firstFieldError[0] }

    const status =
      context.role === "applicant"
        ? await completeApplicantSignature({ context, fields, input })
        : await completeCoachSignature({ context, fields, input })

    revalidatePath(`/fiscal-sponsorship/sign/${context.packet.id}`)
    revalidatePath("/workspace")
    revalidatePath("/my-organization")
    revalidatePath(`/organizations/${context.packet.org_id}`)
    return { ok: true, packetId: context.packet.id, status }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete the signature.",
    }
  }
}
