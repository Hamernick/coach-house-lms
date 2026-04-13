import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Database } from "@/lib/supabase"

function createSupabaseStub(options: {
  memberships: Array<{ org_id: string; role: string | null }>
  organizations: Array<{
    user_id: string
    public_slug: string | null
    profile: Record<string, unknown> | null
  }>
}) {
  return {
    from(table: string) {
      if (table === "organization_memberships") {
        return {
          select() {
            return this
          },
          eq() {
            return this
          },
          returns() {
            return Promise.resolve({ data: options.memberships })
          },
        }
      }

      if (table === "organizations") {
        return {
          select() {
            return this
          },
          in() {
            return this
          },
          returns() {
            return Promise.resolve({ data: options.organizations })
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  } as never as import("@supabase/supabase-js").SupabaseClient<Database, "public">
}

describe("loadAccessibleOrganizations", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("returns multiple accessible organizations with image urls for the switcher", async () => {
    const { loadAccessibleOrganizations } = await import(
      "@/features/member-workspace/server/load-accessible-organizations"
    )

    const result = await loadAccessibleOrganizations(
      createSupabaseStub({
        memberships: [
          { org_id: "org_staff", role: "staff" },
          { org_id: "org_board", role: "board" },
        ],
        organizations: [
          {
            user_id: "user_123",
            public_slug: "my-organization",
            profile: { name: "My Organization", logoUrl: "https://img.test/self.png" },
          },
          {
            user_id: "org_staff",
            public_slug: "org-staff",
            profile: { name: "Staff Org", logo_url: "https://img.test/staff.png" },
          },
          {
            user_id: "org_board",
            public_slug: "org-board",
            profile: { name: "Board Org", brandMarkUrl: "https://img.test/board.png" },
          },
        ],
      }),
      "user_123",
    )

    expect(result).toEqual([
      {
        orgId: "user_123",
        role: "owner",
        name: "My Organization",
        publicSlug: "my-organization",
        imageUrl: "https://img.test/self.png",
      },
      {
        orgId: "org_staff",
        role: "staff",
        name: "Staff Org",
        publicSlug: "org-staff",
        imageUrl: "https://img.test/staff.png",
      },
      {
        orgId: "org_board",
        role: "board",
        name: "Board Org",
        publicSlug: "org-board",
        imageUrl: "https://img.test/board.png",
      },
    ])
  })
})
