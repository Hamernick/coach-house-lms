import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientMock,
  resetTestMocks,
} from "./test-utils"

const acceptOrganizationInviteActionMock = vi.hoisted(() => vi.fn())
const writeActiveOrganizationCookieMock = vi.hoisted(() => vi.fn())

vi.mock("@/app/actions/organization-access", () => ({
  acceptOrganizationInviteAction: acceptOrganizationInviteActionMock,
}))

vi.mock("@/lib/organization/active-org-cookie", () => ({
  writeActiveOrganizationCookie: writeActiveOrganizationCookieMock,
}))

describe("join organization page", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
    vi.clearAllMocks()
    writeActiveOrganizationCookieMock.mockResolvedValue(undefined)
  })

  it("redirects signed-out invitees to login and preserves the invite token", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    })

    const { default: Page } = await import("@/app/(auth)/join-organization/page")
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({ token: "invite_123" }),
      }),
    )

    expect(destination).toBe(
      "/login?redirect=%2Fjoin-organization%3Ftoken%3Dinvite_123",
    )
  })

  it("sends accepted standard invites to workspace", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_123" } },
          error: null,
        }),
      },
    })
    acceptOrganizationInviteActionMock.mockResolvedValue({
      ok: true,
      orgId: "org_123",
      role: "member",
      inviteKind: "standard",
    })

    const { default: Page } = await import("@/app/(auth)/join-organization/page")
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({ token: "invite_123" }),
      }),
    )

    expect(destination).toBe("/workspace?joined=1&role=member")
    expect(writeActiveOrganizationCookieMock).toHaveBeenCalledWith("org_123")
  })

  it("sends accepted funder invites to workspace with funder context", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user_123" } },
          error: null,
        }),
      },
    })
    acceptOrganizationInviteActionMock.mockResolvedValue({
      ok: true,
      orgId: "org_123",
      role: "member",
      inviteKind: "funder",
    })

    const { default: Page } = await import("@/app/(auth)/join-organization/page")
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({ token: "invite_123" }),
      }),
    )

    expect(destination).toBe("/workspace?joined=1&role=funder")
    expect(writeActiveOrganizationCookieMock).toHaveBeenCalledWith("org_123")
  })
})
