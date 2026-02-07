import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "@/app/api/meetings/schedule/route"

const {
  createSupabaseServerClientMock,
  resolveActiveOrganizationMock,
  canEditOrganizationMock,
  createNotificationMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  resolveActiveOrganizationMock: vi.fn(),
  canEditOrganizationMock: vi.fn(),
  createNotificationMock: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}))

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: resolveActiveOrganizationMock,
  canEditOrganization: canEditOrganizationMock,
}))

vi.mock("@/lib/notifications", () => ({
  createNotification: createNotificationMock,
}))

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_MEETING_FREE_URL: undefined,
    NEXT_PUBLIC_MEETING_DISCOUNTED_URL: "https://discounted.example/booking",
    NEXT_PUBLIC_MEETING_FULL_URL: "https://full.example/booking",
  },
}))

const DEFAULT_PRO_INCLUDED_MEETING_URL = "https://calendar.app.google/EKs5A4iaXFAbFSp57"

type ScheduleStubOptions = {
  meetingRequests?: number
  coachingIncludedPurchases?: Array<{ id: string; coaching_included: boolean | null }>
}

function createScheduleSupabaseStub({
  meetingRequests = 0,
  coachingIncludedPurchases = [{ id: "purchase-1", coaching_included: true }],
}: ScheduleStubOptions = {}) {
  const organizationsMaybeSingle = vi.fn().mockResolvedValue({
    data: { profile: { meeting_requests: meetingRequests } },
    error: null,
  })
  const organizationsUpsert = vi.fn().mockResolvedValue({ error: null })

  const organizationsTable = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: organizationsMaybeSingle,
      }),
    }),
    upsert: organizationsUpsert,
  }

  const purchasesReturns = vi.fn().mockResolvedValue({
    data: coachingIncludedPurchases,
    error: null,
  })
  const acceleratorPurchasesTable = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          returns: purchasesReturns,
        }),
      }),
    }),
  }

  const subscriptionsReturns = vi.fn().mockResolvedValue({
    data: [],
    error: null,
  })
  const subscriptionsTable = {
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          returns: subscriptionsReturns,
        }),
      }),
    }),
  }

  const from = vi.fn((table: string) => {
    if (table === "organizations") return organizationsTable
    if (table === "accelerator_purchases") return acceleratorPurchasesTable
    if (table === "subscriptions") return subscriptionsTable
    throw new Error(`Unexpected table access: ${table}`)
  })

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from,
  }

  return {
    supabase,
    organizationsUpsert,
    organizationsMaybeSingle,
  }
}

describe("coaching schedule route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    canEditOrganizationMock.mockReturnValue(true)
    resolveActiveOrganizationMock.mockResolvedValue({ orgId: "org-1", role: "owner" })
    createNotificationMock.mockResolvedValue({ id: "notif-1" })
  })

  it("uses the Pro included default URL for free tier and increments usage", async () => {
    const { supabase, organizationsUpsert } = createScheduleSupabaseStub({
      meetingRequests: 0,
      coachingIncludedPurchases: [{ id: "purchase-1", coaching_included: true }],
    })
    createSupabaseServerClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request("http://localhost/api/meetings/schedule"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      tier: "free",
      url: DEFAULT_PRO_INCLUDED_MEETING_URL,
      remaining: 3,
    })
    expect(organizationsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "org-1",
        profile: expect.objectContaining({
          meeting_requests: 1,
        }),
      }),
    )
    expect(createNotificationMock).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        metadata: { tier: "free" },
      }),
    )
  })

  it("routes to discounted tier after included sessions are exhausted", async () => {
    const { supabase, organizationsUpsert } = createScheduleSupabaseStub({
      meetingRequests: 4,
      coachingIncludedPurchases: [{ id: "purchase-1", coaching_included: true }],
    })
    createSupabaseServerClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request("http://localhost/api/meetings/schedule"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      tier: "discounted",
      url: "https://discounted.example/booking",
      remaining: 0,
    })
    expect(organizationsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "org-1",
        profile: expect.objectContaining({
          meeting_requests: 4,
        }),
      }),
    )
  })

  it("routes users without included coaching to the full-rate link", async () => {
    const { supabase } = createScheduleSupabaseStub({
      meetingRequests: 0,
      coachingIncludedPurchases: [],
    })
    createSupabaseServerClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request("http://localhost/api/meetings/schedule"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      tier: "full",
      url: "https://full.example/booking",
      remaining: null,
    })
  })
})
