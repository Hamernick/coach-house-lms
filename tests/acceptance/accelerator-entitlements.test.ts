import { describe, expect, it } from "vitest"

import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import {
  hasBillingCancellationRiskFromSubscription,
  hasPaidTeamAccessFromSubscription,
} from "@/lib/billing/subscription-access"
import { resolvePricingPlanTier } from "@/lib/billing/plan-tier"

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

  it("does not treat free-plan subscription rows as paid access", async () => {
    const supabase = createSupabaseStub({
      accelerator_purchases: { data: null, error: null },
      elective_purchases: { data: [], error: null },
      subscriptions: {
        data: { id: "sub-free", status: "active", metadata: { planName: "Free" } },
        error: null,
      },
    })

    const entitlements = await fetchLearningEntitlements({
      supabase: supabase as never,
      userId: "free-user",
      orgUserId: "free-org",
      isAdmin: false,
    })

    expect(entitlements.hasActiveSubscription).toBe(false)
    expect(entitlements.hasAcceleratorAccess).toBe(false)
  })

  it("does not treat free plan-tier metadata as paid team access", () => {
    expect(
      hasPaidTeamAccessFromSubscription({
        status: "active",
        metadata: { plan_tier: "free" },
      }),
    ).toBe(false)
  })

  it("does not treat metadata-less active rows as paid team access", () => {
    expect(
      hasPaidTeamAccessFromSubscription({
        status: "active",
        metadata: null,
      }),
    ).toBe(false)
    expect(
      hasPaidTeamAccessFromSubscription({
        status: "active",
        metadata: { stripe_mode: "test" },
      }),
    ).toBe(false)
  })

  it("still treats explicit paid plan metadata as paid team access", () => {
    expect(
      hasPaidTeamAccessFromSubscription({
        status: "active",
        metadata: { plan_tier: "organization" },
      }),
    ).toBe(true)
    expect(
      hasPaidTeamAccessFromSubscription({
        status: "trialing",
        metadata: { planName: "Operations Support" },
      }),
    ).toBe(true)
  })

  it("resolves metadata-less active rows as free in billing surfaces", () => {
    expect(
      resolvePricingPlanTier({
        status: "active",
        metadata: { stripe_mode: "test" },
      }),
    ).toBe("free")
    expect(
      resolvePricingPlanTier({
        status: "active",
        metadata: { planName: "Organization" },
      }),
    ).toBe("organization")
  })

  it("only flags real paid Stripe subscriptions as account deletion billing risks", () => {
    expect(
      hasBillingCancellationRiskFromSubscription({
        status: "active",
        stripe_subscription_id: "sub_live",
        metadata: { plan_tier: "organization" },
      }),
    ).toBe(true)
    expect(
      hasBillingCancellationRiskFromSubscription({
        status: "past_due",
        stripe_subscription_id: "sub_live",
        metadata: { planName: "Organization" },
      }),
    ).toBe(true)
    expect(
      hasBillingCancellationRiskFromSubscription({
        status: "active",
        stripe_subscription_id: "stub_free",
        metadata: { plan_tier: "organization" },
      }),
    ).toBe(false)
    expect(
      hasBillingCancellationRiskFromSubscription({
        status: "active",
        stripe_subscription_id: "sub_live",
        metadata: { planName: "Free" },
      }),
    ).toBe(false)
    expect(
      hasBillingCancellationRiskFromSubscription({
        status: "canceled",
        stripe_subscription_id: "sub_live",
        metadata: { plan_tier: "organization" },
      }),
    ).toBe(false)
  })
})
