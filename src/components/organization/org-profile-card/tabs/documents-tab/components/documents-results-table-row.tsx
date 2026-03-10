"use client"

import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"

import { SOURCE_LABEL } from "../constants"
import { formatBytes, formatUpdatedAt } from "../helpers"
import type { DocumentIndexRow } from "../types"
import { CategoryBadges, StatusBadge } from "./document-row-meta"
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
}

function tourIdForRow(row: DocumentIndexRow) {
  return row.source === "upload" && row.definition.kind === "verification-letter"
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
      <TableCell>
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-foreground">{row.name}</p>
          <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
            {row.description || "-"}
          </p>
          {details ? <p className="text-xs text-muted-foreground">{details}</p> : null}
        </div>
      </TableCell>
      <TableCell className="whitespace-normal text-right">
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
      <TableCell>
        <CategoryBadges categories={row.categories} />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {SOURCE_LABEL[row.source]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {row.visibility}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatUpdatedAt(row.updatedAt)}
      </TableCell>
    </TableRow>
  )
}
