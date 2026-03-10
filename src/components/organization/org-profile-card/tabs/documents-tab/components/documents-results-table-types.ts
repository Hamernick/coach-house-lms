import type {
  DocumentDefinition,
  DocumentIndexRow,
  DocumentsPolicyEntry,
  SortColumn,
  SortDirection,
} from "../types"

export type DocumentsResultsTableProps = {
  filteredRows: DocumentIndexRow[]
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
