import { describe, expect, it } from "vitest"

import { resolvePublicAuthCallbackHref } from "@/components/public/public-auth-callback"

describe("public auth callback redirect", () => {
  it("rewrites root auth callback query params to the dedicated callback route", () => {
    expect(
      resolvePublicAuthCallbackHref({
        pathname: "/",
        searchParams: new URLSearchParams("code=test-code"),
      }),
    ).toBe("/auth/callback?code=test-code")
  })

  it("preserves redirect and section params when rewriting callback links", () => {
    expect(
      resolvePublicAuthCallbackHref({
        pathname: "/",
        searchParams: new URLSearchParams(
          "code=test-code&redirect=%2Fonboarding%3Fsource%3Dhome_signup&section=login",
        ),
      }),
    ).toBe(
      "/auth/callback?code=test-code&redirect=%2Fonboarding%3Fsource%3Dhome_signup&section=login",
    )
  })

  it("ignores normal landing-page search params", () => {
    expect(
      resolvePublicAuthCallbackHref({
        pathname: "/",
        searchParams: new URLSearchParams("section=login&redirect=%2Fonboarding%3Fsource%3Dhome_signup"),
      }),
    ).toBeNull()
  })
})
