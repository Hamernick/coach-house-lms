import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceBoardCardFrame } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-card-frame"

describe("workspace board card frame", () => {
  it("omits the empty accelerator header when title chrome has moved into the body", () => {
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
    expect(markup).not.toContain("workspace-card-drag-handle")
  })
})
