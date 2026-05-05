import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { isPrimaryPlainNavigationIntent } from "@/components/public/home-canvas-route-link-helpers"

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

  it("keeps logged-in home login clicks on the button while resolving the destination", () => {
    const source = readSource("src/components/public/home-canvas-login-button.tsx")
    const canvasSource = readSource("src/components/public/home-canvas-preview.tsx")

    expect(source).toContain("isLoginRoutePending")
    expect(source).toContain("handleLoginClick")
    expect(source).toContain("supabase.auth.getSession()")
    expect(source).toContain("router.replace(DEFAULT_POST_AUTH_REDIRECT)")
    expect(source).toContain('aria-busy={isLoginRoutePending || undefined}')
    expect(source).toContain("Opening…")
    expect(source).toContain('onClick={handleLoginClick}')
    expect(canvasSource).toContain("HomeCanvasLoginButton")
    expect(canvasSource).not.toContain('onClick={() => changeSection("login")}')
  })
})
