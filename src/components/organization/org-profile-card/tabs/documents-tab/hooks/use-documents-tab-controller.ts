import type { DocumentsTabProps } from "../types"
import { useDocumentsIndex } from "./use-documents-index"
import { useDocumentsBannerState } from "./use-documents-banner-state"
import { useDocumentsTabActions } from "./use-documents-tab-actions"
import { usePolicyDraftState } from "./use-policy-draft-state"
import { useDocumentsTabState } from "./use-documents-tab-state"

type UseDocumentsTabControllerArgs = Pick<
  DocumentsTabProps,
  | "userId"
  | "documents"
  | "policyEntries"
  | "policyProgramOptions"
  | "policyPeopleOptions"
  | "roadmapSections"
>

export function useDocumentsTabController({
  userId,
  documents,
  policyEntries,
  policyProgramOptions,
  policyPeopleOptions,
  roadmapSections,
}: UseDocumentsTabControllerArgs) {
  const {
    documentsState,
    setDocumentsState,
    policiesState,
    setPoliciesState,
  } = useDocumentsTabState({
    documents,
    policyEntries,
  })

  const {
    clearPendingPolicyDocument,
    createPolicyCategory,
    handlePolicyDialogOpenChange,
    markPolicyDocumentForRemoval,
    openEditPolicyDialog,
    openNewPolicyDialog,
    policyDialogOpen,
    policyDocumentBusy,
    policyDocumentPending,
    policyDocumentRemoveRequested,
    policyDraft,
    removePolicyCategory,
    resetPolicyDocumentMutations,
    selectPolicyDocument,
    setPolicyDialogOpen,
    setPolicyDocumentBusy,
    setPolicyDraft,
    togglePolicyCategory,
  } = usePolicyDraftState()

  const { isBannerVisible, handleDismissBanner } = useDocumentsBannerState({ userId })

  const {
    activeFilters,
    categoryOptions,
    clearFilters,
    filteredRows,
    handleSortColumnChange,
    handleSortDirectionChange,
    hasRoadmapDocuments,
    needsAttentionEnabled,
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    toggleFilter,
    toggleSortColumn,
    updated30dEnabled,
  } = useDocumentsIndex({
    documentsState,
    policiesState,
    policyProgramOptions,
    policyPeopleOptions,
    roadmapSections,
  })
  const {
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
  } = useDocumentsTabActions({
    documentsState,
    setDocumentsState,
    setPoliciesState,
    policyDraft,
    policyDocumentPending,
    policyDocumentRemoveRequested,
    setPolicyDialogOpen,
    setPolicyDocumentBusy,
    resetPolicyDocumentMutations,
  })

  return {
    activeFilters,
    categoryOptions,
    clearFilters,
    createPolicyCategory,
    deletingKind,
    deletingPolicyId,
    documentsState,
    downloadingKind,
    downloadingPolicyDocumentId,
    downloadPolicyDocument,
    filteredRows,
    handleDelete,
    handleDownload,
    handleDeletePolicy,
    handleDismissBanner,
    handlePolicyDialogOpenChange,
    handleSavePolicy,
    handleSortColumnChange,
    handleSortDirectionChange,
    handleUpload,
    handleView,
    hasRoadmapDocuments,
    isBannerVisible,
    markPolicyDocumentForRemoval,
    needsAttentionEnabled,
    openEditPolicyDialog,
    openNewPolicyDialog,
    policyDialogOpen,
    policyDocumentBusy,
    policyDocumentPending,
    policyDraft,
    policySavePending,
    removePolicyCategory,
    searchQuery,
    selectPolicyDocument,
    setPolicyDraft,
    setSearchQuery,
    sortColumn,
    sortDirection,
    toggleFilter,
    togglePolicyCategory,
    toggleSortColumn,
    updated30dEnabled,
    viewingKind,
    viewingPolicyDocumentId,
    viewPolicyDocument,
    viewPolicyDraftDocument,
    clearPendingPolicyDocument,
    uploadingKind,
  }
}
