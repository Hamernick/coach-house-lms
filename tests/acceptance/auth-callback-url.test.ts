import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("resolveAuthCallbackUrl", () => {
  it("prefers the current browser origin over a stale configured site URL", async () => {
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:3000",
      },
    })

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://coachhouse.vercel.app")

    const { resolveAuthCallbackUrl } = await import("@/components/auth/auth-callback-url")
    expect(resolveAuthCallbackUrl("/update-password")).toBe(
      "http://localhost:3000/auth/callback?redirect=%2Fupdate-password",
    )
  })

  it("falls back to the configured site URL when no browser origin exists", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://coachhouse.vercel.app")

    const { resolveAuthCallbackUrl } = await import("@/components/auth/auth-callback-url")
    expect(resolveAuthCallbackUrl("/update-password")).toBe(
      "https://coachhouse.vercel.app/auth/callback?redirect=%2Fupdate-password",
    )
  })
})
