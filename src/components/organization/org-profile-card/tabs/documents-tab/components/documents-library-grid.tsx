"use client"

import { useMemo, useState } from "react"
import {
  IconCheck,
  IconDots,
  IconFile,
  IconFileDescription,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPhoto,
  IconPresentation,
  IconRestore,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DriveLibraryDocument } from "../hooks/use-google-drive-library"
import type { OrganizationDocumentFile } from "../hooks/use-organization-document-files"
import type { DocumentIndexRow, DocumentsPolicyEntry } from "../types"

export type DocumentsLibraryTab = "all" | "images" | "documents"
export type DocumentsLibrarySource = "all" | "uploaded" | "generated"
export type DocumentsLibraryFileType =
  | "all"
  | "image"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "pdf"
  | "other"

type LibraryItem = {
  id: string
  name: string
  description: string
  source: Exclude<DocumentsLibrarySource, "all">
  fileType: Exclude<DocumentsLibraryFileType, "all">
  updatedAt: string | null
  deleted: boolean
  deletedAt?: string | null
  href?: string
  row?: DocumentIndexRow
  uploadedFile?: OrganizationDocumentFile
}

type DocumentsLibraryGridProps = {
  rows: DocumentIndexRow[]
  driveDocuments: DriveLibraryDocument[]
  uploadedFiles: OrganizationDocumentFile[]
  tab: DocumentsLibraryTab
  source: DocumentsLibrarySource
  fileType: DocumentsLibraryFileType
  showDeleted: boolean
  canEdit: boolean
  editMode: boolean
  onEditPolicy: (policy: DocumentsPolicyEntry) => void
  onViewPolicyDocument: (policy: DocumentsPolicyEntry) => Promise<void>
  onViewUpload: (
    definition: Extract<DocumentIndexRow, { source: "upload" }>["definition"]
  ) => Promise<void>
  onViewUploadedFile: (file: OrganizationDocumentFile) => Promise<void>
  pendingUploadedFileIds: string[]
  onTrashUploadedFile: (file: OrganizationDocumentFile) => Promise<void>
  onRestoreUploadedFile: (file: OrganizationDocumentFile) => Promise<void>
  onPermanentlyDeleteUploadedFile: (
    file: OrganizationDocumentFile
  ) => Promise<void>
  onReset: () => void
}

function resolveFileType(mimeType: string, name = ""): LibraryItem["fileType"] {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "spreadsheet"
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "presentation"
  }
  if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    return "pdf"
  }
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("word")
  ) {
    return "document"
  }
  return "other"
}

function buildLibraryItems(
  rows: DocumentIndexRow[],
  driveDocuments: DriveLibraryDocument[],
  uploadedFiles: OrganizationDocumentFile[]
) {
  const localItems: LibraryItem[] = rows.flatMap((row) => {
    if (row.source === "upload" && !row.document?.path) return []
    return [
      {
        id: row.id,
        name: row.name,
        description: row.description,
        source: row.source === "upload" ? "uploaded" : "generated",
        fileType: row.source === "upload" ? "pdf" : "document",
        updatedAt: row.updatedAt,
        deleted: false,
        href:
          row.source === "roadmap" ? `/roadmap/${row.section.slug}` : undefined,
        row,
      } satisfies LibraryItem,
    ]
  })
  const driveItems: LibraryItem[] = driveDocuments.map((document) => ({
    id: `drive:${document.id}`,
    name: document.name,
    description: "Google Drive",
    source: "uploaded",
    fileType: resolveFileType(document.mimeType, document.name),
    updatedAt: document.modifiedAt,
    deleted: document.status === "trashed",
    href: document.webViewLink,
  }))
  const uploadedItems: LibraryItem[] = uploadedFiles.map((file) => ({
    id: `uploaded:${file.id}`,
    name: file.name,
    description: file.mimeType,
    source: "uploaded",
    fileType: resolveFileType(file.mimeType, file.name),
    updatedAt: file.updatedAt,
    deleted: Boolean(file.deletedAt),
    deletedAt: file.deletedAt,
    uploadedFile: file,
  }))
  return [...uploadedItems, ...driveItems, ...localItems]
}

function formatCardDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date)
}

function TypeIcon({
  type,
  source,
}: {
  type: LibraryItem["fileType"]
  source: LibraryItem["source"]
}) {
  const className = "size-8 stroke-[1.6]"
  if (source === "generated") {
    return <IconWorld className={className} aria-hidden />
  }
  if (type === "image") return <IconPhoto className={className} aria-hidden />
  if (type === "spreadsheet") {
    return (
      <IconFileSpreadsheet
        className={cn(className, "text-emerald-500")}
        aria-hidden
      />
    )
  }
  if (type === "presentation") {
    return (
      <IconPresentation
        className={cn(className, "text-amber-500")}
        aria-hidden
      />
    )
  }
  if (type === "pdf") {
    return (
      <IconFileTypePdf className={cn(className, "text-red-500")} aria-hidden />
    )
  }
  if (type === "document") {
    return <IconFileDescription className={className} aria-hidden />
  }
  return <IconFile className={className} aria-hidden />
}

