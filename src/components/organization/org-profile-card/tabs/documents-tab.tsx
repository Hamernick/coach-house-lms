"use client"

import { Card, CardContent } from "@/components/ui/card"

import {
  DocumentsBanner,
  DocumentsResults,
  DocumentsToolbar,
  PolicyEditorDialog,
} from "./documents-tab/components"
import { useDocumentsTabController } from "./documents-tab/hooks"
import type { DocumentsTabProps } from "./documents-tab/types"

export type {
  DocumentsOption,
  DocumentsPolicyEntry,
  DocumentsRoadmapSection,
} from "./documents-tab/types"

export function DocumentsTab({
  userId,
  documents,
  policyEntries,
  policyProgramOptions,
  policyPeopleOptions,
  roadmapSections,
  publicSlug,
  editMode,
  canEdit,
}: DocumentsTabProps) {
  const {
    activeFilters,
    categoryOptions,
    clearFilters,
    clearPendingPolicyDocument,
    createPolicyCategory,
    deletingKind,
    deletingPolicyId,
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
    uploadingKind,
    viewingKind,
    viewingPolicyDocumentId,
    viewPolicyDocument,
    viewPolicyDraftDocument,
  } = useDocumentsTabController({
    userId,
    documents,
    policyEntries,
    policyProgramOptions,
    policyPeopleOptions,
    roadmapSections,
  })

  return (
    <section className="space-y-4 pb-6" aria-labelledby="documents-title">
      {isBannerVisible ? (
        <DocumentsBanner
          hasRoadmapDocuments={hasRoadmapDocuments}
          canEdit={canEdit}
          onDismiss={handleDismissBanner}
        />
      ) : null}

      <DocumentsToolbar
        searchQuery={searchQuery}
        activeFilters={activeFilters}
        hasRoadmapDocuments={hasRoadmapDocuments}
        categoryOptions={categoryOptions}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        needsAttentionEnabled={needsAttentionEnabled}
        updated30dEnabled={updated30dEnabled}
        canEdit={canEdit}
        editMode={editMode}
        onSearchQueryChange={setSearchQuery}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        onSortColumnChange={handleSortColumnChange}
        onSortDirectionChange={handleSortDirectionChange}
        onOpenNewPolicy={openNewPolicyDialog}
      />

      <Card id="documents-index" className="overflow-hidden">
        <CardContent className="p-0 first:pt-0">
          <DocumentsResults
            filteredRows={filteredRows}
            clearFilters={clearFilters}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onToggleSortColumn={toggleSortColumn}
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
            onUpload={handleUpload}
            onDeleteUpload={handleDelete}
            onViewUpload={handleView}
            onDownloadUpload={handleDownload}
            onEditPolicy={openEditPolicyDialog}
            onDeletePolicy={handleDeletePolicy}
            onViewPolicyDocument={viewPolicyDocument}
            onDownloadPolicyDocument={downloadPolicyDocument}
          />
        </CardContent>
      </Card>

      <PolicyEditorDialog
        open={policyDialogOpen}
        onOpenChange={handlePolicyDialogOpenChange}
        draft={policyDraft}
        categoryOptions={categoryOptions}
        peopleOptions={policyPeopleOptions}
        programOptions={policyProgramOptions}
        pending={policySavePending}
        pendingDocumentName={policyDocumentPending?.name ?? null}
        pendingDocumentUpload={policyDocumentBusy}
        viewingDocument={viewingPolicyDocumentId === policyDraft.id}
        onChange={setPolicyDraft}
        onToggleCategory={togglePolicyCategory}
        onCreateCategory={createPolicyCategory}
        onRemoveCategory={removePolicyCategory}
        onSelectDocument={selectPolicyDocument}
        onClearPendingDocument={clearPendingPolicyDocument}
        onRemoveExistingDocument={markPolicyDocumentForRemoval}
        onViewDocument={viewPolicyDraftDocument}
        onSave={handleSavePolicy}
      />
    </section>
  )
}
