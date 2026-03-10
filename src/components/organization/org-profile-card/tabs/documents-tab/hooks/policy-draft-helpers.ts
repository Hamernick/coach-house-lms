import { normalizeCategories } from "../helpers"
import type { DocumentsPolicyEntry, PolicyDraft } from "../types"

type SavePolicyPayload = {
  id?: string
  title: string
  summary: string
  status: DocumentsPolicyEntry["status"]
  categories: string[]
  programId: string | null
  personIds: string[]
}

export function createEmptyPolicyDraft(): PolicyDraft {
  return {
    title: "",
    summary: "",
    status: "not_started",
    categories: [],
    programId: "",
    personIds: [],
    document: null,
  }
}

export function toPolicyDraft(policy: DocumentsPolicyEntry): PolicyDraft {
  return {
    id: policy.id,
    title: policy.title,
    summary: policy.summary,
    status: policy.status,
    categories: normalizeCategories(policy.categories),
    programId: policy.programId ?? "",
    personIds: [...policy.personIds],
    document: policy.document,
  }
}

export function toDraftDocumentPolicyEntry(draft: PolicyDraft): DocumentsPolicyEntry | null {
  if (!draft.id || !draft.document?.path) return null
  return {
    id: draft.id,
    title: draft.title,
    summary: draft.summary,
    status: draft.status,
    categories: draft.categories,
    programId: draft.programId || null,
    personIds: draft.personIds,
    document: draft.document,
    updatedAt: draft.document.updatedAt ?? null,
  }
}

export function buildSavePolicyPayload(draft: PolicyDraft): SavePolicyPayload {
  return {
    id: draft.id,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    status: draft.status,
    categories: normalizeCategories(draft.categories),
    programId: draft.programId.trim() || null,
    personIds: draft.personIds,
  }
}

export function upsertPolicyEntry(
  entries: DocumentsPolicyEntry[],
  nextPolicy: DocumentsPolicyEntry,
) {
  const exists = entries.some((entry) => entry.id === nextPolicy.id)
  if (!exists) return [nextPolicy, ...entries]
  return entries.map((entry) => (entry.id === nextPolicy.id ? nextPolicy : entry))
}
