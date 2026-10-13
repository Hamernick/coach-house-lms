"use client"
import { useEffect, useState } from "react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapBudgetDocumentEditor } from "@/components/roadmap/roadmap-editor/components/roadmap-budget-document-editor"
import { createDraft } from "@/components/roadmap/roadmap-editor/helpers"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { Button } from "@/components/ui/button"

export function DocumentImportFixture() {
  const [content, setContent] = useState("<p>Existing board notes.</p>")
  const [budget, setBudget] = useState(() =>
    createDraft(
      resolveRoadmapSections({}).find((section) => section.id === "budget")!
    )
  )
  const [showBudget, setShowBudget] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem("document-import-visual-content")
    if (saved) setContent(saved)
  }, [])
  return (
    <main className="mx-auto flex h-dvh max-w-4xl flex-col gap-4 p-6">
      <div className="flex gap-2">
        <Button onClick={() => setShowBudget(false)}>Board strategy</Button>
        <Button onClick={() => setShowBudget(true)}>Budget</Button>
      </div>
      {showBudget ? (
        <RoadmapBudgetDocumentEditor
          draft={budget}
          title="Budget"
          canEdit
          isDirty
          isSaving={false}
          onDraftChange={(changes) =>
            setBudget((current) => ({ ...current, ...changes }))
          }
          onImageUpload={async () => ""}
          onSave={() => {}}
        />
      ) : (
        <RichTextEditor
          value={content}
          onChange={(html) => {
            setContent(html)
            localStorage.setItem("document-import-visual-content", html)
          }}
          ariaLabel="Board strategy document"
          documentTitle="Board strategy"
          enableDocumentImport
          preserveImages
        />
      )}
    </main>
  )
}
