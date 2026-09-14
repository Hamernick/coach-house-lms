"use client"

import { useState } from "react"
import { loadRoadmapSectionForRecovery } from "@/actions/roadmap-recovery"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapBudgetTableEditor } from "@/components/roadmap/roadmap-budget-table-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { RoadmapSection } from "@/lib/roadmap"
import { createDraft } from "../helpers"
import type { RoadmapSaveIssue } from "../hooks/use-roadmap-editor-save"
import type { RoadmapDraft, RoadmapDraftScope } from "../types"

export function RoadmapSaveFeedback({
  issue,
  offline,
  storageFailed,
  draft,
  draftScope,
  onRetry,
  onResolve,
  loadSection = loadRoadmapSectionForRecovery,
}: {
  issue?: RoadmapSaveIssue
  offline: boolean
  storageFailed: boolean
  draft: RoadmapDraft
  draftScope?: RoadmapDraftScope
  onRetry: () => void
  onResolve: (section: RoadmapSection, keepDraft: boolean) => void
  loadSection?: typeof loadRoadmapSectionForRecovery
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<RoadmapSection | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!issue && !offline && !storageFailed) return null

  async function review() {
    if (!draftScope) return
    setOpen(true)
    setLoading(true)
    setSaved(null)
    setError(null)
    try {
      const result = await loadSection({ ...draftScope, sectionId: draft.id })
      if ("error" in result)
        setError(result.error ?? "The saved document could not load.")
      else setSaved(result.section)
    } catch {
      setError("The saved document could not load. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Alert className="shrink-0">
        <AlertDescription
          className="flex flex-wrap items-center justify-between gap-2"
          aria-live="polite"
        >
          <div className="min-w-0 space-y-1">
            {offline ? <p>Offline. Your changes are waiting to save.</p> : null}
            {issue ? (
              <p>
                {issue.kind === "conflict"
                  ? "The saved document changed. Your draft is still here."
                  : issue.message}
              </p>
            ) : null}
            {storageFailed ? (
              <p>
                Browser backup is unavailable. Keep this page open until your
                changes are saved.
              </p>
            ) : null}
          </div>
          {issue?.kind === "conflict" && draftScope ? (
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-8"
              disabled={offline}
              onClick={() => void review()}
            >
              Review changes
            </Button>
          ) : issue?.kind === "error" ? (
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-8"
              disabled={offline}
              onClick={onRetry}
            >
              Retry save
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90dvh] min-w-0 flex-col sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review document changes</DialogTitle>
            <DialogDescription>
              Compare your draft with the saved document. Choose which version
              to keep.
            </DialogDescription>
          </DialogHeader>
          {loading ? <p role="status">Loading saved document…</p> : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                <Button variant="ghost" onClick={() => void review()}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {saved ? (
            <div className="grid min-h-0 gap-4 overflow-auto overscroll-contain sm:grid-cols-2">
              <DraftPreview label="Your draft" draft={draft} />
              <DraftPreview label="Saved document" draft={createDraft(saved)} />
            </div>
          ) : null}
          <p className="text-muted-foreground text-sm">
            Using the saved version discards your draft. Saving your version
            replaces the saved document.
          </p>
          <DialogFooter className="flex-wrap gap-2">
            <Button
              className="min-h-11 sm:min-h-8"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Keep reviewing later
            </Button>
            <Button
              className="min-h-11 sm:min-h-8"
              variant="outline"
              disabled={!saved || offline}
              onClick={() => {
                if (saved) onResolve(saved, false)
                setOpen(false)
              }}
            >
              Use saved version
            </Button>
            <Button
              className="min-h-11 sm:min-h-8"
              disabled={!saved || offline}
              onClick={() => {
                if (saved) onResolve(saved, true)
                setOpen(false)
              }}
            >
              Save my version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DraftPreview({
  label,
  draft,
}: {
  label: string
  draft: RoadmapDraft
}) {
  return (
    <section className="min-w-0 space-y-2" aria-label={label}>
      <h3 className="font-medium">{label}</h3>
      {draft.title ? (
        <p className="text-sm font-medium break-words">{draft.title}</p>
      ) : null}
      {draft.subtitle ? (
        <p className="text-sm break-words">{draft.subtitle}</p>
      ) : null}
      <RichTextEditor
        value={draft.content}
        onChange={() => {}}
        readOnly
        ariaLabel={`${label} text`}
        minHeight={120}
        maxHeight={320}
        preserveImages
        className="min-w-0"
      />
      {draft.id === "budget" ? (
        <RoadmapBudgetTableEditor
          rows={draft.budgetRows}
          canEdit={false}
          isDirty={false}
          isSaving={false}
          onRowsChange={() => {}}
          onSave={() => {}}
        />
      ) : null}
      {draft.imageUrl ? (
        <p className="text-xs break-all">Cover image: {draft.imageUrl}</p>
      ) : null}
    </section>
  )
}
