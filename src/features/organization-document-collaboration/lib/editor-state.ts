import type { DocumentErrorCode } from "../types"

export type DocumentPersistenceStatus = "Connecting…" | "Not connected" | "Saved" | "Saving…" | "Not saved" | "Waiting for image upload…" | "Offline · edits retained"

export function documentFailurePolicy(code?: DocumentErrorCode) {
  const accessDenied = code === "denied" || code === "unauthenticated"
  const reopenIfClean = code === "external_change" || code === "expired"
  const blocked = accessDenied || reopenIfClean || code === "budget_conflict" || code === "invalid"
  return { accessDenied, reopenIfClean, blocked, retryable: !blocked }
}
