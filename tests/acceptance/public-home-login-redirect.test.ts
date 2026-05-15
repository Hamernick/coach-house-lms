import { createElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientServerMock,
  resetTestMocks,
} from "./test-utils"

vi.mock("@/components/public/home-canvas-preview", () => ({
  HomeCanvasPreview: (props: { initialSection?: string }) =>
    createElement("div", { "data-initial-section": props.initialSection }, "Home"),
}))

vi.mock("@/components/public/pricing-surface", () => ({
  PricingSurface: () => createElement("div", null, "Pricing"),
}))

describe("public home login section", () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it("redirects authenticated visitors from the home login section to workspace", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    })

    const { default: LandingPage } = await import("@/app/(public)/page")
    const destination = await captureRedirect(() =>
      LandingPage({
        searchParams: Promise.resolve({ section: "login" }),
      }),
    )

    expect(destination).toBe("/workspace")
  })

  it("still renders the home login section for signed-out visitors", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })

    const { default: LandingPage } = await import("@/app/(public)/page")
    const result = await LandingPage({
      searchParams: Promise.resolve({ section: "login" }),
    })

    expect(result.props.initialSection).toBe("login")
  })
})
