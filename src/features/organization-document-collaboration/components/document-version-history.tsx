"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RoadmapBudgetTableEditor } from "@/components/roadmap/roadmap-budget-table-editor"
import { normalizeRoadmapBudgetRows } from "@/lib/roadmap/budget"
import { RichTextEditor } from "@/components/rich-text-editor"
import { defaultDocumentTransport } from "../hooks/use-organization-document-collaboration-controller"
import type { DocumentScope, DocumentVersion, DocumentTransport } from "../types"

export function DocumentVersionHistory({ scope, disabled, restore, transport = defaultDocumentTransport }: {
  scope: DocumentScope; transport?: DocumentTransport; disabled: boolean; restore: (version: DocumentVersion) => void
}) {
  const [versions, setVersions] = useState<DocumentVersion[] | null>(null)
  const [selected, setSelected] = useState<DocumentVersion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  async function load() {
    setLoading(true)
    try {
      const result = await transport.versions(scope)
      if ("error" in result) setError(result.error)
      else { setVersions(result.versions); setError(null) }
    } catch { setError("Unable to load history. Try again.") }
    finally { setLoading(false) }
  }
  return <div className="space-y-3">
    <Button size="sm" variant="outline" onClick={() => versions ? setVersions(null) : void load()} disabled={loading}>
      {loading ? "Loading history…" : versions ? "Close history" : "Version history"}
    </Button>
    {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
    {versions ? <div className="space-y-3 rounded-lg border p-3">
      <p className="text-muted-foreground text-sm">Preview a saved version before restoring it. Restoring creates a new version.</p>
      {!versions.length ? <p className="text-sm">History starts with the first edit after version recovery is enabled.</p> : null}
      <div className="flex max-h-40 flex-col gap-1 overflow-auto">
        {versions.map(version => <Button key={version.id} variant={selected?.id === version.id ? "secondary" : "ghost"}
          className="justify-start" onClick={() => setSelected(version)} disabled={!version.content}>
          {new Date(version.created_at).toLocaleString()} · {version.actor_name ?? (version.actor_id ? "Team member" : "Original")}{!version.content ? " · Deleted" : ""}
        </Button>)}
      </div>
      {selected?.content ? <>
        <RichTextEditor value={String(selected.content.content ?? "")} onChange={() => {}} readOnly preserveImages minHeight={120} />
        {Array.isArray(selected.content.budgetRows) ? <RoadmapBudgetTableEditor rows={normalizeRoadmapBudgetRows(selected.content.budgetRows)} canEdit={false} isDirty={false} isSaving={false} onRowsChange={() => {}} onSave={() => {}} /> : null}
        <Button disabled={disabled} onClick={() => {
          if (window.confirm("Restore this version? Your current saved content will remain in history.")) {
            restore(selected); setVersions(null); setSelected(null)
          }
        }}>Restore this version</Button>
      </> : null}
    </div> : null}
  </div>
}
