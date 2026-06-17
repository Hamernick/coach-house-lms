"use server"

import { getFiscalSponsorshipDocuSealConfig } from "./docuseal"

export type FiscalDocuSealDocumentReference = {
  name: string
  url: string
}

type FetchFiscalDocuSealDocumentsResult =
  | {
      documents: FiscalDocuSealDocumentReference[]
      ok: true
      providerPayload: unknown
    }
  | { error: string }

type DownloadFiscalDocuSealDocumentResult =
  | {
      body: Buffer
      contentType: string
      ok: true
      sizeBytes: number
    }
  | { error: string }

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function parseDocumentReference(
  value: unknown
): FiscalDocuSealDocumentReference | null {
  const record = asRecord(value)
  const url = getString(record?.url)
  if (!url) return null

  return {
    name: getString(record?.name) ?? "Fiscal sponsorship signed agreement",
    url,
  }
}

function parseDocumentReferences(payload: unknown) {
  const record = asRecord(payload)
  const documents = Array.isArray(record?.documents) ? record.documents : []

  return documents
    .map(parseDocumentReference)
    .filter(Boolean) as FiscalDocuSealDocumentReference[]
}

function assertDownloadableHttpsUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:"
  } catch {
    return false
  }
}

export async function fetchFiscalSponsorshipDocuSealSubmissionDocuments(
  submissionId: string
): Promise<FetchFiscalDocuSealDocumentsResult> {
  const config = getFiscalSponsorshipDocuSealConfig()
  if ("error" in config) return config

  const url = new URL(
    `/submissions/${encodeURIComponent(submissionId)}/documents`,
    config.apiBaseUrl
  )
  url.searchParams.set("merge", "true")

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": config.apiKey,
    },
    method: "GET",
  })
  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    return { error: "Unable to fetch signed DocuSeal documents." }
  }

  const documents = parseDocumentReferences(payload)
  if (documents.length === 0) {
    return { error: "DocuSeal did not return signed document URLs yet." }
  }

  return {
    documents,
    ok: true,
    providerPayload: payload,
  }
}

export async function downloadFiscalSponsorshipDocuSealDocument(
  document: FiscalDocuSealDocumentReference
): Promise<DownloadFiscalDocuSealDocumentResult> {
  if (!assertDownloadableHttpsUrl(document.url)) {
    return { error: "DocuSeal returned an invalid document URL." }
  }

  const response = await fetch(document.url, { method: "GET" })
  if (!response.ok) {
    return { error: "Unable to download signed DocuSeal document." }
  }

  const arrayBuffer = await response.arrayBuffer()
  const body = Buffer.from(arrayBuffer)

  return {
    body,
    contentType: response.headers.get("content-type") ?? "application/pdf",
    ok: true,
    sizeBytes: body.byteLength,
  }
}
