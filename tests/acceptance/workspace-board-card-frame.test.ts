import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceBoardCardFrame } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-card-frame"

describe("workspace board card frame", () => {
  it("uses the accelerator body as the drag handle when title chrome has moved into the body", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        WorkspaceBoardCardFrame,
        {
          cardId: "accelerator",
          title: "Accelerator",
          subtitle: "Class tracks, modules, and resources",
          tone: "accelerator",
          hideTitle: true,
          hideSubtitle: true,
          size: "md",
          presentationMode: false,
          onSizeChange: vi.fn(),
          fullHref: "/workspace/accelerator",
          canEdit: true,
        },
        React.createElement("div", null, "Accelerator body"),
      ),
    )

    expect(markup).toContain('data-workspace-card="accelerator"')
    expect(markup).toContain("Accelerator body")
    expect(markup).not.toContain('data-slot="card-header"')
    expect(markup).toContain("workspace-card-drag-handle")
    expect(markup).toContain("cursor-grab")
  })

  it("keeps the accelerator body non-draggable in presentation mode", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        WorkspaceBoardCardFrame,
        {
          cardId: "accelerator",
          title: "Accelerator",
          subtitle: "Class tracks, lessons, and resources",
          tone: "accelerator",
          hideTitle: true,
          hideSubtitle: true,
          size: "md",
          presentationMode: true,
          onSizeChange: vi.fn(),
          fullHref: "/workspace/accelerator",
          canEdit: true,
        },
        React.createElement("div", null, "Accelerator body"),
      ),
    )

    expect(markup).not.toContain("workspace-card-drag-handle")
    expect(markup).toContain("nodrag")
    expect(markup).toContain("nopan")
  })
})
