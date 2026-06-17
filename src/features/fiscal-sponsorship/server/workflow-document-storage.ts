"use server"

import { randomUUID } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import type { FiscalDocuSealDocumentReference } from "./docuseal-documents"
import { downloadFiscalSponsorshipDocuSealDocument } from "./docuseal-documents"
import { sanitizeAgreementFilename } from "./workflow-support"

type FiscalWorkflowClient = SupabaseClient<Database, "public">

type FiscalPacketDocumentStorageRow = {
  application_id: string
  audit_document_id: string | null
  document_id: string
  executed_document_id: string | null
  id: string
  org_id: string
  project_id: string
}

type PersistFiscalExecutedDocumentsInput = {
  auditDocumentUrl?: string | null
  packet: FiscalPacketDocumentStorageRow
  providerPayload: unknown
  signedDocuments: FiscalDocuSealDocumentReference[]
  submissionDocumentsPayload: unknown
  submissionId: string
  supabase: FiscalWorkflowClient
}

type PersistFiscalExecutedDocumentsResult =
  | {
      auditDocumentId: string | null
      executedDocumentId: string | null
      ok: true
    }
  | { error: string }

type StoreFiscalDocumentInput = {
  description: string
  document: FiscalDocuSealDocumentReference
  kind: "audit_certificate" | "executed_agreement"
  packet: FiscalPacketDocumentStorageRow
  providerPayload: unknown
  submissionDocumentsPayload: unknown
  submissionId: string
  supabase: FiscalWorkflowClient
  title: string
}

function buildStoredFilename({
  fallback,
  name,
}: {
  fallback: string
  name: string
}) {
  const sanitized = sanitizeAgreementFilename(name || fallback)
  return sanitized.toLowerCase().endsWith(".pdf")
    ? sanitized
    : `${sanitized}.pdf`
}

async function resolveNextFiscalDocumentVersion({
  applicationId,
  kind,
  supabase,
}: {
  applicationId: string
  kind: StoreFiscalDocumentInput["kind"]
  supabase: FiscalWorkflowClient
}) {
  const { data } = await supabase
    .from("fiscal_sponsorship_documents")
    .select("version")
    .eq("application_id", applicationId)
    .eq("kind", kind)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>()

  return (data?.version ?? 0) + 1
}

async function storeFiscalDocument({
  description,
  document,
  kind,
  packet,
  providerPayload,
  submissionDocumentsPayload,
  submissionId,
  supabase,
  title,
}: StoreFiscalDocumentInput) {
  const downloaded = await downloadFiscalSponsorshipDocuSealDocument(document)
  if ("error" in downloaded) return downloaded

  const filename = buildStoredFilename({
    fallback: title,
    name: document.name,
  })
  const storagePath = `${packet.org_id}/${packet.project_id}/fiscal-sponsorship/${kind}/${randomUUID()}-${filename}`

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(storagePath, downloaded.body, {
      contentType: downloaded.contentType,
    })
  if (uploadError) {
    return { error: `Unable to upload ${title.toLowerCase()}.` }
  }

  const { data: asset, error: assetError } = await supabase
    .from("organization_project_assets")
    .insert({
      asset_type: "doc",
      description,
      mime: downloaded.contentType,
      name: title,
      org_id: packet.org_id,
      project_id: packet.project_id,
      size_bytes: downloaded.sizeBytes,
      storage_path: storagePath,
    })
    .select("id")
    .single<{ id: string }>()

  if (assetError) {
    await supabase.storage.from("project-assets").remove([storagePath])
    return { error: `Unable to save ${title.toLowerCase()} asset.` }
  }

  const version = await resolveNextFiscalDocumentVersion({
    applicationId: packet.application_id,
    kind,
    supabase,
  })
  const { data: fiscalDocument, error: documentError } = await supabase
    .from("fiscal_sponsorship_documents")
    .insert({
      application_id: packet.application_id,
      asset_id: asset.id,
      kind,
      metadata: {
        provider: "docuseal",
        sourceUrl: document.url,
        submissionId,
      },
      mime: downloaded.contentType,
      org_id: packet.org_id,
      project_id: packet.project_id,
      size_bytes: downloaded.sizeBytes,
      source_snapshot: {
        providerPayload,
        submissionDocumentsPayload,
      },
      status: "executed",
      storage_path: storagePath,
      title,
      version,
    })
    .select("id")
    .single<{ id: string }>()

  if (documentError) {
    await supabase.storage.from("project-assets").remove([storagePath])
    return { error: `Unable to save ${title.toLowerCase()} record.` }
  }

  return { documentId: fiscalDocument.id, ok: true as const }
}

export async function persistFiscalSponsorshipExecutedDocuments({
  auditDocumentUrl,
  packet,
  providerPayload,
  signedDocuments,
  submissionDocumentsPayload,
  submissionId,
  supabase,
}: PersistFiscalExecutedDocumentsInput): Promise<PersistFiscalExecutedDocumentsResult> {
  let executedDocumentId = packet.executed_document_id
  let auditDocumentId = packet.audit_document_id
  const signedDocument = signedDocuments[0]

  if (!executedDocumentId && signedDocument) {
    const stored = await storeFiscalDocument({
      description: "Executed fiscal sponsorship agreement from DocuSeal.",
      document: signedDocument,
      kind: "executed_agreement",
      packet,
      providerPayload,
      submissionDocumentsPayload,
      submissionId,
      supabase,
      title: "Executed fiscal sponsorship agreement",
    })
    if ("error" in stored) return stored
    executedDocumentId = stored.documentId

    const { error: packetUpdateError } = await supabase
      .from("fiscal_sponsorship_signature_packets")
      .update({ executed_document_id: executedDocumentId })
      .eq("id", packet.id)

    if (packetUpdateError) {
      return {
        error: "Unable to link executed agreement to the signature packet.",
      }
    }
  }

  if (!auditDocumentId && auditDocumentUrl) {
    const stored = await storeFiscalDocument({
      description: "DocuSeal audit certificate for fiscal sponsorship signing.",
      document: {
        name: "DocuSeal audit certificate",
        url: auditDocumentUrl,
      },
      kind: "audit_certificate",
      packet,
      providerPayload,
      submissionDocumentsPayload,
      submissionId,
      supabase,
      title: "DocuSeal audit certificate",
    })
    if ("error" in stored) return stored
    auditDocumentId = stored.documentId

    const { error: packetUpdateError } = await supabase
      .from("fiscal_sponsorship_signature_packets")
      .update({ audit_document_id: auditDocumentId })
      .eq("id", packet.id)

    if (packetUpdateError) {
      return {
        error: "Unable to link audit certificate to the signature packet.",
      }
    }
  }

  return {
    auditDocumentId,
    executedDocumentId,
    ok: true,
  }
}
