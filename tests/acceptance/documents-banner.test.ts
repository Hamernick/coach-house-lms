import React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DocumentsBanner } from "@/components/organization/org-profile-card/tabs/documents-tab/components"

describe("documents banner", () => {
  it("owns the persistent documents library surface", () => {
    const props: React.ComponentProps<typeof DocumentsBanner> = {
      canEdit: true,
      children: React.createElement(
        "h1",
        { id: "documents-title" },
        "Documents"
      ),
    }
    const markup = renderToStaticMarkup(
      React.createElement(DocumentsBanner, props)
    )

    expect(markup).toContain("Documents")
    expect(markup).toContain("rounded-2xl")
    expect(markup).toContain("max-w-xl")
    expect(markup).toContain(
      'data-react-grab-owner-id="organization-documents:banner"'
    )
    expect(markup).not.toContain("Library")
    expect(markup).not.toContain("Start chat")
  })

  it("keeps Notes inside the organization Documents surface", () => {
    const root = process.cwd()
    const pageSource = readFileSync(
      join(
        root,
        "src/app/(dashboard)/organization/documents/organization-documents-page-content.tsx"
      ),
      "utf8"
    )
    const tabSource = readFileSync(
      join(
        root,
        "src/components/organization/org-profile-card/tabs/documents-tab.tsx"
      ),
      "utf8"
    )
    const notesSource = readFileSync(
      join(root, "src/components/organization/documents-notes-right-rail.tsx"),
      "utf8"
    )

    expect(pageSource).toContain("notes={moduleNotes}")
    expect(pageSource).not.toContain("DocumentsNotesRightRail")
    expect(tabSource).toContain("<DocumentsNotesPanel notes={notes} />")
    expect(notesSource).not.toContain("RightRailSlot")
    expect(notesSource).toContain("rounded-[2rem]")
  })

  it("switches cards into multi-selection mode with batch actions", () => {
    const root = process.cwd()
    const gridSource = readFileSync(
      join(
        root,
        "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-library-grid.tsx"
      ),
      "utf8"
    )
    const toolbarSource = readFileSync(
      join(
        root,
        "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-selection-toolbar.tsx"
      ),
      "utf8"
    )

    expect(gridSource).toContain("selection.selectedIds.length > 0")
    expect(gridSource).toContain("selection.toggle(item.id)")
    expect(gridSource).toContain("<DocumentsLibraryCard")
    expect(toolbarSource).toContain("Download")
    expect(toolbarSource).toContain("Delete")
    expect(toolbarSource).toContain("{count} selected")
    expect(toolbarSource).toContain('aria-live="polite"')
  })
})
