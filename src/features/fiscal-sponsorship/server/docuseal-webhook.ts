"use server"

import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  mapDocuSealWebhookToFiscalStatus,
  resolveDocuSealWebhookAuditLogUrl,
  resolveDocuSealWebhookCombinedDocumentUrl,
  resolveDocuSealWebhookEventType,
  resolveDocuSealWebhookSubmissionId,
} from "../lib/docuseal-webhook-payload"
import type { FiscalSponsorshipDocumentStatus } from "../types"
import { fetchFiscalSponsorshipDocuSealSubmissionDocuments } from "./docuseal-documents"
import { persistFiscalSponsorshipExecutedDocuments } from "./workflow-document-storage"
import { notifyFiscalDocuSealCompleted } from "./workflow-notifications"
import { revalidateFiscalApplicationRoutes } from "./workflow-support"

type FiscalDocuSealWebhookInput = {
  headers: Record<string, string | null | undefined>
  rawBody: string
}

type FiscalDocuSealWebhookResult =
  | { ok: true; ignored?: boolean; status?: number }
  | { error: string; status: number }

type FiscalSignaturePacketWebhookRow = {
  applicant_signer_email: string | null
  application_id: string
  coach_signer_email: string | null
  completed_at: string | null
  document_id: string
  audit_document_id: string | null
  executed_document_id: string | null
  id: string
  metadata: unknown
  org_id: string
  project_id: string
  provider_payload: unknown
  status: string
}

function getHeader(
  headers: FiscalDocuSealWebhookInput["headers"],
  name: string
) {
  return headers[name] ?? headers[name.toLowerCase()] ?? null
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

function normalizeSignature(signature: string) {
  return signature.trim().replace(/^sha256=/i, "")
}

function isValidHmacSignature({
  rawBody,
  secret,
  signature,
}: {
  rawBody: string
  secret: string
  signature: string
}) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  return safeEqual(normalizeSignature(signature), expected)
}

function verifyDocuSealWebhookRequest({
  headers,
  rawBody,
}: FiscalDocuSealWebhookInput): FiscalDocuSealWebhookResult {
  const secret = env.DOCUSEAL_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return {
      error: "DOCUSEAL_WEBHOOK_SECRET is not configured.",
      status: 503,
    }
  }

  const bearerToken = getHeader(headers, "authorization")
    ?.replace(/^bearer\s+/i, "")
    .trim()
  const sharedSecret =
    getHeader(headers, "x-docuseal-webhook-secret") ??
    getHeader(headers, "x-docuseal-secret") ??
    getHeader(headers, "x-webhook-secret")
  const signature =
    getHeader(headers, "x-docuseal-signature") ??
    getHeader(headers, "docuseal-signature") ??
    getHeader(headers, "x-signature")

  if (
    (bearerToken && safeEqual(bearerToken, secret)) ||
    (sharedSecret && safeEqual(sharedSecret, secret)) ||
    (signature && isValidHmacSignature({ rawBody, secret, signature }))
  ) {
    return { ok: true }
  }

  return {
    error: "Invalid DocuSeal webhook signature.",
    status: signature || bearerToken || sharedSecret ? 400 : 401,
  }
}

function parseWebhookPayload(rawBody: string) {
  try {
    return JSON.parse(rawBody) as unknown
  } catch {
    return null
  }
}

function mergePacketMetadata({
  eventType,
  metadata,
  packetStatus,
  receivedAt,
  submissionId,
}: {
  eventType: string
  metadata: unknown
  packetStatus: string
  receivedAt: string
  submissionId: string
}) {
  const existing =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {}

  return {
    ...existing,
    lastDocuSealWebhook: {
      eventType,
      receivedAt,
      status: packetStatus,
      submissionId,
    },
  }
}

