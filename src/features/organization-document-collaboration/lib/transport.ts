import type { DocumentSyncInput, DocumentSyncResult } from "../types"

// Live document traffic must not wait behind Next's navigation/server-action queue.
export async function syncDocumentOverHttp(input: DocumentSyncInput): Promise<DocumentSyncResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch("/api/account/document-collaboration", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-coach-house-organization-id": input.organizationId },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error("Document request failed")
    return await response.json() as DocumentSyncResult
  } catch {
    return { error: controller.signal.aborted
      ? "Connecting took too long. Try connecting again. Your edits are retained."
      : "Unable to reach the live document. Try connecting again. Your edits are retained." }
  } finally {
    clearTimeout(timeout)
  }
}
