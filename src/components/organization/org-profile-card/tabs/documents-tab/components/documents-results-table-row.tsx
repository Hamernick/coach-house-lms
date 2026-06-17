"use client"

import { TableCell, TableRow } from "@/components/ui/table"

import { formatBytes, formatUpdatedAt } from "../helpers"
import type { DocumentIndexRow } from "../types"
import type { DocumentsResultsTableColumnWidths } from "./documents-results-table-columns"
import {
  CategoryBadges,
  DocumentMetaPill,
  StatusBadge,
} from "./document-row-meta"
import { DocumentRowActions } from "./document-row-actions"
import type { DocumentsResultsTableProps } from "./documents-results-table-types"

type DocumentsResultsTableRowProps = Pick<
  DocumentsResultsTableProps,
  | "canEdit"
  | "deletingKind"
  | "deletingPolicyId"
  | "downloadingKind"
  | "downloadingPolicyDocumentId"
  | "editMode"
  | "onDeletePolicy"
  | "onDeleteUpload"
  | "onDownloadPolicyDocument"
  | "onDownloadUpload"
  | "onEditPolicy"
  | "onUpload"
  | "onViewPolicyDocument"
  | "onViewUpload"
  | "publicSlug"
  | "uploadingKind"
  | "viewingKind"
  | "viewingPolicyDocumentId"
> & {
  row: DocumentIndexRow
  columnWidths: DocumentsResultsTableColumnWidths
}

function tourIdForRow(row: DocumentIndexRow) {
  return row.source === "upload" &&
    row.definition.kind === "verification-letter"
    ? "document-verification-letter"
    : undefined
}

function rowDocumentDetails(row: DocumentIndexRow) {
  if (row.source === "upload") {
    return row.document?.path
      ? `${row.document.name || row.definition.defaultName} · ${formatBytes(row.document.size)}`
      : "No file uploaded"
  }

  if (row.source === "policy") {
    return row.policy.document?.path
      ? `${row.policy.document.name || "Policy file"} · ${formatBytes(row.policy.document.size)}`
      : "No policy file uploaded"
  }

  return null
}

export function DocumentsResultsTableRow({
  row,
  columnWidths,
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
}: DocumentsResultsTableRowProps) {
  const details = rowDocumentDetails(row)

  return (
    <TableRow key={row.id} data-tour={tourIdForRow(row)}>
      <TableCell
        className="overflow-hidden"
        style={{ width: columnWidths.status }}
      >
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell
        className="overflow-hidden whitespace-normal"
        style={{ width: columnWidths.name }}
      >
        <div className="min-w-0 space-y-0.5">
          <p className="text-foreground truncate font-medium">{row.name}</p>
          <p className="text-muted-foreground line-clamp-2 text-xs whitespace-pre-line">
            {row.description || "-"}
          </p>
          {details ? (
            <p className="text-muted-foreground text-xs">{details}</p>
          ) : null}
        </div>
      </TableCell>
      <TableCell
        className="overflow-hidden"
        style={{ width: columnWidths.category }}
      >
        <CategoryBadges categories={row.categories} />
      </TableCell>
      <TableCell
        className="text-muted-foreground overflow-hidden"
        style={{ width: columnWidths.updatedAt }}
      >
        {formatUpdatedAt(row.updatedAt)}
      </TableCell>
      <TableCell
        className="overflow-hidden"
        style={{ width: columnWidths.visibility }}
      >
        <DocumentMetaPill className="capitalize">
          {row.visibility}
        </DocumentMetaPill>
      </TableCell>
      <TableCell
        className="whitespace-normal"
        style={{ width: columnWidths.actions }}
      >
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
      </TableCell>
    </TableRow>
  )
}
