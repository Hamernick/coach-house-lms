"use client"

import { useEffect, useMemo, useState } from "react"

import type { DriveLibraryDocument } from "./use-google-drive-library"
import type { OrganizationDocumentFile } from "./use-organization-document-files"
import type { DocumentIndexRow, DocumentsPolicyEntry } from "../types"

type SelectableLibraryItem = {
  id: string
  deleted: boolean
  row?: DocumentIndexRow
  uploadedFile?: OrganizationDocumentFile
  driveDocument?: DriveLibraryDocument
}

type SelectionActions = {
  onDownloadUploadedFile: (file: OrganizationDocumentFile) => Promise<void>
  onDownloadUpload: (
    definition: Extract<DocumentIndexRow, { source: "upload" }>["definition"]
  ) => Promise<void>
  onDeleteUpload: (
    definition: Extract<DocumentIndexRow, { source: "upload" }>["definition"],
    options?: { confirm?: boolean }
  ) => Promise<void>
  onDownloadPolicyDocument: (policy: DocumentsPolicyEntry) => Promise<void>
  onRemovePolicyDocument: (
    policy: DocumentsPolicyEntry,
    options?: { confirm?: boolean }
  ) => Promise<void>
  onDetachDriveDocument: (documentId: string) => Promise<void>
  onTrashUploadedFile: (file: OrganizationDocumentFile) => Promise<void>
  onPermanentlyDeleteUploadedFile: (
    file: OrganizationDocumentFile
  ) => Promise<void>
}

export function useDocumentsLibrarySelection({
  items,
  canEdit,
  editMode,
  actions,
}: {
  items: SelectableLibraryItem[]
  canEdit: boolean
  editMode: boolean
  actions: SelectionActions
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  )
  const canDownload =
    selectedItems.length > 0 &&
    selectedItems.every(
      (item) =>
        !item.deleted &&
        (Boolean(item.uploadedFile) ||
          item.row?.source === "upload" ||
          (item.row?.source === "policy" &&
            Boolean(item.row.policy.document?.path)))
    )
  const canDelete =
    canEdit &&
    editMode &&
    selectedItems.length > 0 &&
    selectedItems.every(
      (item) =>
        Boolean(item.uploadedFile) ||
        Boolean(item.driveDocument) ||
        item.row?.source === "upload" ||
        (item.row?.source === "policy" &&
          Boolean(item.row.policy.document?.path))
    )

  useEffect(() => {
    const visibleIds = new Set(items.map((item) => item.id))
    setSelectedIds((current) => current.filter((id) => visibleIds.has(id)))
  }, [items])

  const toggle = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    )
  }

  const download = async () => {
    if (!canDownload || pending) return
    setPending(true)
    try {
      for (const item of selectedItems) {
        if (item.uploadedFile) {
          await actions.onDownloadUploadedFile(item.uploadedFile)
        } else if (item.row?.source === "upload") {
          await actions.onDownloadUpload(item.row.definition)
        } else if (item.row?.source === "policy") {
          await actions.onDownloadPolicyDocument(item.row.policy)
        }
      }
      setSelectedIds([])
    } finally {
      setPending(false)
    }
  }

  const remove = async () => {
    if (!canDelete || pending) return
    const count = selectedItems.length
    if (
      !window.confirm(
        `Delete ${count} selected ${count === 1 ? "document" : "documents"}? This action cannot always be undone.`
      )
    ) {
      return
    }

    setPending(true)
    try {
      for (const item of selectedItems) {
        if (item.uploadedFile) {
          await (item.deleted
            ? actions.onPermanentlyDeleteUploadedFile(item.uploadedFile)
            : actions.onTrashUploadedFile(item.uploadedFile))
        } else if (item.driveDocument) {
          await actions.onDetachDriveDocument(item.driveDocument.id)
        } else if (item.row?.source === "upload") {
          await actions.onDeleteUpload(item.row.definition, { confirm: false })
        } else if (item.row?.source === "policy") {
          await actions.onRemovePolicyDocument(item.row.policy, {
            confirm: false,
          })
        }
      }
      setSelectedIds([])
    } finally {
      setPending(false)
    }
  }

  return {
    canDelete,
    canDownload,
    download,
    pending,
    remove,
    selectedIds,
    selectedItems,
    toggle,
  }
}
