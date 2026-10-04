import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RenderedNoteContent } from "@/features/platform-admin-dashboard/upstream/components/projects/NotePreviewModal"
import { NotesCollection } from "@/features/platform-admin-dashboard/upstream/components/projects/notes-collection"
import { NotesTable } from "@/features/platform-admin-dashboard/upstream/components/projects/NotesTable"
import { projectNoteReducer, type ProjectNoteState } from "@/features/platform-admin-dashboard/upstream/lib/project-note-state"
import type { ProjectNote } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { buildNotePayloadForUploadedAssets } from "@/features/platform-admin-dashboard/upstream/components/projects/note-upload"

describe("member workspace project notes", () => {
  it("builds an audio note payload that preserves rich text and adds uploaded asset links", () => {
    const payload = buildNotePayloadForUploadedAssets({
      assets: [
        {
          id: "asset-1",
          name: "board-call.m4a",
          url: "https://example.com/board-call.m4a",
        },
      ],
      draftContent: "<p>Meeting recap</p>",
      draftTitle: "Board sync",
      kind: "audio",
      previousNoteType: "general",
    })

    expect(payload.title).toBe("Board sync")
    expect(payload.noteType).toBe("audio")
    expect(payload.content).toContain("<p>Meeting recap</p>")
    expect(payload.content).toContain("Uploaded audio file")
    expect(payload.content).toContain('href="https://example.com/board-call.m4a"')
  })

  it("renders rich note content safely in the preview modal", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RenderedNoteContent, {
        content:
          '<p>Ready for review.</p><ul><li><a href="https://example.com/spec.pdf">Spec</a></li></ul><script>alert(1)</script>',
      }),
    )

    expect(markup).toContain("Ready for review.")
    expect(markup).toContain('href="https://example.com/spec.pdf"')
    expect(markup).not.toContain("<script>")
    expect(markup).not.toContain("alert(1)")
  })
})

const note: ProjectNote = {
  id: "pending-note",
  title: "Board recap",
  content: "<p>Keep this draft</p>",
  noteType: "general",
  status: "completed",
  addedDate: new Date("2026-10-03T12:00:00Z"),
  addedBy: { id: "user-1", name: "Coach" },
}
const emptyState: ProjectNoteState = { items: [], localNotes: [] }

describe("notes layout and saving feedback", () => {
  it("shows one add action, shared search and view controls without duplicate note sections", () => {
    const notes = Array.from({ length: 10 }, (_, i) => ({ ...note, id: `note-${i}`, title: `Note ${i}` }))
    const markup = renderToStaticMarkup(React.createElement(NotesCollection, {
      notes, onAddNote: () => {}, onNoteClick: () => {},
    }))
    expect(markup.match(/>Add note</g)).toHaveLength(1)
    expect(markup).toContain('aria-label="Search notes"')
    expect(markup).toContain('aria-label="Individual notes view"')
    expect(markup).toContain('aria-label="Table notes view"')
    expect(markup).toContain("Note 9")
    expect(markup).not.toContain("All notes")
    expect(markup).not.toContain("Recent notes")
    expect(markup).not.toContain("<table")
  })

  it("shows saving feedback in both views", () => {
    const cards = renderToStaticMarkup(React.createElement(NotesCollection, {
      notes: [note], savingNoteId: note.id, onNoteClick: () => {},
    }))
    const table = renderToStaticMarkup(React.createElement(NotesTable, {
      notes: [note], savingNoteId: note.id,
    }))
    for (const markup of [cards, table]) {
      expect(markup).toContain('aria-busy="true"')
      expect(markup).toContain("Saving")
    }
    expect(table).not.toContain("Add note")
    expect(table).not.toContain('type="search"')
  })

  it("shows a new note immediately and retains it across stale server refreshes", () => {
    const pending = projectNoteReducer(emptyState, { type: "start", note })
    expect(pending.items).toEqual([note])
    expect(pending.savingNoteId).toBe(note.id)
    expect(projectNoteReducer(pending, { type: "sync", notes: [] }).items).toEqual([note])
    const saved = projectNoteReducer(pending, { type: "saved", temporaryId: note.id, noteId: "db-note" })
    expect(saved.savingNoteId).toBeUndefined()
    expect(projectNoteReducer(saved, { type: "sync", notes: [] }).items[0].id).toBe("db-note")
    const reconciled = projectNoteReducer(saved, { type: "sync", notes: [{ ...note, id: "db-note" }] })
    expect(reconciled.items).toHaveLength(1)
    expect(reconciled.localNotes).toEqual([])
  })

  it("does not duplicate a new note if the refreshed server record arrives before the action resolves", () => {
    const pending = projectNoteReducer(emptyState, { type: "start", note })
    const refreshed = projectNoteReducer(pending, { type: "sync", notes: [{ ...note, id: "db-note" }] })
    expect(refreshed.items).toEqual([note])
    const saved = projectNoteReducer(refreshed, { type: "saved", temporaryId: note.id, noteId: "db-note" })
    expect(saved.items).toEqual([{ ...note, id: "db-note" }])
  })

  it("keeps an edited note visible while the server still has its old content", () => {
    const edited = { ...note, title: "Updated recap" }
    const pending = projectNoteReducer({ items: [note], localNotes: [] }, { type: "start", note: edited })
    const refreshed = projectNoteReducer(pending, { type: "sync", notes: [note] })
    expect(refreshed.items).toEqual([edited])
    expect(refreshed.savingNoteId).toBe(note.id)
  })

  it("removes an unsuccessful optimistic create and restores an unsuccessful edit", () => {
    const pending = projectNoteReducer(emptyState, { type: "start", note })
    expect(projectNoteReducer(pending, { type: "failed", temporaryId: note.id })).toEqual(emptyState)
    const original = { ...note, title: "Original title" }
    const failed = projectNoteReducer(pending, { type: "failed", temporaryId: note.id, original })
    expect(failed.items).toEqual([original])
    expect(failed.savingNoteId).toBeUndefined()
  })
})
