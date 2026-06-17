import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/public/legacy-home-sections", () => ({
  LEGACY_HOME_SECTION_NAV: [
    { id: "hero", label: "Hero", icon: () => null },
    { id: "platform", label: "Platform", icon: () => null },
    { id: "accelerator", label: "Accelerator", icon: () => null },
    { id: "process", label: "Process", icon: () => null },
    { id: "team", label: "Team", icon: () => null },
  ],
}))

import { isPrimaryPlainNavigationIntent } from "@/components/public/home-canvas-route-link-helpers"
import {
  resolveHomeCanvasSectionLinkTarget,
} from "@/components/public/home-canvas-section-link"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("home canvas route link helpers", () => {
  it("marks plain same-tab clicks as pending-route intents", () => {
    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_self",
      }),
    ).toBe(true)
  })

  it("ignores modified or alternate-tab clicks", () => {
    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 1,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_self",
      }),
    ).toBe(false)

    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 0,
        metaKey: true,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_self",
      }),
    ).toBe(false)

    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_blank",
      }),
    ).toBe(false)
  })

  it("resolves same-page canvas section links without requiring app router navigation", () => {
    expect(
      resolveHomeCanvasSectionLinkTarget({
        currentHref: "https://coachhouse.app/?section=pricing",
        href: "/?section=signup&intent=build&plan=operations_support",
      }),
    ).toEqual({
      href: "/?section=signup&intent=build&plan=operations_support",
      loginRedirectTo: undefined,
      section: "signup",
      signupIntentFocus: "build",
      signupPlanTier: "operations_support",
    })

    expect(
      resolveHomeCanvasSectionLinkTarget({
        currentHref: "https://coachhouse.app/?section=platform",
        href: "https://coachhouse.app/?section=pricing",
      })?.section,
    ).toBe("pricing")
  })

  it("does not intercept non-canvas or external links", () => {
    expect(
      resolveHomeCanvasSectionLinkTarget({
        currentHref: "https://coachhouse.app/?section=pricing",
        href: "https://example.com/?section=signup",
      }),
    ).toBeNull()
    expect(
      resolveHomeCanvasSectionLinkTarget({
        currentHref: "https://coachhouse.app/find",
        href: "/?section=signup&plan=organization",
      }),
    ).toBeNull()
  })

  it("keeps logged-in home login clicks on the button while resolving the destination", () => {
    const source = readSource("src/components/public/home-canvas-login-button.tsx")
    const canvasSource = readSource("src/components/public/home-canvas-preview.tsx")
    const shellSource = readSource(
      "src/components/public/home-canvas-preview-shell.tsx",
    )

    expect(source).toContain("isLoginRoutePending")
    expect(source).toContain("handleLoginClick")
    expect(source).toContain("supabase.auth.getSession()")
    expect(source).toContain("router.replace(DEFAULT_POST_AUTH_REDIRECT)")
    expect(source).toContain('aria-busy={isLoginRoutePending || undefined}')
    expect(source).toContain("Opening…")
    expect(source).toContain('onClick={handleLoginClick}')
    expect(shellSource).toContain("HomeCanvasLoginButton")
    expect(canvasSource).toContain("HomeCanvasPreviewHeader")
    expect(canvasSource).not.toContain('onClick={() => changeSection("login")}')
  })

  it("intercepts home canvas section links so pricing CTAs switch panels immediately", () => {
    const canvasSource = readSource("src/components/public/home-canvas-preview.tsx")
    const controllerSource = readSource(
      "src/components/public/home-canvas-section-link-controller.ts",
    )

    expect(canvasSource).toContain("useHomeCanvasSectionLinkController")
    expect(canvasSource).toContain("onClickCapture={handleCanvasPanelClick}")
    expect(controllerSource).toContain("handleCanvasPanelClick")
    expect(controllerSource).toContain("resolveHomeCanvasSectionLinkTarget")
    expect(controllerSource).toContain("window.history.replaceState")
    expect(controllerSource).toContain("setCanvasSignupPlanTier")
  })

  it("keeps home canvas section motion on CSS instead of loading a JS animation runtime", () => {
    const canvasSource = readSource("src/components/public/home-canvas-preview.tsx")
    const flipWordsSource = readSource("src/components/ui/flip-words.tsx")
    const globalsSource = readSource("src/app/globals.css")

    expect(canvasSource).not.toContain("framer-motion")
    expect(canvasSource).toContain("home-canvas-panel-in")
    expect(canvasSource).toContain("--home-canvas-panel-y")
    expect(flipWordsSource).not.toContain("framer-motion")
    expect(flipWordsSource).toContain("flip-word-in")
    expect(globalsSource).toContain("@keyframes home-canvas-panel-in")
    expect(globalsSource).toContain("@keyframes flip-word-in")
  })
})
