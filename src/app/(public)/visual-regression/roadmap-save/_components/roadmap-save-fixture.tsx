"use client"

import { useCallback, useRef, useState } from "react"
import type { saveRoadmapSectionAction } from "@/actions/roadmap"
import type { loadRoadmapSectionForRecovery } from "@/actions/roadmap-recovery"
import { RoadmapSaveFeedback } from "@/components/roadmap/roadmap-editor/components/roadmap-save-feedback"
import { useRoadmapEditorState } from "@/components/roadmap/roadmap-editor/hooks/use-roadmap-editor-state"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { resolveRoadmapSections } from "@/lib/roadmap"

const saveSection: typeof saveRoadmapSectionAction = async (input) => {
  const response = await fetch(
    "/visual-regression/roadmap-save/fixture-action",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )
  return response.json()
}

const loadSection: typeof loadRoadmapSectionForRecovery = async (input) => {
  const response = await fetch(
    "/visual-regression/roadmap-save/fixture-recovery",
    { method: "POST", body: JSON.stringify(input) }
  )
  return response.json()
}

export function RoadmapSaveFixture() {
  const [account, setAccount] = useState("fixture-user")
  const [organization, setOrganization] = useState("fixture-org")
  return (
    <>
      <Button onClick={() => setAccount("another-user")}>Switch account</Button>
      <Button onClick={() => setOrganization("another-org")}>
        Switch organization
      </Button>
      <ScopedSaveFixture
        key={`${account}:${organization}`}
        userId={account}
        organizationId={organization}
      />
    </>
  )
}

function ScopedSaveFixture({
  userId,
  organizationId,
}: {
  userId: string
  organizationId: string
}) {
  const [sections, setSections] = useState(() =>
    resolveRoadmapSections({}).filter(
      (section) =>
        section.id === "origin_story" || section.id === "board_strategy"
    )
  )
  const discardRef = useRef<(() => void) | null>(null)
  const registerDiscard = useCallback((handler: (() => void) | null) => {
    discardRef.current = handler
  }, [])
  const editor = useRoadmapEditorState({
    onRegisterDiscard: registerDiscard,
    sections,
    publicSlug: null,
    draftScope: { userId, organizationId },
    navigationMode: "embedded",
    saveSection,
  })
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1>Roadmap save fixture</h1>
      <Button
        onClick={() => {
          discardRef.current?.()
          editor.handleSectionSelect({
            id: "board_strategy",
            slug: "board-strategy",
          })
        }}
      >
        Discard and switch
      </Button>
      {sections.map((section) => (
        <Button
          key={section.id}
          onClick={() => editor.handleSectionSelect(section)}
        >
          Open {section.id}
        </Button>
      ))}
      {editor.activeDraft ? (
        <RoadmapSaveFeedback
          key={editor.activeDraft.id}
          issue={editor.saveIssue}
          offline={editor.offline}
          storageFailed={editor.storageFailed}
          draft={editor.activeDraft}
          draftScope={{ userId, organizationId }}
          onRetry={editor.handleSave}
          onResolve={editor.resolveConflict}
          loadSection={loadSection}
        />
      ) : null}
      <Textarea
        aria-label="Document text"
        value={editor.activeDraft?.content ?? ""}
        onChange={(event) =>
          editor.handleDraftChange({ content: event.target.value })
        }
      />
      <Button onClick={editor.handleSave}>Save document</Button>
      <Button onClick={() => editor.handleStatusChange("complete")}>
        Publish document
      </Button>
      <Button
        onClick={() =>
          setSections((current) => current.map((section) => ({ ...section })))
        }
      >
        Refresh original props
      </Button>
      <output aria-label="Save state">
        {editor.savingId ? "Saving" : editor.isDirty ? "Unsaved" : "Saved"}
      </output>
      <output aria-label="Saved revision">
        {editor.activeSection?.lastUpdated ?? "none"}
      </output>
    </main>
  )
}
