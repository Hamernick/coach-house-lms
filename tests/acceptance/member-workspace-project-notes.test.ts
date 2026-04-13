import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RenderedNoteContent } from "@/features/platform-admin-dashboard/upstream/components/projects/NotePreviewModal"
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
