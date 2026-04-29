import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/auth/login-panel", () => ({
  LoginPanel: () => createElement("div", null, "Login panel"),
}))

vi.mock("@/components/auth/sign-up-form", () => ({
  SignUpForm: () => createElement("form", null, "Sign up form"),
}))

vi.mock("@/components/public/legacy-home-sections", () => ({
  LegacyHomeAcceleratorOverviewSection: () =>
    createElement("section", null, "Accelerator"),
  LegacyHomeHeroSection: () => createElement("section", null, "Hero"),
  LegacyHomeOfferingsSection: () => createElement("section", null, "Platform"),
  LegacyHomeProcessSection: () => createElement("section", null, "Process"),
  LegacyHomeTeamSection: () => createElement("section", null, "Team"),
}))

import { CanvasAuthPanel } from "@/components/public/home-canvas-preview-panels"

describe("home canvas auth panel", () => {
  it("explains that signup starts free before builder onboarding", () => {
    const markup = renderToStaticMarkup(
      createElement(CanvasAuthPanel, { mode: "signup" }),
    )

    expect(markup).toContain("Create a free Individual account first")
    expect(markup).toContain("choose whether to stay free or upgrade")
    expect(markup).toContain("Sign up form")
  })
})
