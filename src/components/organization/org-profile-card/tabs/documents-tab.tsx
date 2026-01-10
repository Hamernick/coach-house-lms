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
import { FormRow } from "@/components/organization/org-profile-card/shared"
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
    description: "Upload the IRS verification letter PDF that confirms your nonprofit status.",
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
    description: "Proof of nonprofit registration or charity filing for your state.",
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
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
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
  const displayName = useMemo(() => nameDraft.trim().slice(0, MAX_LABEL_LENGTH), [nameDraft])
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
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`, { method: "POST", body: form })
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
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`)
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
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`, {
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
      const res = await fetch(`/api/account/org-documents?kind=${definition.kind}`, { method: "DELETE" })
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
    <div className="rounded-xl border bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </span>
            {definition.title}
          </div>
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Private
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {hasDocument ? (
          <div className="grid gap-4 sm:max-w-xs">
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
            <div className="relative aspect-square w-36 overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="h-6 w-6" aria-hidden />
                <span className="text-xs font-medium">PDF</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2 h-8 w-8"
                    disabled={menuBusy}
                    aria-label="Document actions"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => void handleView()} disabled={isViewing}>
                    <ExternalLink className="h-4 w-4" />
                    {isViewing ? "Opening…" : "View"}
                  </DropdownMenuItem>
                  {canEdit && editMode ? (
                    <>
                      <DropdownMenuItem asChild disabled={isUploading} className="cursor-pointer">
                        <label htmlFor={replaceInputId} className="flex w-full cursor-pointer items-center gap-2">
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
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">{displayName || doc?.name || definition.defaultName}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(doc?.size)}</p>
              <p className="text-xs text-muted-foreground">Updated {formatUpdatedAt(doc?.updatedAt)}</p>
            </div>

            {canEdit && editMode ? (
              <div className="grid gap-2">
                <Label htmlFor={nameInputId} className="text-xs text-muted-foreground">
                  Document title
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id={nameInputId}
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
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No document uploaded yet.</p>
        )}

        {canEdit && editMode && !hasDocument ? (
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
            className="border-dashed bg-muted/20 hover:bg-muted/30"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground">
                <UploadCloud className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Upload your PDF</p>
                <p className="text-xs text-muted-foreground">Drag and drop here, or click to upload.</p>
                <p className="text-xs text-muted-foreground">PDF up to 15 MB.</p>
              </div>
              <span
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  isUploading && "pointer-events-none opacity-60",
                )}
              >
                {isUploading ? "Uploading…" : "Upload file"}
              </span>
            </div>
          </Dropzone>
        ) : null}
      </div>
    </div>
  )
}

export function DocumentsTab({ documents, editMode, canEdit }: DocumentsTabProps) {
  return (
    <div className="grid gap-6">
      <FormRow
        title="Private documents"
        description="These files are stored privately and will never be shared publicly."
      >
        <div className="grid gap-4 lg:grid-cols-2">
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
      </FormRow>
    </div>
  )
}
