import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DocumentsBanner } from "@/components/organization/org-profile-card/tabs/documents-tab/components"

describe("documents banner", () => {
  it("centers the banner and animates its leading graphic once", () => {
    const markup = renderToStaticMarkup(
      React.createElement(DocumentsBanner, {
        hasRoadmapDocuments: true,
        canEdit: true,
      })
    )

    expect(markup).toContain("Store, track, and act on every key document")
    expect(markup).toContain("text-center")
    expect(markup).toContain("flex-col items-center")
    expect(markup).toContain("motion-safe:animate-[soft-pop_600ms")
    expect(markup).toContain("motion-reduce:animate-none")
    expect(markup).toContain(
      'data-react-grab-owner-id="organization-documents:banner"'
    )
    expect(markup.indexOf('aria-hidden="true"')).toBeLessThan(
      markup.indexOf('id="documents-title"')
    )
    expect(markup).not.toContain("<button")
    expect(markup).not.toContain("Dismiss documents banner")
    expect(markup).not.toContain("h-8 w-8 shrink-0 rounded-lg")
  })
})
