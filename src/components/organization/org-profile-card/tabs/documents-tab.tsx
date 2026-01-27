"use client"

import { useEffect, useId, useMemo, useState } from "react"
import Lock from "lucide-react/dist/esm/icons/lock"
import FileText from "lucide-react/dist/esm/icons/file-text"
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud"
import Trash2 from "lucide-react/dist/esm/icons/trash-2"
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"
import PencilLine from "lucide-react/dist/esm/icons/pencil-line"
import { formatDistanceToNow } from "date-fns"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dropzone } from "@/components/ui/shadcn-io/dropzone"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { OrgDocuments, OrgDocument } from "../types"

const MAX_LABEL_LENGTH = 120
const MAX_BYTES = 15 * 1024 * 1024

type DocumentDefinition = {
  kind: string
  key: keyof OrgDocuments
  title: string
  description: string
  defaultName: string
}

const DOCUMENTS: DocumentDefinition[] = [
  {
    kind: "verification-letter",
    key: "verificationLetter",
    title: "501(c)(3) determination letter",
    description:
      "Upload the IRS verification letter PDF that confirms your nonprofit status.",
    defaultName: "Verification letter",
  },
  {
    kind: "articles-of-incorporation",
    key: "articlesOfIncorporation",
    title: "Articles of incorporation",
    description: "Include the stamped articles filed with your state.",
    defaultName: "Articles of incorporation",
  },
  {
    kind: "bylaws",
    key: "bylaws",
    title: "Bylaws",
    description: "Governing bylaws or constitution for your organization.",
    defaultName: "Bylaws",
  },
  {
    kind: "state-registration",
    key: "stateRegistration",
    title: "State registration",
    description:
      "Proof of nonprofit registration or charity filing for your state.",
    defaultName: "State registration",
  },
  {
    kind: "good-standing-certificate",
    key: "goodStandingCertificate",
    title: "Certificate of good standing",
    description: "Secretary of State certificate confirming active status.",
    defaultName: "Good standing certificate",
  },
  {
    kind: "w9",
    key: "w9",
    title: "W-9 form",
    description: "Completed IRS W-9 for your organization.",
    defaultName: "W-9",
  },
  {
    kind: "tax-exempt-certificate",
    key: "taxExemptCertificate",
    title: "Tax exempt certificate",
    description: "Department of Revenue tax-exempt certificate.",
    defaultName: "Tax exempt certificate",
  },
]

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

function validatePdf(file: File) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) return "Only PDF files are supported."
  if (file.size > MAX_BYTES) return "PDF must be 15 MB or less."
  return null
}

