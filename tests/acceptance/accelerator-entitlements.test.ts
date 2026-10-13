import { describe, expect, it } from "vitest"

import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"

type QueryResponse = {
  data: unknown
  error: { code?: string; message?: string } | null
}

function createSupabaseStub(responses: Record<string, QueryResponse>) {
  return {
    from(table: string) {
      const response = responses[table] ?? { data: null, error: null }
      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        in() {
          return this
        },
        not() {
          return this
        },
        order() {
          return this
        },
        limit() {
          return this
        },
        maybeSingle: async () => ({
          data: response.data,
          error: response.error,
        }),
        returns: async () => ({
          data: response.data,
          error: response.error,
        }),
      }
    },
  }
}

describe("fetchLearningEntitlements", () => {
  it("falls back safely when entitlement tables are missing", async () => {
    const supabase = createSupabaseStub({
      accelerator_purchases: { data: null, error: { code: "42P01" } },
      elective_purchases: { data: null, error: { code: "42P01" } },
      subscriptions: { data: null, error: { code: "42P01" } },
    })

    const entitlements = await fetchLearningEntitlements({
      supabase: supabase as never,
      userId: "user-1",
      orgUserId: "org-1",
      isAdmin: false,
    })

    expect(entitlements).toEqual({
      hasAcceleratorPurchase: false,
      hasActiveSubscription: false,
      hasAcceleratorAccess: false,
      hasElectiveAccess: false,
      ownedElectiveModuleSlugs: [],
    })
  })

  it("throws for non-schema entitlement query failures", async () => {
    const supabase = createSupabaseStub({
      accelerator_purchases: { data: null, error: { code: "42501", message: "permission denied" } },
      elective_purchases: { data: [], error: null },
      subscriptions: { data: null, error: null },
    })

    await expect(
      fetchLearningEntitlements({
        supabase: supabase as never,
        userId: "user-1",
        orgUserId: "org-1",
        isAdmin: false,
      }),
    ).rejects.toThrow("permission denied")
  })
})
