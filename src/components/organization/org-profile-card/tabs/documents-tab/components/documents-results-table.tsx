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
  deletingPolicyId,
  viewingPolicyDocumentId,
  onUpload,
  onDeleteUpload,
  onViewUpload,
  onEditPolicy,
  onDeletePolicy,
  onViewPolicyDocument,
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
              deletingPolicyId={deletingPolicyId}
              viewingPolicyDocumentId={viewingPolicyDocumentId}
              onUpload={onUpload}
              onDeleteUpload={onDeleteUpload}
              onViewUpload={onViewUpload}
              onEditPolicy={onEditPolicy}
              onDeletePolicy={onDeletePolicy}
              onViewPolicyDocument={onViewPolicyDocument}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
