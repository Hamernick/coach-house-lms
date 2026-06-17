"use client"

import { SOURCE_LABEL } from "../constants"
import { formatUpdatedAt } from "../helpers"
import type {
  DocumentDefinition,
  DocumentIndexRow,
  DocumentsPolicyEntry,
} from "../types"
import {
  CategoryBadges,
  DocumentMetaPill,
  StatusBadge,
} from "./document-row-meta"
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
  return row.source === "upload" &&
    row.definition.kind === "verification-letter"
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
            className="border-border/60 bg-background/60 space-y-3 rounded-xl border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-foreground truncate text-sm font-semibold">
                  {row.name}
                </p>
                <p className="text-muted-foreground line-clamp-3 text-xs whitespace-pre-line">
                  {row.description || "-"}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadges categories={row.categories} />
              <DocumentMetaPill>{SOURCE_LABEL[row.source]}</DocumentMetaPill>
              <DocumentMetaPill className="capitalize">
                {row.visibility}
              </DocumentMetaPill>
            </div>

            <p className="text-muted-foreground text-xs">
              Updated {formatUpdatedAt(row.updatedAt)}
            </p>

            <DocumentRowActions
              row={row}
              presentation="mobile"
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
