import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { captureRedirect, resetTestMocks } from "./test-utils"

const listMyOrganizationAccessRequestsActionMock = vi.hoisted(() => vi.fn())
const acceptOrganizationAccessRequestActionMock = vi.hoisted(() => vi.fn())
const declineOrganizationAccessRequestActionMock = vi.hoisted(() => vi.fn())

vi.mock("@/app/actions/organization-access", () => ({
  listMyOrganizationAccessRequestsAction:
    listMyOrganizationAccessRequestsActionMock,
  acceptOrganizationAccessRequestAction:
    acceptOrganizationAccessRequestActionMock,
  declineOrganizationAccessRequestAction:
    declineOrganizationAccessRequestActionMock,
}))

vi.mock("@/features/organization-access", () => ({
  OrganizationAccessRequestsPanel: (props: unknown) => props,
}))

describe("access requests page", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("renders the review panel with the requested invite highlighted", async () => {
    listMyOrganizationAccessRequestsActionMock.mockResolvedValue({
      ok: true,
      requests: [
        {
          id: "request-123",
          orgId: "org-123",
          organizationName: "South Side Youth Alliance",
          inviteeUserId: "user-1",
          inviteeEmail: "joel@example.com",
          inviteeName: "Joel Hamernick",
          inviterUserId: "user-2",
          inviterName: "Caleb Hamernick",
          role: "staff",
          status: "pending",
          message: null,
          createdAt: "2026-04-16T15:00:00.000Z",
          respondedAt: null,
          expiresAt: "2026-04-23T15:00:00.000Z",
        },
      ],
    })

    const { default: Page } = await import(
      "@/app/(dashboard)/access-requests/page"
    )
    const result = await Page({
      searchParams: Promise.resolve({ request: "request-123" }),
    })

    const props = (result as { props: Record<string, unknown> }).props
    expect(props.initialRequests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "request-123",
          organizationName: "South Side Youth Alliance",
        }),
      ]),
    )
    expect(props.highlightedRequestId).toBe("request-123")
    expect(props.acceptRequestAction).toBe(
      acceptOrganizationAccessRequestActionMock,
    )
    expect(props.declineRequestAction).toBe(
      declineOrganizationAccessRequestActionMock,
    )
  })

  it("falls back to workspace when access requests cannot be loaded", async () => {
    listMyOrganizationAccessRequestsActionMock.mockResolvedValue({
      error: "Not authenticated.",
    })

    const { default: Page } = await import(
      "@/app/(dashboard)/access-requests/page"
    )
    const destination = await captureRedirect(() => Page())

    expect(destination).toBe("/workspace")
  })
})
