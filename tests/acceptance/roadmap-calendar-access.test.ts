import { beforeEach, describe, expect, it, vi } from "vitest"

const { resolveActiveOrganizationMock } = vi.hoisted(() => ({
  resolveActiveOrganizationMock: vi.fn(),
}))

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: resolveActiveOrganizationMock,
}))

import { resolveCalendarAccess } from "@/actions/roadmap-calendar-helpers"

type QueryResult = {
  data: unknown
  error: null
}

function createCalendarAccessSupabaseStub({
  profileRole,
  staffCanManageCalendar = false,
}: {
  profileRole: string | null
  staffCanManageCalendar?: boolean
}) {
  const profileMaybeSingle = vi
    .fn<() => Promise<QueryResult>>()
    .mockResolvedValue({
      data: { role: profileRole },
      error: null,
    })
  const settingsMaybeSingle = vi
    .fn<() => Promise<QueryResult>>()
    .mockResolvedValue({
      data: { staff_can_manage_calendar: staffCanManageCalendar },
      error: null,
    })

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: profileMaybeSingle,
          }),
        }),
      }
    }

    if (table === "organization_access_settings") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: settingsMaybeSingle,
          }),
        }),
      }
    }

    throw new Error(`Unexpected table access: ${table}`)
  })

  return { supabase: { from }, settingsMaybeSingle }
}

describe("roadmap calendar access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lets platform admins manage the active organization calendar even without an org admin role", async () => {
    resolveActiveOrganizationMock.mockResolvedValue({
      orgId: "org-1",
      role: "member",
    })
    const { supabase, settingsMaybeSingle } = createCalendarAccessSupabaseStub({
      profileRole: "admin",
      staffCanManageCalendar: false,
    })

    await expect(
      resolveCalendarAccess(supabase as never, "platform-admin-1")
    ).resolves.toEqual({
      orgId: "org-1",
      role: "member",
      canManageCalendar: true,
    })
    expect(settingsMaybeSingle).not.toHaveBeenCalled()
  })

  it("keeps staff calendar management behind the organization setting for non-platform admins", async () => {
    resolveActiveOrganizationMock.mockResolvedValue({
      orgId: "org-1",
      role: "staff",
    })
    const { supabase, settingsMaybeSingle } = createCalendarAccessSupabaseStub({
      profileRole: null,
      staffCanManageCalendar: false,
    })

    await expect(
      resolveCalendarAccess(supabase as never, "staff-1")
    ).resolves.toEqual({
      orgId: "org-1",
      role: "staff",
      canManageCalendar: false,
    })
    expect(settingsMaybeSingle).toHaveBeenCalledTimes(1)
  })
})