export function DocumentsLibraryGrid({
  rows,
  driveDocuments,
  uploadedFiles,
  tab,
  source,
  fileType,
  showDeleted,
  canEdit,
  editMode,
  onEditPolicy,
  onViewPolicyDocument,
  onViewUpload,
  onViewUploadedFile,
  pendingUploadedFileIds,
  onTrashUploadedFile,
  onRestoreUploadedFile,
  onPermanentlyDeleteUploadedFile,
  onReset,
}: DocumentsLibraryGridProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const items = useMemo(() => {
    return buildLibraryItems(rows, driveDocuments, uploadedFiles).filter(
      (item) => {
        if (item.deleted !== showDeleted) return false
        if (tab === "images" && item.fileType !== "image") return false
        if (tab === "documents" && item.fileType === "image") return false
        if (source !== "all" && item.source !== source) return false
        if (fileType !== "all" && item.fileType !== fileType) return false
        return true
      }
    )
  }, [driveDocuments, fileType, rows, showDeleted, source, tab, uploadedFiles])

  function openItem(item: LibraryItem) {
    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer")
      return
    }
    if (item.uploadedFile) {
      void onViewUploadedFile(item.uploadedFile)
      return
    }
    if (!item.row) return
    if (item.row.source === "upload") {
      void onViewUpload(item.row.definition)
      return
    }
    if (item.row.source === "policy") {
      if (item.row.policy.document?.path) {
        void onViewPolicyDocument(item.row.policy)
      } else if (canEdit && editMode) {
        onEditPolicy(item.row.policy)
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-14">
        <Empty
          variant="subtle"
          size="sm"
          icon={<IconWorld className="size-5" aria-hidden />}
          title={
            showDeleted
              ? "No recently deleted files"
              : "No documents match this view"
          }
          description={
            showDeleted
              ? "Deleted files remain here for 30 days before permanent removal."
              : "Adjust the tab, filter, or search to see more files."
          }
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="underline-offset-4 hover:underline"
              onClick={onReset}
            >
              Show all files
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id)
        return (
          <article
            key={item.id}
            className={cn(
              "group/card bg-muted/80 ring-border/60 relative flex aspect-[1/1.02] min-h-64 flex-col overflow-hidden rounded-[2rem] ring-1 transition-[background-color,box-shadow,transform] duration-200 motion-reduce:transition-none sm:min-h-0",
              "hover:bg-muted focus-within:ring-ring/50 focus-within:ring-2 hover:shadow-lg hover:shadow-black/5 dark:bg-[#303030] dark:hover:bg-[#363636]",
              selected && "ring-foreground/70 ring-2"
            )}
          >
            <Button
              type="button"
              variant="ghost"
              className="absolute inset-0 z-0 h-auto w-auto rounded-[2rem] p-0 hover:bg-transparent focus-visible:ring-2"
              onClick={() => openItem(item)}
              aria-label={`Open ${item.name}`}
              disabled={item.deleted}
            />
            <h3 className="pointer-events-none relative z-10 line-clamp-2 px-5 pt-4 text-sm leading-5 font-medium break-words">
              {item.name}
            </h3>
            <div className="text-foreground pointer-events-none relative z-10 flex flex-1 items-center justify-center">
              <TypeIcon type={item.fileType} source={item.source} />
            </div>
            <div className="text-muted-foreground pointer-events-none relative z-10 flex min-h-12 items-center px-5 pb-1 text-xs">
              <span className="truncate tabular-nums">
                {item.deletedAt
                  ? `Deleted ${formatCardDate(item.deletedAt)}`
                  : formatCardDate(item.updatedAt)}
              </span>
            </div>
            {item.uploadedFile && canEdit && editMode ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-20 size-11 rounded-full bg-transparent opacity-100 hover:bg-black/5 focus-visible:ring-2 sm:size-8 sm:opacity-0 sm:group-hover/card:opacity-100 sm:focus:opacity-100 dark:hover:bg-white/10"
                    disabled={pendingUploadedFileIds.includes(
                      item.uploadedFile.id
                    )}
                    aria-label={`Manage ${item.name}`}
                  >
                    <IconDots className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl p-1.5 shadow-xl dark:border-white/10 dark:bg-[#303030]"
                >
                  {item.deleted ? (
                    <>
                      <DropdownMenuItem
                        className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
                        onSelect={() =>
                          void onRestoreUploadedFile(item.uploadedFile!)
                        }
                      >
                        <IconRestore className="size-4" aria-hidden />
                        Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
                        onSelect={() => {
                          if (
                            window.confirm(
                              `Permanently delete ${item.name}? This cannot be undone.`
                            )
                          ) {
                            void onPermanentlyDeleteUploadedFile(
                              item.uploadedFile!
                            )
                          }
                        }}
                      >
                        <IconTrash className="size-4" aria-hidden />
                        Delete permanently
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      variant="destructive"
                      className="min-h-11 rounded-lg text-base sm:min-h-9 sm:text-sm"
                      onSelect={() =>
                        void onTrashUploadedFile(item.uploadedFile!)
                      }
                    >
                      <IconTrash className="size-4" aria-hidden />
                      Move to Recently Deleted
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-2 bottom-2 z-20 size-11 rounded-full bg-transparent p-0 opacity-100 transition-opacity hover:bg-transparent focus-visible:ring-2 sm:size-8 sm:opacity-0 sm:group-hover/card:opacity-100 sm:focus:opacity-100",
                selected && "opacity-100"
              )}
              onClick={() =>
                setSelectedIds((current) =>
                  current.includes(item.id)
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id]
                )
              }
              aria-pressed={selected}
              aria-label={`${selected ? "Deselect" : "Select"} ${item.name}`}
            >
              <span
                className={cn(
                  "border-muted-foreground/45 flex size-7 items-center justify-center rounded-full border-2 transition-[background-color,border-color]",
                  selected && "border-foreground bg-foreground"
                )}
                aria-hidden
              >
                {selected ? (
                  <IconCheck className="text-background size-3" />
                ) : null}
              </span>
            </Button>
          </article>
        )
      })}
    </div>
  )
}
