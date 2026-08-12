import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { LegacyHomeAcceleratorSection } from "@/components/public/legacy-home-sections/legacy-home-accelerator-section"

describe("legacy home accelerator section", () => {
  it("renders the external-facing accelerator pitch and roadmap preview", () => {
    const markup = renderToStaticMarkup(
      createElement(LegacyHomeAcceleratorSection)
    )

    expect(markup).toContain("Build the strategy before you chase the funding")
    expect(markup).toContain("Inside the accelerator")
    expect(markup).toContain("Idea to Impact Path")
    expect(markup).toContain("Short lessons")
    expect(markup).toContain("Strategic roadmap drafts")
    expect(markup).toContain("Origin story")
    expect(markup).toContain("Need statement")
    expect(markup).toContain('href="/sign-up"')
    expect(markup).toContain('href="/?section=pricing"')
  })
})
