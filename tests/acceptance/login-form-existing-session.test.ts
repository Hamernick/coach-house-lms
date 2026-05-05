import { describe, expect, it } from "vitest"

import { resolveExistingAuthSessionRedirect } from "@/components/auth/login-form"

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
})
