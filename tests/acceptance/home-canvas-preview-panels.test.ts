import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/auth/login-panel", () => ({
  LoginPanel: (props: { redirectTo?: string }) =>
    createElement("div", { "data-redirect-to": props.redirectTo }, "Login panel"),
}))

vi.mock("@/components/auth/sign-up-form", () => ({
  SignUpForm: (props: { memberRedirectTo?: string }) =>
    createElement(
      "form",
      { "data-member-redirect-to": props.memberRedirectTo },
      "Sign up form",
    ),
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
  it("routes returning users from the login panel back into the workspace", () => {
    const markup = renderToStaticMarkup(
      createElement(CanvasAuthPanel, { mode: "login" }),
    )

    expect(markup).toContain('data-redirect-to="/workspace"')
    expect(markup).toContain("Login panel")
  })

  it("explains that signup starts free before builder onboarding", () => {
    const markup = renderToStaticMarkup(
      createElement(CanvasAuthPanel, { mode: "signup" }),
    )

    expect(markup).toContain("Create a free Individual account first")
    expect(markup).toContain("choose whether to stay free or upgrade")
    expect(markup).toContain(
      'data-member-redirect-to="/find?member_onboarding=1&amp;source=home_signup"',
    )
    expect(markup).toContain("Sign up form")
  })
})
