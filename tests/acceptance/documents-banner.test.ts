import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { DocumentsBanner } from "@/components/organization/org-profile-card/tabs/documents-tab/components"

describe("documents banner", () => {
  it("centers the banner and identifies its owning surface", () => {
    const markup = renderToStaticMarkup(
      React.createElement(DocumentsBanner, {
        hasRoadmapDocuments: true,
        canEdit: true,
      })
    )

    expect(markup).toContain("Store, track, and act on every key document")
    expect(markup).toContain("text-center")
    expect(markup).toContain("flex-col items-center")
    expect(markup).not.toContain("animate-[soft-pop")
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

  it("keeps the rendered visual fixture closed unless explicitly enabled", () => {
    const proxySource = readFileSync(
      join(process.cwd(), "src/proxy.ts"),
      "utf8"
    )
    const fixtureSource = readFileSync(
      join(
        process.cwd(),
        "src/app/(public)/visual-regression/documents-banner/page.tsx"
      ),
      "utf8"
    )

    expect(proxySource).toContain(
      'const VISUAL_REGRESSION_PREFIX = "/visual-regression"'
    )
    expect(proxySource).toContain(
      "!canAccessVisualRegressionRoute(request.headers)"
    )
    expect(proxySource).toContain(
      'new NextResponse("Not Found", { status: 404 })'
    )
    expect(fixtureSource).toContain(
      "!canAccessVisualRegressionRoute(await headers())"
    )
    expect(fixtureSource).toContain("notFound()")
  })
})