export async function handleFiscalSponsorshipDocuSealWebhook({
  headers,
  rawBody,
}: FiscalDocuSealWebhookInput): Promise<FiscalDocuSealWebhookResult> {
  const verified = verifyDocuSealWebhookRequest({ headers, rawBody })
  if ("error" in verified) return verified

  const payload = parseWebhookPayload(rawBody)
  if (!payload) {
    return { error: "Invalid DocuSeal webhook payload.", status: 400 }
  }

  const submissionId = resolveDocuSealWebhookSubmissionId(payload)
  if (!submissionId) {
    return {
      error: "Missing DocuSeal submission id.",
      status: 400,
    }
  }

  const supabase = createSupabaseAdminClient()
  const { data: packet, error: packetError } = await supabase
    .from("fiscal_sponsorship_signature_packets")
    .select(
      [
        "applicant_signer_email",
        "application_id",
        "coach_signer_email",
        "completed_at",
        "document_id",
        "audit_document_id",
        "executed_document_id",
        "id",
        "metadata",
        "org_id",
        "project_id",
        "provider_payload",
        "status",
      ].join(", ")
    )
    .eq("provider", "docuseal")
    .eq("provider_submission_id", submissionId)
    .maybeSingle<FiscalSignaturePacketWebhookRow>()

  if (packetError) {
    console.error("[docuseal-webhook] Unable to load signature packet.", {
      error: packetError,
      submissionId,
    })
    return { error: "Unable to load fiscal signature packet.", status: 500 }
  }

  if (!packet) {
    console.warn("[docuseal-webhook] No matching signature packet.", {
      submissionId,
    })
    return { ok: true, ignored: true, status: 202 }
  }

  const receivedAt = new Date().toISOString()
  const nextStatus = mapDocuSealWebhookToFiscalStatus({
    applicantSignerEmail: packet.applicant_signer_email,
    coachSignerEmail: packet.coach_signer_email,
    currentPacketStatus: packet.status,
    payload,
  })
  const completedAt = nextStatus.completedAt ?? packet.completed_at
  const packetUpdate = {
    completed_at:
      nextStatus.packetStatus === "completed"
        ? completedAt
        : packet.completed_at,
    metadata: mergePacketMetadata({
      eventType: nextStatus.eventType,
      metadata: packet.metadata,
      packetStatus: nextStatus.packetStatus,
      receivedAt,
      submissionId,
    }),
    provider_payload: payload,
    status: nextStatus.packetStatus,
  }

  const { error: packetUpdateError } = await supabase
    .from("fiscal_sponsorship_signature_packets")
    .update(packetUpdate)
    .eq("id", packet.id)

  if (packetUpdateError) {
    console.error("[docuseal-webhook] Unable to update signature packet.", {
      error: packetUpdateError,
      packetId: packet.id,
      submissionId,
    })
    return { error: "Unable to update fiscal signature packet.", status: 500 }
  }

  if (nextStatus.documentStatus) {
    const { error: documentUpdateError } = await supabase
      .from("fiscal_sponsorship_documents")
      .update({
        status:
          nextStatus.documentStatus satisfies FiscalSponsorshipDocumentStatus,
      })
      .eq("id", packet.document_id)

    if (documentUpdateError) {
      console.error("[docuseal-webhook] Unable to update document.", {
        documentId: packet.document_id,
        error: documentUpdateError,
        submissionId,
      })
      return {
        error: "Unable to update fiscal sponsorship document.",
        status: 500,
      }
    }
  }

  if (nextStatus.applicationStatus) {
    const { error: applicationUpdateError } = await supabase
      .from("fiscal_sponsorship_applications")
      .update({
        status: nextStatus.applicationStatus,
      })
      .eq("id", packet.application_id)

    if (applicationUpdateError) {
      console.error("[docuseal-webhook] Unable to update application.", {
        applicationId: packet.application_id,
        error: applicationUpdateError,
        submissionId,
      })
      return {
        error: "Unable to update fiscal sponsorship application.",
        status: 500,
      }
    }
  }

  const eventType = resolveDocuSealWebhookEventType(payload)
  let executedDocumentId: string | null = packet.executed_document_id
  let auditDocumentId: string | null = packet.audit_document_id

  if (nextStatus.packetStatus === "completed") {
    const submissionDocuments =
      await fetchFiscalSponsorshipDocuSealSubmissionDocuments(submissionId)
    const combinedDocumentUrl =
      resolveDocuSealWebhookCombinedDocumentUrl(payload)
    const signedDocuments = combinedDocumentUrl
      ? [
          {
            name: "Executed fiscal sponsorship agreement",
            url: combinedDocumentUrl,
          },
        ]
      : "error" in submissionDocuments
        ? []
        : submissionDocuments.documents

    if (signedDocuments.length === 0) {
      return {
        error:
          "Fiscal sponsorship was signed, but DocuSeal has not returned final documents yet.",
        status: 500,
      }
    }

    const persisted = await persistFiscalSponsorshipExecutedDocuments({
      auditDocumentUrl: resolveDocuSealWebhookAuditLogUrl(payload),
      packet,
      providerPayload: payload,
      signedDocuments,
      submissionDocumentsPayload:
        "error" in submissionDocuments
          ? { error: submissionDocuments.error }
          : submissionDocuments.providerPayload,
      submissionId,
      supabase,
    })

    if ("error" in persisted) {
      return { error: persisted.error, status: 500 }
    }

    executedDocumentId = persisted.executedDocumentId
    auditDocumentId = persisted.auditDocumentId
  }

  const alreadyCurrent =
    packet.status === nextStatus.packetStatus &&
    (nextStatus.packetStatus !== "completed" || Boolean(packet.completed_at))

  if (!alreadyCurrent) {
    const { error: eventError } = await supabase
      .from("fiscal_sponsorship_events")
      .insert({
        actor_id: null,
        application_id: packet.application_id,
        event_type: `docuseal_${eventType.replaceAll(".", "_")}`,
        metadata: {
          documentId: packet.document_id,
          packetId: packet.id,
          provider: "docuseal",
          auditDocumentId,
          executedDocumentId,
          status: nextStatus.packetStatus,
          submissionId,
        },
        org_id: packet.org_id,
        project_id: packet.project_id,
        summary: nextStatus.summary,
      })

    if (eventError) {
      console.error("[docuseal-webhook] Unable to persist event.", {
        error: eventError,
        packetId: packet.id,
        submissionId,
      })
      return { error: "Unable to persist fiscal webhook event.", status: 500 }
    }

    if (nextStatus.packetStatus === "completed") {
      await notifyFiscalDocuSealCompleted({
        applicationId: packet.application_id,
        auditDocumentId,
        executedDocumentId,
        orgId: packet.org_id,
        projectId: packet.project_id,
        submissionId,
      })
    }
  }

  revalidateFiscalApplicationRoutes(packet.project_id)
  return { ok: true, status: 200 }
}
