"use client"

import { useMemo, useRef, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { DocumentsNotesPanel } from "../../documents-notes-right-rail"
import { useOrganizationDeepLinkFocus } from "../organization-deep-link-focus"
import {
  DocumentsBanner,
  DocumentsLibraryGrid,
  DocumentsResults,
  DocumentsStorageUsage,
  DocumentsToolbar,
  PolicyEditorDialog,
} from "./documents-tab/components"
import type {
  DocumentsLibraryFileType,
  DocumentsLibrarySource,
  DocumentsLibraryTab,
} from "./documents-tab/components/documents-library-grid"
import type { DocumentsViewMode } from "./documents-tab/components/documents-toolbar-types"
import { useDocumentsTabController } from "./documents-tab/hooks"
import { useGoogleDriveLibrary } from "./documents-tab/hooks/use-google-drive-library"
import { useOrganizationDocumentFiles } from "./documents-tab/hooks/use-organization-document-files"
import type { DocumentsTabProps } from "./documents-tab/types"

const DOCUMENTS_INDEX_CARD_CLASSNAME =
  "text-card-foreground flex flex-col border border-border/60 bg-muted relative w-full rounded-[2rem] p-3 shadow-sm overflow-hidden"
const DOCUMENTS_INDEX_BODY_CLASSNAME =
  "bg-background border-border/60 overflow-hidden rounded-[1.45rem] border p-0 first:pt-0"

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
  initialFocusKey,
  notes,
}: DocumentsTabProps) {
  const documentsRootRef = useRef<HTMLElement>(null)
  const controller = useDocumentsTabController({
    userId,
    documents,
    policyEntries,
    policyProgramOptions,
    policyPeopleOptions,
    roadmapSections,
  })
  const [libraryTab, setLibraryTab] = useState<DocumentsLibraryTab>("all")
  const [viewMode, setViewMode] = useState<DocumentsViewMode>("grid")
  const [librarySource, setLibrarySource] =
    useState<DocumentsLibrarySource>("all")
  const [libraryFileType, setLibraryFileType] =
    useState<DocumentsLibraryFileType>("all")
  const [showDeleted, setShowDeleted] = useState(false)
  const googleDrive = useGoogleDriveLibrary({ enabled: canEdit && editMode })
  const documentFiles = useOrganizationDocumentFiles()
  const visibleDriveDocuments = useMemo(() => {
    const query = controller.searchQuery.trim().toLocaleLowerCase()
    if (!query) return googleDrive.documents
    return googleDrive.documents.filter((document) =>
      document.name.toLocaleLowerCase().includes(query)
    )
  }, [controller.searchQuery, googleDrive.documents])
  const visibleUploadedFiles = useMemo(() => {
    const query = controller.searchQuery.trim().toLocaleLowerCase()
    if (!query) return documentFiles.files
    return documentFiles.files.filter((file) =>
      file.name.toLocaleLowerCase().includes(query)
    )
  }, [controller.searchQuery, documentFiles.files])

  useOrganizationDeepLinkFocus({
    focusKey: initialFocusKey,
    rootRef: documentsRootRef,
  })

  const resetLibrary = () => {
    controller.clearFilters()
    setLibraryTab("all")
    setLibrarySource("all")
    setLibraryFileType("all")
    setShowDeleted(false)
  }

  const changeViewMode = (nextViewMode: DocumentsViewMode) => {
    setViewMode(nextViewMode)
    if (nextViewMode === "list") {
      setLibraryTab("all")
      setLibrarySource("all")
      setLibraryFileType("all")
      setShowDeleted(false)
    }
  }

  return (
    <section
      ref={documentsRootRef}
      className="pb-6"
      aria-labelledby="documents-title"
    >
      <DocumentsBanner
        canEdit={canEdit}
        editMode={editMode}
        uploading={documentFiles.uploading}
        onFilesDropped={documentFiles.uploadFiles}
      >
        <DocumentsToolbar
          searchQuery={controller.searchQuery}
          tab={libraryTab}
          viewMode={viewMode}
          source={librarySource}
          fileType={libraryFileType}
          showDeleted={showDeleted}
          canEdit={canEdit}
          editMode={editMode}
          driveConnected={googleDrive.connected}
          drivePending={googleDrive.pending}
          onSearchQueryChange={controller.setSearchQuery}
          onTabChange={setLibraryTab}
          onViewModeChange={changeViewMode}
          onSourceChange={setLibrarySource}
          onFileTypeChange={setLibraryFileType}
          onShowDeletedChange={setShowDeleted}
          onReset={resetLibrary}
          onUploadFiles={documentFiles.uploadFiles}
          onGoogleDrive={() => void googleDrive.connectOrPick()}
        />

        <DocumentsStorageUsage
          usedBytes={documentFiles.usedBytes}
          limitBytes={documentFiles.limitBytes}
          loading={documentFiles.loading}
        />

        <div id="documents-index" className="mt-4" aria-live="polite">
          {viewMode === "grid" ? (
            <DocumentsLibraryGrid
              rows={controller.filteredRows}
              driveDocuments={visibleDriveDocuments}
              uploadedFiles={visibleUploadedFiles}
              tab={libraryTab}
              source={librarySource}
              fileType={libraryFileType}
              showDeleted={showDeleted}
              canEdit={canEdit}
              editMode={editMode}
              onEditPolicy={controller.openEditPolicyDialog}
              onViewPolicyDocument={controller.viewPolicyDocument}
              onViewUpload={controller.handleView}
              onViewUploadedFile={documentFiles.openFile}
              onDownloadUploadedFile={documentFiles.downloadFile}
              onDownloadUpload={controller.handleDownload}
              onDeleteUpload={controller.handleDelete}
              onDownloadPolicyDocument={controller.downloadPolicyDocument}
              onRemovePolicyDocument={controller.removePolicyDocumentFile}
              onDetachDriveDocument={googleDrive.detachDocument}
              pendingUploadedFileIds={documentFiles.pendingFileIds}
              onTrashUploadedFile={documentFiles.trashFile}
              onRestoreUploadedFile={documentFiles.restoreFile}
              onPermanentlyDeleteUploadedFile={
                documentFiles.permanentlyDeleteFile
              }
              onReset={resetLibrary}
            />
          ) : (
            <Card className={DOCUMENTS_INDEX_CARD_CLASSNAME}>
              <CardContent className={DOCUMENTS_INDEX_BODY_CLASSNAME}>
                <DocumentsResults
                  filteredRows={controller.filteredRows}
                  clearFilters={controller.clearFilters}
                  sortColumn={controller.sortColumn}
                  sortDirection={controller.sortDirection}
                  onToggleSortColumn={controller.toggleSortColumn}
                  canEdit={canEdit}
                  editMode={editMode}
                  publicSlug={publicSlug}
                  uploadingKind={controller.uploadingKind}
                  deletingKind={controller.deletingKind}
                  viewingKind={controller.viewingKind}
                  downloadingKind={controller.downloadingKind}
                  deletingPolicyId={controller.deletingPolicyId}
                  viewingPolicyDocumentId={controller.viewingPolicyDocumentId}
                  downloadingPolicyDocumentId={
                    controller.downloadingPolicyDocumentId
                  }
                  onUpload={controller.handleUpload}
                  onDeleteUpload={controller.handleDelete}
                  onViewUpload={controller.handleView}
                  onDownloadUpload={controller.handleDownload}
                  onEditPolicy={controller.openEditPolicyDialog}
                  onDeletePolicy={controller.handleDeletePolicy}
                  onViewPolicyDocument={controller.viewPolicyDocument}
                  onDownloadPolicyDocument={controller.downloadPolicyDocument}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {notes ? <DocumentsNotesPanel notes={notes} /> : null}
      </DocumentsBanner>

      <PolicyEditorDialog
        open={controller.policyDialogOpen}
        onOpenChange={controller.handlePolicyDialogOpenChange}
        draft={controller.policyDraft}
        categoryOptions={controller.categoryOptions}
        peopleOptions={policyPeopleOptions}
        programOptions={policyProgramOptions}
        pending={controller.policySavePending}
        pendingDocumentName={controller.policyDocumentPending?.name ?? null}
        pendingDocumentUpload={controller.policyDocumentBusy}
        viewingDocument={
          controller.viewingPolicyDocumentId === controller.policyDraft.id
        }
        onChange={controller.setPolicyDraft}
        onToggleCategory={controller.togglePolicyCategory}
        onCreateCategory={controller.createPolicyCategory}
        onRemoveCategory={controller.removePolicyCategory}
        onSelectDocument={controller.selectPolicyDocument}
        onClearPendingDocument={controller.clearPendingPolicyDocument}
        onRemoveExistingDocument={controller.markPolicyDocumentForRemoval}
        onViewDocument={controller.viewPolicyDraftDocument}
        onSave={controller.handleSavePolicy}
      />
    </section>
  )
}
