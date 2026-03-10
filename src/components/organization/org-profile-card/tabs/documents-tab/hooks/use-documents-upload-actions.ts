import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"

import { toast } from "@/lib/toast"

import type { OrgDocuments } from "../../../types"
import { deleteOrgDocument, getOrgDocumentUrl, uploadOrgDocument } from "../api"
import { validatePdf } from "../helpers"
import type { DocumentDefinition } from "../types"

type UseDocumentsUploadActionsArgs = {
  documentsState: OrgDocuments
  setDocumentsState: Dispatch<SetStateAction<OrgDocuments>>
}

export function useDocumentsUploadActions({
  documentsState,
  setDocumentsState,
}: UseDocumentsUploadActionsArgs) {
  const [uploadingKind, setUploadingKind] = useState<string | null>(null)
  const [deletingKind, setDeletingKind] = useState<string | null>(null)
  const [viewingKind, setViewingKind] = useState<string | null>(null)
  const [downloadingKind, setDownloadingKind] = useState<string | null>(null)

  const handleUpload = async (definition: DocumentDefinition, file: File) => {
    const validationError = validatePdf(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploadingKind(definition.kind)
    const toastId = toast.loading("Uploading document…")
    try {
      const nextDoc = await uploadOrgDocument(definition.kind, file)
      setDocumentsState((current) => ({
        ...current,
        [definition.key]: nextDoc,
      }))
      toast.success("Document saved", { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed", {
        id: toastId,
      })
    } finally {
      setUploadingKind(null)
    }
  }

  const handleView = async (definition: DocumentDefinition) => {
    const current = documentsState?.[definition.key] ?? null
    if (!current?.path) return

    setViewingKind(definition.kind)
    try {
      const url = await getOrgDocumentUrl(definition.kind)
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to open document")
    } finally {
      setViewingKind(null)
    }
  }

  const handleDelete = async (definition: DocumentDefinition) => {
    const current = documentsState?.[definition.key] ?? null
    if (!current?.path) return
    if (!window.confirm("Remove this document?")) return

    setDeletingKind(definition.kind)
    try {
      await deleteOrgDocument(definition.kind)
      setDocumentsState((currentState) => ({
        ...currentState,
        [definition.key]: null,
      }))
      toast.success("Document removed")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setDeletingKind(null)
    }
  }

  const handleDownload = async (definition: DocumentDefinition) => {
    const current = documentsState?.[definition.key] ?? null
    if (!current?.path) return

    setDownloadingKind(definition.kind)
    try {
      const url = await getOrgDocumentUrl(definition.kind, { download: true })
      window.open(url, "_blank", "noopener")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to download document")
    } finally {
      setDownloadingKind(null)
    }
  }

  return {
    deletingKind,
    downloadingKind,
    handleDelete,
    handleDownload,
    handleUpload,
    handleView,
    uploadingKind,
    viewingKind,
  }
}
