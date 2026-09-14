"use client"

import { pickGoogleDriveFiles } from "@/features/google-drive/client"
import { useState } from "react"
import { DocumentImportButton } from "@/features/document-import/client"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapBudgetTableEditor } from "@/components/roadmap/roadmap-budget-table-editor"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RoadmapDraft } from "../types"

export function RoadmapBudgetDocumentEditor({
  draft,
  title,
  canEdit,
  isDirty,
  isSaving,
  onDraftChange,
  onImageUpload,
  onSave,
}: {
  draft: RoadmapDraft
  title: string
  canEdit: boolean
  isDirty: boolean
  isSaving: boolean
  onDraftChange: (updates: Partial<RoadmapDraft>) => void
  onImageUpload: (file: File) => Promise<string>
  onSave: () => void
}) {
  const [view, setView] = useState(draft.content.trim() ? "document" : "budget")
  return (
    <Tabs
      value={view}
      onValueChange={setView}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="budget">Line items</TabsTrigger>
          <TabsTrigger value="document">Document</TabsTrigger>
        </TabsList>
        {canEdit && view === "budget" ? (
          <DocumentImportButton
            onPickGoogleDrive={pickGoogleDriveFiles}
            title={title}
            content={draft.content}
            onChange={(content) => {
              onDraftChange({ content })
              setView("document")
            }}
          />
        ) : null}
      </div>
      <TabsContent value="budget" className="flex min-h-0 flex-1 flex-col">
        <RoadmapBudgetTableEditor
          rows={draft.budgetRows}
          canEdit={canEdit}
          isDirty={isDirty}
          isSaving={isSaving}
          onRowsChange={(budgetRows) => onDraftChange({ budgetRows })}
          onSave={onSave}
        />
      </TabsContent>
      <TabsContent value="document" className="flex min-h-0 flex-1 flex-col">
        <RichTextEditor
          value={draft.content}
          onChange={(content) => onDraftChange({ content })}
          ariaLabel={`${title} document`}
          documentTitle={title}
          enableDocumentImport={canEdit}
          preserveImages
          readOnly={!canEdit}
          onImageUpload={canEdit ? onImageUpload : undefined}
          disableResize
          className="flex min-h-0 flex-1 flex-col"
          contentClassName="min-h-0 flex-1 overflow-y-auto"
          toolbarTrailingActions={
            canEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isDirty || isSaving}
                onClick={onSave}
              >
                {isSaving ? "Saving…" : isDirty ? "Save" : "Saved"}
              </Button>
            ) : null
          }
        />
      </TabsContent>
    </Tabs>
  )
}
