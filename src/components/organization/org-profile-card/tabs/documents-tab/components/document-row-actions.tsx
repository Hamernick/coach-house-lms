"use client"

import type {
  DocumentDefinition,
  DocumentIndexRow,
  DocumentsPolicyEntry,
} from "../types"
import { PolicyRowActions } from "./policy-row-actions"
import { RoadmapRowActions } from "./roadmap-row-actions"
import { UploadRowActions } from "./upload-row-actions"

type DocumentRowActionsProps = {
  row: DocumentIndexRow
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

export function DocumentRowActions({
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
}: DocumentRowActionsProps) {
  if (row.source === "upload") {
    return (
      <UploadRowActions
        definition={row.definition}
        document={row.document}
        canEdit={canEdit}
        editMode={editMode}
        isUploading={uploadingKind === row.definition.kind}
        isDeleting={deletingKind === row.definition.kind}
        isViewing={viewingKind === row.definition.kind}
        isDownloading={downloadingKind === row.definition.kind}
        onUpload={onUpload}
        onDelete={onDeleteUpload}
        onView={onViewUpload}
        onDownload={onDownloadUpload}
      />
    )
  }

  if (row.source === "policy") {
    return (
      <PolicyRowActions
        row={row}
        canEdit={canEdit}
        editMode={editMode}
        deleting={deletingPolicyId === row.policy.id}
        viewingDocument={viewingPolicyDocumentId === row.policy.id}
        downloadingDocument={downloadingPolicyDocumentId === row.policy.id}
        onEdit={onEditPolicy}
        onDelete={onDeletePolicy}
        onViewDocument={onViewPolicyDocument}
        onDownloadDocument={onDownloadPolicyDocument}
      />
    )
  }

  return <RoadmapRowActions row={row} publicSlug={publicSlug} />
}
