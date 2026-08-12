import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { LegacyHomeHeroSection } from "@/components/public/legacy-home-sections/legacy-home-hero-section"

describe("legacy home hero section", () => {
  it("orders the platform verbs as Build, Find, and Fund", () => {
    const markup = renderToStaticMarkup(createElement(LegacyHomeHeroSection))

    expect(markup).toContain("Build, Find, &amp; Fund")
    expect(markup).not.toContain("Find, Build, &amp; Fund")
  })
})
