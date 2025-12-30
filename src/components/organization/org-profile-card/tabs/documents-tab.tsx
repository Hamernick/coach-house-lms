"use client"

import { useEffect, useId, useMemo, useState } from "react"
import Lock from "lucide-react/dist/esm/icons/lock"
import FileText from "lucide-react/dist/esm/icons/file-text"
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import PencilLine from "lucide-react/dist/esm/icons/pencil-line"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import { toast } from "@/lib/toast"
import type { OrgDocuments, OrgDocument } from "../types"

const DOCUMENT_KIND = "verification-letter"
const MAX_LABEL_LENGTH = 120

type DocumentsTabProps = {
  documents?: OrgDocuments | null
  editMode: boolean
  canEdit: boolean
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  return formatDistanceToNow(parsed, { addSuffix: true })
}

export function DocumentsTab({ documents, editMode, canEdit }: DocumentsTabProps) {
  const initial = documents?.verificationLetter ?? null
  const [doc, setDoc] = useState<OrgDocument | null>(initial)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [nameDraft, setNameDraft] = useState(initial?.name ?? "")
  const fileInputId = useId()

  useEffect(() => {
    setDoc(documents?.verificationLetter ?? null)
    setNameDraft(documents?.verificationLetter?.name ?? "")
  }, [documents?.verificationLetter])

  const hasDocument = Boolean(doc?.path)
  const displayName = useMemo(() => nameDraft.trim().slice(0, MAX_LABEL_LENGTH), [nameDraft])

  const handleUpload = async (file: File) => {
    const form = new FormData()
    form.append("file", file)

    setIsUploading(true)
    const toastId = toast.loading("Uploading document…")
    try {
      const res = await fetch(`/api/account/org-documents?kind=${DOCUMENT_KIND}`, { method: "POST", body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Upload failed")
      }
      const payload = await res.json()
      const nextDoc = payload?.document as OrgDocument | undefined
      if (!nextDoc?.path) throw new Error("Upload failed")
      setDoc(nextDoc)
      setNameDraft(nextDoc.name)
      toast.success("Document saved", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = async () => {
    if (!doc?.path) return
    setIsViewing(true)
    try {
      const res = await fetch(`/api/account/org-documents?kind=${DOCUMENT_KIND}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Unable to open document")
      }
      const payload = await res.json()
      const url = payload?.url as string | undefined
      if (!url) throw new Error("Unable to open document")
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to open document")
    } finally {
      setIsViewing(false)
    }
  }

  const handleRename = async () => {
    if (!doc?.path) return
    const nextName = displayName.trim()
    if (!nextName) {
      toast.error("Document title is required")
      return
    }
    setIsRenaming(true)
    try {
      const res = await fetch(`/api/account/org-documents?kind=${DOCUMENT_KIND}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Update failed")
      }
      const payload = await res.json()
      const nextDoc = payload?.document as OrgDocument | undefined
      if (!nextDoc?.path) throw new Error("Update failed")
      setDoc(nextDoc)
      setNameDraft(nextDoc.name)
      toast.success("Document updated")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Update failed")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async () => {
    if (!doc?.path) return
    if (!window.confirm("Remove this document?")) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/account/org-documents?kind=${DOCUMENT_KIND}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Delete failed")
      }
      setDoc(null)
      setNameDraft("")
      toast.success("Document removed")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <FormRow
        title="Private documents"
        description="These files are stored privately and will never be shared publicly."
      >
        <div className="rounded-xl border bg-background/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                </span>
                501(c)(3) determination letter
              </div>
              <p className="text-xs text-muted-foreground">
                Upload the IRS verification letter PDF that confirms your nonprofit status.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Private
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {hasDocument ? (
              <>
                <ProfileField label="File">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="truncate">{doc?.name}</span>
                  </div>
                </ProfileField>
                <ProfileField label="Size">
                  <span className="text-sm">{formatBytes(doc?.size)}</span>
                </ProfileField>
                <ProfileField label="Last updated">
                  <span className="text-sm">{formatUpdatedAt(doc?.updatedAt)}</span>
                </ProfileField>
              </>
            ) : (
              <ProfileField label="Status">
                <span className="text-sm text-muted-foreground">No document uploaded yet.</span>
              </ProfileField>
            )}
          </div>

          {canEdit ? (
            <div className="mt-4 grid gap-3">
              {hasDocument && editMode ? (
                <div className="grid gap-2">
                  <Label htmlFor="org-doc-name" className="text-xs text-muted-foreground">
                    Document title
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="org-doc-name"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.currentTarget.value)}
                      className="max-w-sm"
                    />
                    <Button size="sm" variant="outline" onClick={handleRename} disabled={isRenaming}>
                      <PencilLine className="h-4 w-4" />
                      {isRenaming ? "Saving…" : "Update name"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={fileInputId}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (!file) return
                    void handleUpload(file)
                    event.currentTarget.value = ""
                  }}
                />
                <Button asChild size="sm" variant="secondary" disabled={isUploading}>
                  <label htmlFor={fileInputId} className="cursor-pointer">
                    {hasDocument ? <RefreshCw className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                    {isUploading ? "Uploading…" : hasDocument ? "Replace file" : "Upload file"}
                  </label>
                </Button>
                {hasDocument ? (
                  <>
                    <Button size="sm" variant="outline" onClick={handleView} disabled={isViewing}>
                      <ExternalLink className="h-4 w-4" />
                      {isViewing ? "Opening…" : "View"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? "Removing…" : "Delete"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : hasDocument ? (
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={handleView} disabled={isViewing}>
                <ExternalLink className="h-4 w-4" />
                {isViewing ? "Opening…" : "View"}
              </Button>
            </div>
          ) : null}
        </div>
      </FormRow>
    </div>
  )
}
