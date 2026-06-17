"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Table, TableBody } from "@/components/ui/table"

import {
  clampDocumentsResultsTableColumnWidth,
  DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS,
  DOCUMENTS_RESULTS_TABLE_COLUMNS,
  DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTH_STORAGE_KEY,
  type DocumentsResultsTableColumnId,
  type DocumentsResultsTableColumnWidths,
  sanitizeDocumentsResultsTableColumnWidths,
} from "./documents-results-table-columns"
import { DocumentsResultsTableHeader } from "./documents-results-table-header"
import { DocumentsResultsTableRow } from "./documents-results-table-row"
import type { DocumentsResultsTableProps } from "./documents-results-table-types"

function readStoredColumnWidths() {
  if (typeof window === "undefined") {
    return DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS
  }

  try {
    const storedValue = window.localStorage.getItem(
      DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTH_STORAGE_KEY
    )
    if (!storedValue) {
      return DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS
    }
    return sanitizeDocumentsResultsTableColumnWidths(JSON.parse(storedValue))
  } catch {
    return DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS
  }
}

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
  const [hasLoadedStoredWidths, setHasLoadedStoredWidths] = useState(false)
  const [columnWidths, setColumnWidths] =
    useState<DocumentsResultsTableColumnWidths>(
      DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS
    )

  useEffect(() => {
    setColumnWidths(readStoredColumnWidths())
    setHasLoadedStoredWidths(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedStoredWidths || typeof window === "undefined") return
    try {
      window.localStorage.setItem(
        DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTH_STORAGE_KEY,
        JSON.stringify(columnWidths)
      )
    } catch {
      // Ignore private-mode or quota failures; resizing still works for the session.
    }
  }, [columnWidths, hasLoadedStoredWidths])

  const tableWidth = useMemo(
    () =>
      DOCUMENTS_RESULTS_TABLE_COLUMNS.reduce(
        (width, column) => width + columnWidths[column.id],
        0
      ),
    [columnWidths]
  )

  const handleColumnWidthChange = useCallback(
    (columnId: DocumentsResultsTableColumnId, width: number) => {
      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [columnId]: clampDocumentsResultsTableColumnWidth(columnId, width),
      }))
    },
    []
  )

  return (
    <div className="hidden w-full md:block">
      <Table
        className="w-full table-fixed border-collapse"
        style={{ minWidth: tableWidth }}
      >
        <colgroup>
          {DOCUMENTS_RESULTS_TABLE_COLUMNS.map((column) => (
            <col key={column.id} style={{ width: columnWidths[column.id] }} />
          ))}
        </colgroup>
        <DocumentsResultsTableHeader
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onToggleSortColumn={onToggleSortColumn}
          columnWidths={columnWidths}
          onColumnWidthChange={handleColumnWidthChange}
        />
        <TableBody>
          {filteredRows.map((row) => (
            <DocumentsResultsTableRow
              key={row.id}
              row={row}
              columnWidths={columnWidths}
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
