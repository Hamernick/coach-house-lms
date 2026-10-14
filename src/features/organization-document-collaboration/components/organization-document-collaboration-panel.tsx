"use client"
import { useEffect, useMemo, useState } from "react"
import { RoadmapBudgetTableEditor } from "@/components/roadmap/roadmap-budget-table-editor"
import { normalizeRoadmapBudgetRows } from "@/lib/roadmap/budget"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Button } from "@/components/ui/button"
import { DocumentDraftRecovery, type RecoverableDocumentDraft } from "./document-draft-recovery"
import type { RichTextEditorProps } from "@/components/rich-text-editor/types"
import type { RoadmapSection } from "@/lib/roadmap"
import type { DocumentTransport } from "../types"
import { DocumentVersionHistory } from "./document-version-history"
import { useOrganizationDocumentCollaborationController } from "../hooks/use-organization-document-collaboration-controller"

export function OrganizationDocumentCollaborationPanel({ section, organizationId, userId, onPendingChange, onSavedSection, editorProps, canEdit = true, initialDraft, hideTextEditor = false, transport }: {
  hideTextEditor?: boolean; initialDraft?: RecoverableDocumentDraft; canEdit?: boolean; editorProps?: Partial<RichTextEditorProps>; onSavedSection?: (section: RoadmapSection) => void;
  transport?: DocumentTransport; section: RoadmapSection; organizationId: string; userId: string; onPendingChange?: (pending: boolean) => void
}) {
  const [recoveredDraft, setRecoveredDraft] = useState(initialDraft ?? null)
  const scope = useMemo(() => ({ organizationId, sectionId: section.id }), [organizationId, section.id])
  const controller = useOrganizationDocumentCollaborationController(scope, userId, transport, canEdit)
  const { loaded, ready, error, status, participants, onReady, sync, editorRef } = controller
  useEffect(() => { onPendingChange?.(controller.dirty.current) }, [status, onPendingChange, controller.dirty])
  useEffect(() => { if (controller.savedSection && !recoveredDraft) onSavedSection?.(controller.savedSection) }, [controller.savedSection, onSavedSection, recoveredDraft])
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
      <span>{status}</span>
      <span className="text-muted-foreground">{participants.map(person => `${person.display_name} (${person.role}) · ${person.mode}`).join(", ")}</span>
    </div>
    {recoveredDraft ? <DocumentDraftRecovery draft={recoveredDraft} disabled={!ready || !canEdit}
      discard={() => setRecoveredDraft(null)} restore={() => {
        editorRef.current?.commands.setContent(recoveredDraft.content)
        if (section.id === "budget") controller.changeBudgetRows(recoveredDraft.budgetRows ?? [])
        setRecoveredDraft(null)
        void sync()
      }} /> : null}
    {loaded ? <RichTextEditor {...editorProps} className={hideTextEditor ? "hidden" : editorProps?.className} value={loaded.section.content} onChange={() => {}} onReady={onReady}
      toolbarTrailingActions={canEdit ? <Button type="button" size="sm" variant="ghost"
        onClick={() => void sync()} disabled={!ready || status === "Saved"}
        className="text-muted-foreground hover:text-foreground gap-2">{status}</Button> : null}
      applyExternalValue={false} readOnly={!ready || !canEdit || Boolean(recoveredDraft)} preserveImages minHeight={300} ariaLabel={section.title} /> : <p className="text-sm">Opening document…</p>}
    {loaded && section.id === "budget" ? <RoadmapBudgetTableEditor rows={controller.budgetRows}
      canEdit={ready && canEdit && !recoveredDraft} isDirty={status !== "Saved"} isSaving={status === "Saving…"}
      onRowsChange={controller.changeBudgetRows} onSave={() => void sync()} /> : null}
    {controller.budgetConflict ? <div className="space-y-2">
      <p className="text-sm">Latest saved budget</p>
      <RoadmapBudgetTableEditor rows={controller.budgetConflict} canEdit={false} isDirty={false} isSaving={false} onRowsChange={() => {}} onSave={() => {}} />
      <Button variant="outline" size="sm" onClick={() => controller.resolveBudgetConflict(false)}>Use saved rows</Button>
      <Button variant="outline" size="sm" onClick={() => controller.resolveBudgetConflict(true)}>Save my rows instead</Button>
    </div> : null}
    {error ? <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error}</p>
      {!controller.blocked ? <Button variant="outline" size="sm" onClick={() => void controller.retry()}>Try connecting again</Button> : null}
      <Button variant="outline" size="sm" onClick={() => {
        const html = editorRef.current?.getHTML()
        if (html === undefined) return
        const url = URL.createObjectURL(new Blob([JSON.stringify({ content: html, budgetRows: controller.budgetRows }, null, 2)], { type: "application/json" }))
        const link = document.createElement("a"); link.href = url; link.download = "document-unsaved-copy.json"; link.click(); URL.revokeObjectURL(url)
      }}>Download my current copy</Button>
    </div> : null}
    <DocumentVersionHistory scope={scope} transport={transport} disabled={!ready || !canEdit || Boolean(recoveredDraft) || status !== "Saved"} restore={version => {
      if (section.id === "budget") controller.changeBudgetRows(normalizeRoadmapBudgetRows(version.content?.budgetRows))
      editorRef.current?.commands.setContent(String(version.content?.content ?? ""))
      void sync()
    }} />
  </div>
}
