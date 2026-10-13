import type { DriveLibraryDocument } from "../hooks/use-google-drive-library"
import type { OrganizationDocumentFile } from "../hooks/use-organization-document-files"
import type { DocumentIndexRow } from "../types"

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

export type LibraryItem = {
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
  driveDocument?: DriveLibraryDocument
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

export function buildLibraryItems(
  rows: DocumentIndexRow[],
  driveDocuments: DriveLibraryDocument[],
  uploadedFiles: OrganizationDocumentFile[],
  includeMissing = false
) {
  const localItems: LibraryItem[] = rows.flatMap((row) => {
    if (row.source === "upload" && !row.document?.path && !includeMissing)
      return []
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
    driveDocument: document,
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

export function formatCardDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date)
}
