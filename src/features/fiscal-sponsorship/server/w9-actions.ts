"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  FISCAL_SPONSORSHIP_W9_CONSENT_TEXT,
  FISCAL_SPONSORSHIP_W9_CONSENT_VERSION,
  FISCAL_SPONSORSHIP_W9_TEMPLATE,
  getFiscalSponsorshipW9CertificationText,
  normalizeFiscalSponsorshipW9Fields,
  redactFiscalSponsorshipW9Fields,
  validateFiscalSponsorshipW9Fields,
} from "../lib/w9-field-manifest"
import { buildFiscalSponsorshipW9Pdf, sha256W9 } from "../lib/w9-pdf"
import type {
  CompleteFiscalSponsorshipW9Input,
  CompleteFiscalSponsorshipW9Result,
  FiscalSponsorshipW9Session,
  LoadFiscalSponsorshipW9SessionResult,
} from "../types"
import {
  validateSignatureValue,
  FISCAL_SPONSORSHIP_SIGNING_BUCKET,
} from "./native-signing-context"
import { notifyFiscalDocumentConnected } from "./workflow-notifications"
import { getApplicationOrganizationName } from "./workflow-support"
import { transitionFiscalW9Completion } from "./w9-transition-support"
import {
  buildW9Prefill,
  loadW9Context,
  parsePreviousW9Fields,
} from "./w9-session-support"

export async function loadFiscalSponsorshipW9Session(
  projectId: string
): Promise<LoadFiscalSponsorshipW9SessionResult> {
  try {
    const loaded = await loadW9Context(projectId)
    if ("error" in loaded) return loaded
    const admin = createSupabaseAdminClient()
    const { data: previousDocument, error: previousError } = await admin
      .from("fiscal_sponsorship_documents")
      .select("field_values, id")
      .eq("application_id", loaded.application.id)
      .eq("document_key", "tax_id_confirmation")
      .eq("kind", "tax_form")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle<{ field_values: unknown; id: string }>()
    if (previousError) {
      return { error: "Unable to load the existing W-9 record." }
    }

    const organizationName = getApplicationOrganizationName(loaded.application)
    const session: FiscalSponsorshipW9Session = {
      applicationId: loaded.application.id,
      existingDocumentHref: previousDocument
        ? `/api/fiscal-sponsorship/documents/${previousDocument.id}`
        : null,
      existingDocumentId: previousDocument?.id ?? null,
      fields: buildW9Prefill({
        application: loaded.application,
        organizationName,
        previousFields: parsePreviousW9Fields(previousDocument?.field_values),
      }),
      organizationId: loaded.application.org_id,
      organizationName,
      projectId: loaded.application.project_id,
      projectName:
        loaded.application.project_name?.trim() || "Fiscal Sponsorship Project",
      signerEmail: loaded.signer.email,
      signerName: loaded.signer.name,
    }
    return { ok: true, session }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to load the W-9 form.",
    }
  }
}

