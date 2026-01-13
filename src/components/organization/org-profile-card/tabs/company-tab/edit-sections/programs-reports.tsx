"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import UploadCloudIcon from "lucide-react/dist/esm/icons/upload-cloud"

import { FormRow, ProfileField } from "@/components/organization/org-profile-card/shared"
import { Dropzone } from "@/components/ui/shadcn-io/dropzone"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CompanyEditProps } from "../types"

type PublicDocumentKind = "programs" | "reports"

type PublicDocumentMeta = {
  name: string
  path: string
  url: string
  size: number
  mime: string
  updatedAt: string
}

type AttachmentsPayload = Record<PublicDocumentKind, PublicDocumentMeta[]>

const MAX_BYTES = 15 * 1024 * 1024

function formatUpdatedAt(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function ProgramsReportsSection(_: CompanyEditProps) {
  const [attachments, setAttachments] = useState<AttachmentsPayload>({ programs: [], reports: [] })
  const [loading, setLoading] = useState(true)
  const [uploadingKind, setUploadingKind] = useState<PublicDocumentKind | null>(null)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

  const loadAttachments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/account/org-public-documents")
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to load uploads")
      }
      const next = payload?.attachments as AttachmentsPayload | undefined
      if (next?.programs && next?.reports) {
        setAttachments(next)
      } else {
        setAttachments({ programs: [], reports: [] })
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to load uploads")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAttachments()
  }, [loadAttachments])

  const handleUpload = useCallback(async (kind: PublicDocumentKind, file: File) => {
    const form = new FormData()
    form.append("file", file)
    setUploadingKind(kind)
    const toastId = toast.loading("Uploading…")
    try {
      const res = await fetch(`/api/account/org-public-documents?kind=${kind}`, { method: "POST", body: form })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || "Upload failed")
      }
      const next = payload?.attachments as PublicDocumentMeta[] | undefined
      if (Array.isArray(next)) {
        setAttachments((prev) => ({ ...prev, [kind]: next }))
      } else {
        await loadAttachments()
      }
      toast.success("Uploaded", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", { id: toastId })
    } finally {
      setUploadingKind(null)
    }
  }, [loadAttachments])

  const handleDelete = useCallback(async (kind: PublicDocumentKind, path: string) => {
    if (!window.confirm("Remove this file?")) return
    setDeletingPath(path)
    try {
      const res = await fetch(`/api/account/org-public-documents?kind=${kind}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || "Delete failed")
      }
      const next = payload?.attachments as PublicDocumentMeta[] | undefined
      if (Array.isArray(next)) {
        setAttachments((prev) => ({ ...prev, [kind]: next }))
      } else {
        setAttachments((prev) => ({ ...prev, [kind]: prev[kind].filter((doc) => doc.path !== path) }))
      }
      toast.success("Removed")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setDeletingPath(null)
    }
  }, [])

  const groups = useMemo(
    () =>
      [
        {
          kind: "programs" as const,
          label: "Programs",
          helper: "Upload program PDFs (these will be visible on your public page).",
        },
        {
          kind: "reports" as const,
          label: "Reports",
          helper: "Upload impact reports as PDFs (these will be visible on your public page).",
        },
      ] satisfies Array<{ kind: PublicDocumentKind; label: string; helper: string }>,
    [],
  )

  return (
    <FormRow
      title="Programs & reports"
      description="Upload PDFs for key programs and impact reports. These files will be publicly accessible."
    >
      <div className="grid gap-6">
        {groups.map((group) => {
          const list = attachments[group.kind] ?? []
          const isUploading = uploadingKind === group.kind
          return (
            <ProfileField key={group.kind} label={group.label}>
              <div className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs text-muted-foreground">{group.helper}</p>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : list.length > 0 ? (
                  <div className="grid gap-2">
                    {list.map((doc) => (
                      <div
                        key={doc.path}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{doc.name}</p>
                          {doc.updatedAt ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{formatUpdatedAt(doc.updatedAt)}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => window.open(doc.url, "_blank", "noopener")}
                          >
                            <ExternalLinkIcon className="h-4 w-4" aria-hidden />
                            View
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${doc.name}`}
                            disabled={deletingPath === doc.path}
                            onClick={() => void handleDelete(group.kind, doc.path)}
                          >
                            <Trash2Icon className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                )}

                <Dropzone
                  accept={{ "application/pdf": [] }}
                  maxFiles={1}
                  maxSize={MAX_BYTES}
                  disabled={isUploading}
                  onDrop={(accepted) => {
                    const file = accepted[0]
                    if (!file) return
                    void handleUpload(group.kind, file)
                  }}
                  onError={(error) => {
                    toast.error(error.message || "Upload failed")
                  }}
                  className={cn("border-dashed bg-muted/20 hover:bg-muted/30", isUploading && "opacity-70")}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground">
                      <UploadCloudIcon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{isUploading ? "Uploading…" : "Upload PDF"}</p>
                      <p className="text-xs text-muted-foreground">Drag and drop here, or click to upload.</p>
                      <p className="text-xs text-muted-foreground">PDF up to 15 MB.</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground",
                        isUploading && "pointer-events-none opacity-60",
                      )}
                    >
                      {isUploading ? "Uploading…" : "Choose file"}
                    </span>
                  </div>
                </Dropzone>
              </div>
            </ProfileField>
          )
        })}
      </div>
    </FormRow>
  )
}
