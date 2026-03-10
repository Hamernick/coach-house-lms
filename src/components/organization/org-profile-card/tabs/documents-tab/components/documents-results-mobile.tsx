"use client"

import { Badge } from "@/components/ui/badge"

import { SOURCE_LABEL } from "../constants"
import { formatUpdatedAt } from "../helpers"
import type {
  DocumentDefinition,
  DocumentIndexRow,
  DocumentsPolicyEntry,
} from "../types"
import { CategoryBadges, StatusBadge } from "./document-row-meta"
import { DocumentRowActions } from "./document-row-actions"

type DocumentsResultsMobileProps = {
  filteredRows: DocumentIndexRow[]
  canEdit: boolean
  editMode: boolean
  publicSlug?: string | null
  uploadingKind: string | null
  deletingKind: string | null
  viewingKind: string | null
  downloadingKind: string | null
  deletingPolicyId: string | null
  viewingPolicyDocumentId: string | null
  downloadingPolicyDocumentId: string | null
  onUpload: (definition: DocumentDefinition, file: File) => Promise<void>
  onDeleteUpload: (definition: DocumentDefinition) => Promise<void>
  onViewUpload: (definition: DocumentDefinition) => Promise<void>
  onDownloadUpload: (definition: DocumentDefinition) => Promise<void>
  onEditPolicy: (policy: DocumentsPolicyEntry) => void
  onDeletePolicy: (policy: DocumentsPolicyEntry) => Promise<void>
  onViewPolicyDocument: (policy: DocumentsPolicyEntry) => Promise<void>
  onDownloadPolicyDocument: (policy: DocumentsPolicyEntry) => Promise<void>
}

function tourIdForRow(row: DocumentIndexRow) {
  return row.source === "upload" && row.definition.kind === "verification-letter"
    ? "document-verification-letter"
    : undefined
}

export function DocumentsResultsMobile({
  filteredRows,
  canEdit,
  editMode,
  publicSlug,
  uploadingKind,
  deletingKind,
  viewingKind,
  downloadingKind,
  deletingPolicyId,
  viewingPolicyDocumentId,
  downloadingPolicyDocumentId,
  onUpload,
  onDeleteUpload,
  onViewUpload,
  onDownloadUpload,
  onEditPolicy,
  onDeletePolicy,
  onViewPolicyDocument,
  onDownloadPolicyDocument,
}: DocumentsResultsMobileProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {filteredRows.map((row) => {
        const tourId = tourIdForRow(row)

        return (
          <div
            key={row.id}
            data-tour={tourId}
            className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                  {row.description || "-"}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadges categories={row.categories} />
              <Badge variant="outline">{SOURCE_LABEL[row.source]}</Badge>
              <Badge variant="outline" className="capitalize">
                {row.visibility}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Updated {formatUpdatedAt(row.updatedAt)}
            </p>

            <DocumentRowActions
              row={row}
              canEdit={canEdit}
              editMode={editMode}
              publicSlug={publicSlug}
              uploadingKind={uploadingKind}
              deletingKind={deletingKind}
              viewingKind={viewingKind}
              downloadingKind={downloadingKind}
              deletingPolicyId={deletingPolicyId}
              viewingPolicyDocumentId={viewingPolicyDocumentId}
              downloadingPolicyDocumentId={downloadingPolicyDocumentId}
              onUpload={onUpload}
              onDeleteUpload={onDeleteUpload}
              onViewUpload={onViewUpload}
              onDownloadUpload={onDownloadUpload}
              onEditPolicy={onEditPolicy}
              onDeletePolicy={onDeletePolicy}
              onViewPolicyDocument={onViewPolicyDocument}
              onDownloadPolicyDocument={onDownloadPolicyDocument}
            />
          </div>
        )
      })}
    </div>
  )
}
