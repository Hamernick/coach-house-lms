import type { OrgDocument } from "../../types"
import type { DocumentsPolicyEntry } from "./types"

type SavePolicyPayload = {
  id?: string
  title: string
  summary: string
  status: DocumentsPolicyEntry["status"]
  categories: string[]
  programId: string | null
  personIds: string[]
}

async function getErrorMessage(response: Response, fallback: string) {
  const err = await response.json().catch(() => ({}))
  return err?.error || fallback
}

export async function uploadOrgDocument(kind: string, file: File) {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`/api/account/org-documents?kind=${encodeURIComponent(kind)}`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Upload failed"))
  }

  const payload = await res.json()
  const document = payload?.document as OrgDocument | undefined
  if (!document?.path) throw new Error("Upload failed")
  return document
}

export async function getOrgDocumentUrl(kind: string, options?: { download?: boolean }) {
  const search = new URLSearchParams({ kind })
  if (options?.download) {
    search.set("download", "1")
  }
  const res = await fetch(`/api/account/org-documents?${search.toString()}`)
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Unable to open document"))
  }

  const payload = await res.json()
  const url = payload?.url as string | undefined
  if (!url) throw new Error("Unable to open document")
  return url
}

export async function deleteOrgDocument(kind: string) {
  const res = await fetch(`/api/account/org-documents?kind=${encodeURIComponent(kind)}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Delete failed"))
  }
}

export async function savePolicy(payload: SavePolicyPayload) {
  const method = payload.id ? "PATCH" : "POST"
  const res = await fetch("/api/account/org-policies", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Unable to save policy"))
  }

  const response = await res.json()
  const policy = response?.policy as DocumentsPolicyEntry | undefined
  if (!policy?.id) throw new Error("Unable to save policy")
  return policy
}

export async function deletePolicy(policyId: string) {
  const res = await fetch(`/api/account/org-policies?id=${encodeURIComponent(policyId)}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Unable to delete policy"))
  }
}

export async function uploadPolicyDocument(policyId: string, file: File) {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(
    `/api/account/org-policies/document?id=${encodeURIComponent(policyId)}`,
    {
      method: "POST",
      body: form,
    },
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Unable to upload policy file"))
  }

  const payload = await res.json()
  const policy = payload?.policy as DocumentsPolicyEntry | undefined
  if (!policy?.id) throw new Error("Unable to upload policy file")
  return policy
}

export async function removePolicyDocument(policyId: string) {
  const res = await fetch(
    `/api/account/org-policies/document?id=${encodeURIComponent(policyId)}`,
    {
      method: "DELETE",
    },
  )

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Unable to remove policy file"))
  }

  const payload = await res.json()
  const policy = payload?.policy as DocumentsPolicyEntry | undefined
  if (!policy?.id) throw new Error("Unable to remove policy file")
  return policy
}

export async function getPolicyDocumentUrl(policyId: string, options?: { download?: boolean }) {
  const search = new URLSearchParams({ id: policyId })
  if (options?.download) {
    search.set("download", "1")
  }
  const res = await fetch(`/api/account/org-policies/document?${search.toString()}`)

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Unable to open policy file"))
  }

  const payload = await res.json()
  const url = payload?.url as string | undefined
  if (!url) throw new Error("Unable to open policy file")
  return url
}