export async function completeFiscalSponsorshipW9(
  input: CompleteFiscalSponsorshipW9Input
): Promise<CompleteFiscalSponsorshipW9Result> {
  let uploadedPath: string | null = null
  try {
    const loaded = await loadW9Context(input.projectId)
    if ("error" in loaded) return loaded
    if (!input.certified || !input.consented || !input.authorized) {
      return {
        error:
          "Confirm the W-9 certification, electronic consent, and signing authority.",
      }
    }

    const fields = normalizeFiscalSponsorshipW9Fields(input.fields)
    const fieldErrors = validateFiscalSponsorshipW9Fields(fields)
    const firstFieldError = Object.entries(fieldErrors)[0]
    if (firstFieldError) {
      return { error: firstFieldError[1], field: firstFieldError[0] }
    }
    const signatureError = validateSignatureValue({
      method: input.signatureMethod,
      value: input.signatureValue,
    })
    if (signatureError) return { error: signatureError, field: "signature" }

    const signedAt = new Date().toISOString()
    const signatureValue = input.signatureValue.trim()
    const signatureSha256 = sha256W9(
      JSON.stringify({
        method: input.signatureMethod,
        signedAt,
        signerId: loaded.signer.id,
        value: signatureValue,
      })
    )
    const pdf = await buildFiscalSponsorshipW9Pdf({
      fields,
      signature: {
        method: input.signatureMethod,
        signedAt,
        signerName: loaded.signer.name,
        value: signatureValue,
      },
    })
    const redactedFields = redactFiscalSponsorshipW9Fields(fields)
    const redactedFieldsSha256 = sha256W9(JSON.stringify(redactedFields))
    const consentSha256 = sha256W9(
      `${FISCAL_SPONSORSHIP_W9_CONSENT_VERSION}:${FISCAL_SPONSORSHIP_W9_CONSENT_TEXT}`
    )
    const certificationText = getFiscalSponsorshipW9CertificationText(
      fields.subjectToBackupWithholding
    )
    const certificationSha256 = sha256W9(certificationText)
    const storagePath = `${loaded.application.org_id}/${loaded.application.project_id}/${loaded.application.id}/w9/${randomUUID()}-form-w-9.pdf`
    uploadedPath = storagePath
    const admin = createSupabaseAdminClient()
    const { error: uploadError } = await admin.storage
      .from(FISCAL_SPONSORSHIP_SIGNING_BUCKET)
      .upload(storagePath, pdf.bytes, { contentType: "application/pdf" })
    if (uploadError) throw new Error("Unable to store the signed W-9.")

    const requestHeaders = await headers()
    const transition = await transitionFiscalW9Completion({
      actorId: loaded.signer.id,
      applicationId: loaded.application.id,
      document: {
        application_id: loaded.application.id,
        asset_id: null,
        confirmed_at: signedAt,
        confirmed_by: loaded.signer.id,
        document_key: "tax_id_confirmation",
        field_values: redactedFields,
        field_values_sha256: redactedFieldsSha256,
        file_sha256: pdf.sha256,
        generated_at: signedAt,
        generated_by: loaded.signer.id,
        kind: "tax_form",
        locked_at: signedAt,
        metadata: {
          certificationSha256,
          certificationText,
          consentSha256,
          consentText: FISCAL_SPONSORSHIP_W9_CONSENT_TEXT,
          consentVersion: FISCAL_SPONSORSHIP_W9_CONSENT_VERSION,
          signatureMethod: input.signatureMethod,
          signatureSha256,
          signedAt,
          signerEmail: loaded.signer.email,
          signerId: loaded.signer.id,
          signerName: loaded.signer.name,
          tinLast4: redactedFields.tinLast4,
          tinType: redactedFields.tinType,
          userAgent: requestHeaders.get("user-agent") ?? "",
        },
        mime: "application/pdf",
        org_id: loaded.application.org_id,
        project_id: loaded.application.project_id,
        review_status: "pending",
        size_bytes: pdf.bytes.length,
        source_snapshot: {
          generatedBy: "coach-house-native-w9",
          templateRevision: FISCAL_SPONSORSHIP_W9_TEMPLATE.revision,
        },
        status: "executed",
        storage_bucket: FISCAL_SPONSORSHIP_SIGNING_BUCKET,
        storage_path: storagePath,
        template_key: FISCAL_SPONSORSHIP_W9_TEMPLATE.key,
        template_sha256: FISCAL_SPONSORSHIP_W9_TEMPLATE.sha256,
        template_version: FISCAL_SPONSORSHIP_W9_TEMPLATE.version,
        title: "Signed IRS Form W-9",
        uploaded_at: signedAt,
        uploaded_by: loaded.signer.id,
      },
      expectedUpdatedAt: loaded.application.updated_at,
    })
    if (transition.ok !== true) {
      await admin.storage
        .from(FISCAL_SPONSORSHIP_SIGNING_BUCKET)
        .remove([storagePath])
      uploadedPath = null
      return { error: transition.error }
    }

    await notifyFiscalDocumentConnected({
      actorId: loaded.signer.id,
      application: loaded.application,
      documentId: transition.documentId,
      documentKey: "tax_id_confirmation",
    })

    revalidatePath("/workspace")
    revalidatePath("/my-organization")
    revalidatePath(`/organizations/${loaded.application.project_id}`)
    revalidatePath(`/fiscal-sponsorship/w9/${loaded.application.project_id}`)
    return {
      ok: true,
      documentHref: `/api/fiscal-sponsorship/documents/${transition.documentId}`,
      documentId: transition.documentId,
      redactedFields,
    }
  } catch (error) {
    if (uploadedPath) {
      await createSupabaseAdminClient()
        .storage.from(FISCAL_SPONSORSHIP_SIGNING_BUCKET)
        .remove([uploadedPath])
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete the signed W-9.",
    }
  }
}
