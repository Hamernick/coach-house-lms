import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createSupabaseServerClientServerMock,
  resetTestMocks,
} from "./test-utils"

const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn())
const writeActiveOrganizationCookieMock = vi.hoisted(() => vi.fn())
const ensureInvitedMemberInOrgDirectoryMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/admin", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/supabase/admin")>(
      "@/lib/supabase/admin",
    )

  return {
    ...actual,
    createSupabaseAdminClient: createSupabaseAdminClientMock,
  }
})

vi.mock("@/lib/organization/active-org-cookie", () => ({
  writeActiveOrganizationCookie: writeActiveOrganizationCookieMock,
}))

vi.mock("@/app/actions/organization-access/invites-helpers", async () => {
  const actual =
    await vi.importActual<
      typeof import("@/app/actions/organization-access/invites-helpers")
    >("@/app/actions/organization-access/invites-helpers")

  return {
    ...actual,
    ensureInvitedMemberInOrgDirectory:
      ensureInvitedMemberInOrgDirectoryMock,
  }
})

function createAdminClientStub() {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: "request-123",
      org_id: "org-123",
      invitee_user_id: "user-1",
      invitee_email: "user@example.com",
      role: "staff",
      status: "pending",
      invited_by_user_id: "user-2",
      organization_invite_id: null,
      message: null,
      responded_at: null,
      expires_at: "2099-01-01T00:00:00.000Z",
      created_at: "2026-04-16T15:00:00.000Z",
    },
    error: null,
  })
  const requestSelectEq = vi.fn().mockReturnValue({
    maybeSingle,
  })
  const requestUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const requestUpdate = vi.fn().mockReturnValue({
    eq: requestUpdateEq,
  })
  const membershipUpsert = vi.fn().mockResolvedValue({ error: null })
  const notificationContains = vi.fn().mockResolvedValue({ error: null })
  const notificationEqType = vi.fn().mockReturnValue({
    contains: notificationContains,
  })
  const notificationEqUser = vi.fn().mockReturnValue({
    eq: notificationEqType,
  })
  const notificationUpdate = vi.fn().mockReturnValue({
    eq: notificationEqUser,
  })

  return {
    adminClient: {
      from: vi.fn((table: string) => {
        if (table === "organization_access_requests") {
          return {
            select: vi.fn().mockReturnValue({
              eq: requestSelectEq,
            }),
            update: requestUpdate,
          }
        }

        if (table === "organization_memberships") {
          return {
            upsert: membershipUpsert,
          }
        }

        if (table === "notifications") {
          return {
            update: notificationUpdate,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    },
    membershipUpsert,
    requestUpdate,
    notificationUpdate,
  }
}

describe("organization access request actions", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
    vi.clearAllMocks()
    writeActiveOrganizationCookieMock.mockResolvedValue(undefined)
    ensureInvitedMemberInOrgDirectoryMock.mockResolvedValue(undefined)
  })

  it("writes the active organization cookie after accepting a request", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "user@example.com",
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    })

    const adminStub = createAdminClientStub()
    createSupabaseAdminClientMock.mockReturnValue(adminStub.adminClient)

    const { acceptOrganizationAccessRequestActionImpl } = await import(
      "@/app/actions/organization-access/requests"
    )

    await expect(
      acceptOrganizationAccessRequestActionImpl("request-123"),
    ).resolves.toEqual({
      ok: true,
      orgId: "org-123",
      status: "accepted",
    })

    expect(adminStub.membershipUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org-123",
        member_id: "user-1",
        member_email: "user@example.com",
        role: "staff",
      }),
      { onConflict: "org_id,member_id" },
    )
    expect(writeActiveOrganizationCookieMock).toHaveBeenCalledWith("org-123")
  })
})
