"use client"

export type DocumentsResultsTableColumnId =
  | "status"
  | "name"
  | "category"
  | "updatedAt"
  | "visibility"
  | "actions"

type DocumentsResultsTableColumnConfig = {
  id: DocumentsResultsTableColumnId
  label: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
}

export type DocumentsResultsTableColumnWidths = Record<
  DocumentsResultsTableColumnId,
  number
>

export const DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTH_STORAGE_KEY =
  "coach-house.documents-results-table.column-widths.v1"

export const DOCUMENTS_RESULTS_TABLE_COLUMNS = [
  {
    id: "status",
    label: "Status",
    defaultWidth: 150,
    minWidth: 128,
    maxWidth: 260,
  },
  {
    id: "name",
    label: "Name",
    defaultWidth: 360,
    minWidth: 300,
    maxWidth: 720,
  },
  {
    id: "category",
    label: "Category",
    defaultWidth: 220,
    minWidth: 160,
    maxWidth: 420,
  },
  {
    id: "updatedAt",
    label: "Last updated",
    defaultWidth: 150,
    minWidth: 128,
    maxWidth: 260,
  },
  {
    id: "visibility",
    label: "Visibility",
    defaultWidth: 132,
    minWidth: 112,
    maxWidth: 220,
  },
  {
    id: "actions",
    label: "Actions",
    defaultWidth: 216,
    minWidth: 196,
    maxWidth: 360,
  },
] as const satisfies readonly DocumentsResultsTableColumnConfig[]

export const DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS =
  DOCUMENTS_RESULTS_TABLE_COLUMNS.reduce((widths, column) => {
    widths[column.id] = column.defaultWidth
    return widths
  }, {} as DocumentsResultsTableColumnWidths)

export function getDocumentsResultsTableColumnConfig(
  columnId: DocumentsResultsTableColumnId
) {
  return DOCUMENTS_RESULTS_TABLE_COLUMNS.find(
    (column) => column.id === columnId
  )!
}

export function clampDocumentsResultsTableColumnWidth(
  columnId: DocumentsResultsTableColumnId,
  width: number
) {
  const column = getDocumentsResultsTableColumnConfig(columnId)
  return Math.min(column.maxWidth, Math.max(column.minWidth, Math.round(width)))
}

export function sanitizeDocumentsResultsTableColumnWidths(
  value: unknown
): DocumentsResultsTableColumnWidths {
  if (!value || typeof value !== "object") {
    return DEFAULT_DOCUMENTS_RESULTS_TABLE_COLUMN_WIDTHS
  }

  const source = value as Partial<
    Record<DocumentsResultsTableColumnId, unknown>
  >
  return DOCUMENTS_RESULTS_TABLE_COLUMNS.reduce((widths, column) => {
    const nextWidth = source[column.id]
    widths[column.id] =
      typeof nextWidth === "number" && Number.isFinite(nextWidth)
        ? clampDocumentsResultsTableColumnWidth(column.id, nextWidth)
        : column.defaultWidth
    return widths
  }, {} as DocumentsResultsTableColumnWidths)
}
