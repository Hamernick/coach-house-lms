import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientServerMock,
  resetTestMocks,
} from "./test-utils"

describe("login page", () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it("redirects authenticated visitors to the workspace instead of showing login", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    })

    const { default: LoginPage } = await import("@/app/(auth)/login/page")
    const destination = await captureRedirect(() => LoginPage({}))

    expect(destination).toBe("/workspace")
  })

  it("preserves the home login panel redirect for signed-out visitors", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })

    const { default: LoginPage } = await import("@/app/(auth)/login/page")
    const destination = await captureRedirect(() => LoginPage({}))

    expect(destination).toBe("/?section=login")
  })
})
