import { describe, expect, it } from "vitest"

import { canLoadRemotePublicMapPreferences } from "@/components/public/public-map-index/use-public-map-preferences"

describe("public map preferences", () => {
  it("skips remote preference loading for signed-out visitors", () => {
    expect(canLoadRemotePublicMapPreferences(null)).toBe(false)
    expect(
      canLoadRemotePublicMapPreferences({ id: "", email: null }),
    ).toBe(false)
  })

  it("allows remote preference loading for authenticated viewers", () => {
    expect(
      canLoadRemotePublicMapPreferences({
        id: "viewer_123",
        email: "member@example.com",
      }),
    ).toBe(true)
  })
})
