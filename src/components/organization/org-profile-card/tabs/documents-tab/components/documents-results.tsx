"use client"

import FileText from "lucide-react/dist/esm/icons/file-text"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import type {
  DocumentDefinition,
  DocumentIndexRow,
  DocumentsPolicyEntry,
  SortColumn,
  SortDirection,
} from "../types"
import { DocumentsResultsMobile } from "./documents-results-mobile"
import { DocumentsResultsTable } from "./documents-results-table"

type DocumentsResultsProps = {
  filteredRows: DocumentIndexRow[]
  clearFilters: () => void
  sortColumn: SortColumn
  sortDirection: SortDirection
  onToggleSortColumn: (column: SortColumn) => void
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

export function DocumentsResults({
  filteredRows,
  clearFilters,
  sortColumn,
  sortDirection,
  onToggleSortColumn,
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
}: DocumentsResultsProps) {
  if (filteredRows.length === 0) {
    return (
      <div className="p-4 sm:p-5">
        <Empty
          variant="subtle"
          size="sm"
          icon={<FileText className="h-5 w-5" aria-hidden />}
          title="No documents match this view"
          description="Adjust filters or search terms to see more records."
          actions={
            <Button type="button" size="sm" variant="secondary" onClick={clearFilters}>
              Reset filters
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <>
      <DocumentsResultsTable
        filteredRows={filteredRows}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onToggleSortColumn={onToggleSortColumn}
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
      <div className="p-4 sm:p-5 md:hidden">
        <DocumentsResultsMobile
          filteredRows={filteredRows}
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
    </>
  )
}
