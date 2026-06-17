import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DocumentsBanner } from "@/components/organization/org-profile-card/tabs/documents-tab/components"

describe("documents banner", () => {
  it("does not render the old dismiss button", () => {
    const markup = renderToStaticMarkup(
      React.createElement(DocumentsBanner, {
        hasRoadmapDocuments: true,
        canEdit: true,
      }),
    )

    expect(markup).toContain("Store, track, and act on every key document")
    expect(markup).not.toContain("<button")
    expect(markup).not.toContain("Dismiss documents banner")
    expect(markup).not.toContain("h-8 w-8 shrink-0 rounded-lg")
  })
})
