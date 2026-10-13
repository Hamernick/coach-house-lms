import type { Dispatch, SetStateAction } from "react"
import { useDocumentsPolicyActions } from "./use-documents-policy-actions"
import { useDocumentsUploadActions } from "./use-documents-upload-actions"

import type { OrgDocuments } from "../../../types"
import type { DocumentsPolicyEntry, PolicyDraft } from "../types"

type UseDocumentsTabActionsArgs = {
  documentsState: OrgDocuments
  setDocumentsState: Dispatch<SetStateAction<OrgDocuments>>
  setPoliciesState: Dispatch<SetStateAction<DocumentsPolicyEntry[]>>
  policyDraft: PolicyDraft
  policyDocumentPending: File | null
  policyDocumentRemoveRequested: boolean
  setPolicyDialogOpen: (open: boolean) => void
  setPolicyDocumentBusy: (busy: boolean) => void
  resetPolicyDocumentMutations: () => void
}

export function useDocumentsTabActions({
  documentsState,
  setDocumentsState,
  setPoliciesState,
  policyDraft,
  policyDocumentPending,
  policyDocumentRemoveRequested,
  setPolicyDialogOpen,
  setPolicyDocumentBusy,
  resetPolicyDocumentMutations,
}: UseDocumentsTabActionsArgs) {
  const {
    deletingKind,
    downloadingKind,
    handleDelete,
    handleDownload,
    handleUpload,
    handleView,
    uploadingKind,
    viewingKind,
  } = useDocumentsUploadActions({
    documentsState,
    setDocumentsState,
  })

  const {
    deletingPolicyId,
    downloadingPolicyDocumentId,
    downloadPolicyDocument,
    handleDeletePolicy,
    handleSavePolicy,
    policySavePending,
    viewingPolicyDocumentId,
    viewPolicyDocument,
    viewPolicyDraftDocument,
  } = useDocumentsPolicyActions({
    setPoliciesState,
    policyDraft,
    policyDocumentPending,
    policyDocumentRemoveRequested,
    setPolicyDialogOpen,
    setPolicyDocumentBusy,
    resetPolicyDocumentMutations,
  })

  return {
    deletingKind,
    deletingPolicyId,
    downloadingKind,
    downloadingPolicyDocumentId,
    downloadPolicyDocument,
    handleDelete,
    handleDownload,
    handleDeletePolicy,
    handleSavePolicy,
    handleUpload,
    handleView,
    policySavePending,
    uploadingKind,
    viewingKind,
    viewingPolicyDocumentId,
    viewPolicyDocument,
    viewPolicyDraftDocument,
  }
}