function DocumentCard({
  definition,
  document,
  editMode,
  canEdit,
}: {
  definition: DocumentDefinition
  document: OrgDocument | null
  editMode: boolean
  canEdit: boolean
}) {
  const replaceInputId = useId()
  const nameInputId = useId()
  const [doc, setDoc] = useState<OrgDocument | null>(document)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [nameDraft, setNameDraft] = useState(document?.name ?? "")

  useEffect(() => {
    setDoc(document ?? null)
    setNameDraft(document?.name ?? "")
  }, [document])

  const hasDocument = Boolean(doc?.path)
  const displayName = useMemo(
    () => nameDraft.trim().slice(0, MAX_LABEL_LENGTH),
    [nameDraft]
  )
  const menuBusy = isUploading || isDeleting || isViewing

  const handleUpload = async (file: File) => {
    const validationError = validatePdf(file)
    if (validationError) {
      toast.error(validationError)
      return
    }
    const form = new FormData()
    form.append("file", file)

    setIsUploading(true)
    const toastId = toast.loading("Uploading document…")
    try {
      const res = await fetch(
        `/api/account/org-documents?kind=${definition.kind}`,
        { method: "POST", body: form }
      )
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
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = async () => {
    if (!doc?.path) return
    setIsViewing(true)
    try {
      const res = await fetch(
        `/api/account/org-documents?kind=${definition.kind}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Unable to open document")
      }
      const payload = await res.json()
      const url = payload?.url as string | undefined
      if (!url) throw new Error("Unable to open document")
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open document"
      )
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
      const res = await fetch(
        `/api/account/org-documents?kind=${definition.kind}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        }
      )
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
      const res = await fetch(
        `/api/account/org-documents?kind=${definition.kind}`,
        { method: "DELETE" }
      )
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
    <div
      data-tour={`document-${definition.kind}`}
      className="bg-background/60 rounded-xl border p-4"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)] sm:items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <span className="bg-background mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
              <Lock className="text-muted-foreground h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-semibold">
                  {definition.title}
                </h3>
                <div className="border-border/60 bg-muted/50 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                  <Lock className="h-3 w-3" aria-hidden />
                  Private
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {definition.description}
              </p>
            </div>
          </div>

          {canEdit && editMode && hasDocument ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor={nameInputId} className="sr-only">
                Document title
              </Label>
              <Input
                id={nameInputId}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.currentTarget.value)}
                className="h-9 sm:max-w-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleRename}
                disabled={isRenaming}
              >
                <PencilLine className="h-4 w-4" />
                {isRenaming ? "Saving…" : "Update name"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          {hasDocument ? (
            <div className="border-border/60 bg-muted/20 flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
              {canEdit && editMode ? (
                <input
                  id={replaceInputId}
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
              ) : null}
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-background text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  <FileText className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-foreground truncate text-sm font-medium">
                    {displayName || doc?.name || definition.defaultName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(doc?.size)} · Updated{" "}
                    {formatUpdatedAt(doc?.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleView()}
                  disabled={isViewing}
                >
                  <ExternalLink className="h-4 w-4" />
                  {isViewing ? "Opening…" : "View"}
                </Button>
                {canEdit && editMode ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        disabled={menuBusy}
                        aria-label="Document actions"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        asChild
                        disabled={isUploading}
                        className="cursor-pointer"
                      >
                        <label
                          htmlFor={replaceInputId}
                          className="flex w-full cursor-pointer items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {isUploading ? "Uploading…" : "Replace file"}
                        </label>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => void handleDelete()}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? "Removing…" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>
          ) : canEdit && editMode ? (
            <Dropzone
              accept={{ "application/pdf": [] }}
              maxFiles={1}
              maxSize={MAX_BYTES}
              disabled={isUploading}
              onDrop={(accepted) => {
                const file = accepted[0]
                if (!file) return
                void handleUpload(file)
              }}
              onError={(error) => {
                toast.error(error.message || "Upload failed")
              }}
              className="bg-muted/20 hover:bg-muted/30 flex-row items-center justify-between gap-4 border-dashed p-4 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-background text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  <UploadCloud className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-foreground truncate text-sm font-medium">
                    Upload PDF
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    Drag & drop or click · 15 MB max
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  isUploading && "pointer-events-none opacity-60"
                )}
              >
                {isUploading ? "Uploading…" : "Upload"}
              </span>
            </Dropzone>
          ) : (
            <div className="border-border/60 bg-muted/20 flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-background text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border">
                  <FileText className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-foreground truncate text-sm font-medium">
                    No document uploaded
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    Only organization admins can add documents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DocumentsTab({
  documents,
  editMode,
  canEdit,
}: DocumentsTabProps) {
  return (
    <section className="space-y-4 pb-6" aria-labelledby="documents-title">
      <header className="space-y-1">
        <h2 id="documents-title" className="text-base font-semibold text-foreground">
          Private documents
        </h2>
        <p className="text-sm text-muted-foreground">
          These files are stored privately and will never be shared publicly.
        </p>
      </header>
      <div className="grid gap-3 md:gap-4">
        {DOCUMENTS.map((definition) => (
          <DocumentCard
            key={definition.kind}
            definition={definition}
            document={documents?.[definition.key] ?? null}
            editMode={editMode}
            canEdit={canEdit}
          />
        ))}
      </div>
    </section>
  )
}
