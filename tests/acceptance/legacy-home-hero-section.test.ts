import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "font-inter", variable: "--font-inter" }),
  Sora: () => ({ className: "font-sora", variable: "--font-sora" }),
  Space_Grotesk: () => ({ className: "font-space-grotesk", variable: "--font-space-grotesk" }),
}))

import { LegacyHomeHeroSection } from "@/components/public/legacy-home-sections/legacy-home-hero-section"

describe("legacy home hero section", () => {
  it("orders the platform verbs as Build, Find, and Fund", () => {
    const markup = renderToStaticMarkup(createElement(LegacyHomeHeroSection))

    expect(markup).toContain("Build, Find, &amp; Fund")
    expect(markup).not.toContain("Find, Build, &amp; Fund")
  })
})
