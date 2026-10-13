"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileStackIcon from "lucide-react/dist/esm/icons/file-stack"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { uploadOrgDocument, getOrgDocumentUrl } from "@/components/organization/org-profile-card/tabs/documents-tab/api"
import { DOCUMENTS } from "@/components/organization/org-profile-card/tabs/documents-tab/document-definitions"
import type { OrgDocument } from "@/components/organization/org-profile-card/types"
import { Button } from "@/components/ui/button"
import { Dropzone, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import type { WorkspaceCardSize } from "./workspace-board-types"

const DOCUMENT_ACCEPT = {
  "application/pdf": [".pdf"],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isOrgDocument(value: unknown): value is OrgDocument {
  return (
    isRecord(value) &&
    typeof value.path === "string" &&
    value.path.trim().length > 0 &&
    typeof value.name === "string"
  )
}

type DocumentsListResponse = {
  documents?: Record<string, OrgDocument | undefined>
}

export function WorkspaceBoardVaultCard({
  size,
  presentationMode,
}: {
  size: WorkspaceCardSize
  presentationMode: boolean
}) {
  const [selectedKind, setSelectedKind] = useState(DOCUMENTS[0]?.kind ?? "")
  const [documentsByKind, setDocumentsByKind] = useState<Record<string, OrgDocument | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [activeKind, setActiveKind] = useState<string | null>(null)
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const isCompactCard = size === "sm" && !presentationMode
  const canUpload = !presentationMode && !isUploading && selectedKind.length > 0

  const uploadedEntries = useMemo(
    () =>
      DOCUMENTS.map((definition) => ({
        definition,
        document: documentsByKind[definition.kind] ?? null,
      }))
        .filter((entry) => Boolean(entry.document?.path))
        .sort((left, right) => {
          const leftTime = new Date(left.document?.updatedAt ?? 0).getTime()
          const rightTime = new Date(right.document?.updatedAt ?? 0).getTime()
          return rightTime - leftTime
        }),
    [documentsByKind],
  )

  const activeDocumentTitle = useMemo(() => {
    if (!activeKind) return null
    const definition = DOCUMENTS.find((entry) => entry.kind === activeKind)
    if (!definition) return null
    const document = documentsByKind[activeKind]
    if (!document) return definition.title
    return document.name || definition.title
  }, [activeKind, documentsByKind])

  async function loadDocuments() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/account/org-documents", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Unable to load documents.")
      }

      const payload = (await response.json()) as DocumentsListResponse
      const listed = isRecord(payload.documents) ? payload.documents : {}

      const nextByKind: Record<string, OrgDocument | null> = {}
      for (const definition of DOCUMENTS) {
        const candidate = listed[definition.key]
        nextByKind[definition.kind] = isOrgDocument(candidate) ? candidate : null
      }

      setDocumentsByKind(nextByKind)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load documents."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDocuments()
  }, [])

  useEffect(() => {
    if (!activeKind) return
    if (documentsByKind[activeKind]) return
    setActiveKind(null)
    setActivePreviewUrl(null)
  }, [activeKind, documentsByKind])

  async function handleOpenDocument(kind: string) {
    try {
      setActiveKind(kind)
      setIsPreviewLoading(true)
      const url = await getOrgDocumentUrl(kind)
      setActivePreviewUrl(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open document."
      toast.error(message)
      setActivePreviewUrl(null)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className={cn("rounded-[14px] border border-border/60 bg-background/55", isCompactCard ? "p-2" : "p-2.5")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">Documents</p>
          <label className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            Type
            <select
              value={selectedKind}
              onChange={(event) => setSelectedKind(event.currentTarget.value)}
              disabled={presentationMode || isUploading}
              className="h-7 rounded-md border border-border/65 bg-background px-2 text-[11px] text-foreground"
              aria-label="Select document type"
            >
              {DOCUMENTS.map((definition) => (
                <option key={definition.kind} value={definition.kind}>
                  {definition.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Dropzone
          accept={DOCUMENT_ACCEPT}
          maxFiles={1}
          disabled={!canUpload}
          className={cn(
            "mt-2 rounded-[12px] border border-dashed border-border/70 bg-transparent px-3",
            isCompactCard ? "py-4" : "py-5",
          )}
          onDrop={(acceptedFiles) => {
            const nextFile = acceptedFiles[0]
            if (!nextFile || !selectedKind) return

            setIsUploading(true)
            void (async () => {
              try {
                const uploaded = await uploadOrgDocument(selectedKind, nextFile)
                setDocumentsByKind((previous) => ({
                  ...previous,
                  [selectedKind]: uploaded,
                }))
                toast.success(`${uploaded.name} uploaded.`)
                await handleOpenDocument(selectedKind)
              } catch (error) {
                const message = error instanceof Error ? error.message : "Upload failed."
                toast.error(message)
              } finally {
                setIsUploading(false)
              }
            })()
          }}
        >
          <DropzoneEmptyState className="gap-1 text-center">
            <p className="text-xs font-medium">{isUploading ? "Uploading PDF..." : "Drop one PDF file"}</p>
            <p className="text-[11px] text-muted-foreground">Assigned to selected document type</p>
          </DropzoneEmptyState>
        </Dropzone>
      </div>

      <div className={cn("grid min-h-0 flex-1 gap-2", isCompactCard ? "grid-rows-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]")}>
        <section className="min-h-0 rounded-[12px] border border-border/55 bg-background/45 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-foreground">Files</p>
            <span className="text-[10px] text-muted-foreground tabular-nums">{uploadedEntries.length}</span>
          </div>

          {isLoading ? (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading...
            </div>
          ) : uploadedEntries.length > 0 ? (
            <div className="mt-1.5 min-h-0 max-h-[180px] overflow-auto space-y-1 pr-0.5">
              {uploadedEntries.map((entry) => (
                <button
                  key={entry.definition.kind}
                  type="button"
                  className={cn(
                    "w-full rounded-md border px-2 py-1 text-left text-[11px] transition-colors",
                    activeKind === entry.definition.kind
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/60 bg-background/70 text-muted-foreground hover:bg-muted/35 hover:text-foreground",
                  )}
                  onClick={() => void handleOpenDocument(entry.definition.kind)}
                >
                  <div className="flex items-start gap-1.5">
                    <FileStackIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{entry.document?.name || entry.definition.defaultName}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{entry.definition.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">No documents uploaded yet.</p>
          )}

          <Button asChild variant="ghost" size="sm" className="mt-2 h-7 px-2 text-[11px]">
            <Link href="/organization/documents">
              Open full index
              <ExternalLinkIcon className="ml-1 h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </section>

        <section className="min-h-0 rounded-[12px] border border-border/55 bg-background/45 px-2.5 py-2">
          <p className="text-[11px] font-medium text-foreground">Preview</p>
          {isPreviewLoading ? (
            <div className="mt-2 flex h-[150px] items-center justify-center rounded-md border border-dashed border-border/65 text-[11px] text-muted-foreground">
              <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading preview...
            </div>
          ) : activePreviewUrl ? (
            <div className="mt-1.5 h-[150px] overflow-hidden rounded-md border border-border/65 bg-background">
              <iframe
                src={activePreviewUrl}
                title={activeDocumentTitle ?? "Document preview"}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="mt-2 flex h-[150px] items-center justify-center rounded-md border border-dashed border-border/65 px-3 text-center text-[11px] text-muted-foreground">
              Select a document to preview it here.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
