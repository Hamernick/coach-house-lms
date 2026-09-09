import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  organization: vi.fn(),
  from: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.client,
}))
vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: mocks.organization,
  canEditOrganization: (role: string) => role === "owner",
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
import { saveRoadmapSectionAction } from "@/actions/roadmap"
import { loadRoadmapSectionForRecovery } from "@/actions/roadmap-recovery"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.client.mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-a" } }, error: null }),
    },
    from: mocks.from,
  })
  mocks.organization.mockResolvedValue({ orgId: "org-a", role: "owner" })
})

describe("roadmap editor scope guards", () => {
  it.each([
    { expectedUserId: "user-b", expectedOrganizationId: "org-a" },
    { expectedUserId: "user-a", expectedOrganizationId: "org-b" },
  ])(
    "rejects stale editor identity before reading or writing organization data: %j",
    async (scope) => {
      const result = await saveRoadmapSectionAction({
        ...scope,
        sectionId: "origin_story",
        expectedLastUpdated: null,
        content: "Private text",
      })
      expect(result).toMatchObject({ code: "scope_changed" })
      expect(mocks.from).not.toHaveBeenCalled()
    }
  )

  it("rejects writes after editing permission is removed", async () => {
    mocks.organization.mockResolvedValue({ orgId: "org-a", role: "board" })
    expect(
      await saveRoadmapSectionAction({
        expectedUserId: "user-a",
        expectedOrganizationId: "org-a",
        sectionId: "origin_story",
        content: "Private text",
      })
    ).toEqual({ error: "Forbidden" })
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it.each([
    { userId: "user-b", organizationId: "org-a" },
    { userId: "user-a", organizationId: "org-b" },
  ])(
    "does not expose another scope's document during recovery: %j",
    async (scope) => {
      expect(
        await loadRoadmapSectionForRecovery({
          ...scope,
          sectionId: "origin_story",
        })
      ).toHaveProperty("error")
      expect(mocks.from).not.toHaveBeenCalled()
    }
  )
})
