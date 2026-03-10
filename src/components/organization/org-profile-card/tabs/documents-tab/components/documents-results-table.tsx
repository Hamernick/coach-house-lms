"use client"

import {
  Table,
  TableBody,
} from "@/components/ui/table"

import { DocumentsResultsTableHeader } from "./documents-results-table-header"
import { DocumentsResultsTableRow } from "./documents-results-table-row"
import type { DocumentsResultsTableProps } from "./documents-results-table-types"

export function DocumentsResultsTable({
  filteredRows,
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
}: DocumentsResultsTableProps) {
  return (
    <div className="hidden md:block">
      <Table className="min-w-[1020px]">
        <DocumentsResultsTableHeader
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onToggleSortColumn={onToggleSortColumn}
        />
        <TableBody>
          {filteredRows.map((row) => (
            <DocumentsResultsTableRow
              key={row.id}
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
