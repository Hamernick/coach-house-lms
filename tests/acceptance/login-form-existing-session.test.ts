import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { resolveExistingAuthSessionRedirect } from "@/components/auth/login-form"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("login form existing session redirect", () => {
  it("redirects existing browser sessions to the resolved post-auth path", () => {
    expect(
      resolveExistingAuthSessionRedirect({
        session: { access_token: "token" },
        redirectTo: "/workspace",
      }),
    ).toBe("/workspace")
  })

  it("leaves the sign-in form available when there is no existing session", () => {
    expect(
      resolveExistingAuthSessionRedirect({
        session: null,
        redirectTo: "/workspace",
      }),
    ).toBeNull()
  })

  it("keeps redirect and submit loading feedback on buttons instead of replacing the form", () => {
    const source = readSource("src/components/auth/login-form.tsx")

    expect(source).toContain("isSigningIn")
    expect(source).toContain("LoaderCircleIcon")
    expect(source).toContain("Signing in…")
    expect(source).toContain('aria-busy={isSigningIn || undefined}')
    expect(source).not.toContain("Taking you back to your workspace")
    expect(source).not.toContain("isRedirectingExistingSession")
    expect(source).not.toContain("useTransition")
  })
})
