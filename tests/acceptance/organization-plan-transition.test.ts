import { beforeEach, describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"

import {
  buildPlanTransitionIdempotencyKey,
  resolveOrganizationSubscriptionState,
  transitionOrganizationPlan,
} from "@/lib/billing/organization-plan-transition"

const { createSupabaseAdminClientMock, upsertMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
  upsertMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

function subscription({
  id,
  price = "price_org",
  owner = "org_123",
  status = "active",
  cancelAtPeriodEnd = false,
}: {
  id: string
  price?: string
  owner?: string
  status?: Stripe.Subscription.Status
  cancelAtPeriodEnd?: boolean
}) {
  return {
    id,
    created: 1_700_000_000,
    status,
    customer: "cus_123",
    cancel_at: null,
    canceled_at: null,
    cancel_at_period_end: cancelAtPeriodEnd,
    metadata: {
      kind: "organization",
      org_user_id: owner,
      user_id: "user_123",
      plan_tier: price === "price_ops" ? "operations_support" : "organization",
    },
    items: {
      data: [
        {
          id: `si_${id}`,
          price: { id: price },
          quantity: 1,
          current_period_end: 1_800_000_000,
        },
      ],
    },
  } as unknown as Stripe.Subscription
}

function supabaseWithReferences(ids: string[]) {
  const query = {
    select: () => query,
    eq: () => query,
    not: () => query,
    order: () => query,
    limit: vi.fn().mockResolvedValue({
      data: ids.map((id) => ({ stripe_subscription_id: id })),
      error: null,
    }),
  }
  return { from: vi.fn(() => query) }
}

function stripeConfig({
  retrieve = vi.fn(),
  search = vi.fn().mockResolvedValue({ data: [] }),
  list = vi.fn().mockResolvedValue({ data: [], has_more: false }),
  update = vi.fn(),
  checkout = vi.fn(),
} = {}) {
  return {
    target: "primary" as const,
    mode: "live" as const,
    secretKey: "sk_live_test",
    webhookSecret: "whsec_test",
    organizationPriceId: "price_org",
    operationsSupportPriceId: "price_ops",
    coachingFullPriceId: null,
    coachingDiscountedPriceId: null,
    client: {
      subscriptions: { retrieve, search, list, update },
      checkout: { sessions: { create: checkout } },
    } as unknown as Stripe,
  }
}

describe("organization plan transition", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsertMock.mockResolvedValue({ error: null })
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({ upsert: upsertMock })),
    })
  })

  it("finds a live subscription missing from the local database", async () => {
    const live = subscription({ id: "sub_live" })
    const search = vi
      .fn()
      .mockResolvedValueOnce({ data: [live] })
      .mockResolvedValueOnce({ data: [live] })
    const config = stripeConfig({ search })

    const state = await resolveOrganizationSubscriptionState({
      supabase: supabaseWithReferences([]) as never,
      config,
      orgId: "org_123",
    })

    expect(state.subscriptions.map((item) => item.id)).toEqual(["sub_live"])
    expect(search).toHaveBeenCalledTimes(2)
  })

  it("finds a recent subscription before Stripe Search becomes consistent", async () => {
    const recent = subscription({ id: "sub_recent" })
    const list = vi.fn().mockResolvedValue({
      data: [recent],
      has_more: false,
    })
    const config = stripeConfig({ list })

    const state = await resolveOrganizationSubscriptionState({
      supabase: supabaseWithReferences([]) as never,
      config,
      orgId: "org_123",
    })

    expect(state.subscriptions.map((item) => item.id)).toEqual(["sub_recent"])
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "all",
        created: { gte: expect.any(Number) },
        limit: 100,
      })
    )
  })

  it("paginates recent subscriptions before deciding checkout is safe", async () => {
    const first = subscription({ id: "sub_first", owner: "org_other" })
    const second = subscription({ id: "sub_second" })
    const list = vi
      .fn()
      .mockResolvedValueOnce({ data: [first], has_more: true })
      .mockResolvedValueOnce({ data: [second], has_more: false })
    const config = stripeConfig({ list })

    const state = await resolveOrganizationSubscriptionState({
      supabase: supabaseWithReferences([]) as never,
      config,
      orgId: "org_123",
    })

    expect(state.subscriptions.map((item) => item.id)).toEqual(["sub_second"])
    expect(list).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ starting_after: "sub_first" })
    )
  })

  it("rejects a local reference owned by another organization", async () => {
    const linkedToAnotherOwner = subscription({
      id: "sub_wrong_owner",
      owner: "org_other",
    })
    const config = stripeConfig({
      retrieve: vi.fn().mockResolvedValue(linkedToAnotherOwner),
    })

    const state = await resolveOrganizationSubscriptionState({
      supabase: supabaseWithReferences(["sub_wrong_owner"]) as never,
      config,
      orgId: "org_123",
    })

    expect(state.subscriptions).toEqual([])
  })

  it("fails closed when Stripe subscription verification fails", async () => {
    const config = stripeConfig({
      search: vi.fn().mockRejectedValue(new Error("search unavailable")),
    })

    await expect(
      resolveOrganizationSubscriptionState({
        supabase: supabaseWithReferences([]) as never,
        config,
        orgId: "org_123",
      })
    ).rejects.toThrow("search unavailable")
  })

  it("blocks a plan transition when duplicate active subscriptions exist", async () => {
    const config = stripeConfig()
    const result = await transitionOrganizationPlan({
      state: {
        subscriptions: [
          subscription({ id: "sub_one" }),
          subscription({ id: "sub_two" }),
        ],
      },
      config,
      userId: "user_123",
      userEmail: "member@example.test",
      orgId: "org_123",
      planTier: "operations_support",
      priceId: "price_ops",
      origin: "https://example.test",
      successUrl: "/success",
      cancelUrl: "/billing",
      source: "billing",
      attempt: "attempt_123",
    })

    expect(result).toEqual({
      kind: "blocked",
      code: "duplicate_subscriptions",
    })
  })

  it("blocks a subscription that is scheduled to cancel", async () => {
    const update = vi.fn()
    const config = stripeConfig({ update })
    const result = await transitionOrganizationPlan({
      state: {
        subscriptions: [
          subscription({ id: "sub_canceling", cancelAtPeriodEnd: true }),
        ],
      },
      config,
      userId: "user_123",
      userEmail: "member@example.test",
      orgId: "org_123",
      planTier: "operations_support",
      priceId: "price_ops",
      origin: "https://example.test",
      successUrl: "/success",
      cancelUrl: "/billing",
      source: "billing",
      attempt: "attempt_123",
    })

    expect(result).toEqual({
      kind: "blocked",
      code: "subscription_canceling",
    })
    expect(update).not.toHaveBeenCalled()
  })

  it("repairs the local snapshot without mutating an already-current plan", async () => {
    const existing = subscription({ id: "sub_current" })
    const update = vi.fn()
    const config = stripeConfig({ update })

    const result = await transitionOrganizationPlan({
      state: { subscriptions: [existing] },
      config,
      userId: "user_123",
      userEmail: "member@example.test",
      orgId: "org_123",
      planTier: "organization",
      priceId: "price_org",
      origin: "https://example.test",
      successUrl: "/success",
      cancelUrl: "/billing",
      source: "billing",
      attempt: "attempt_123",
    })

    expect(result).toEqual({ kind: "unchanged", subscription: existing })
    expect(update).not.toHaveBeenCalled()
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "org_123",
        stripe_subscription_id: "sub_current",
      }),
      { onConflict: "user_id,stripe_subscription_id" }
    )
  })

  it("replaces the existing item without proration and synchronizes the row", async () => {
    const existing = subscription({ id: "sub_existing" })
    const updated = subscription({ id: "sub_existing", price: "price_ops" })
    const update = vi.fn().mockResolvedValue(updated)
    const config = stripeConfig({ update })

    const result = await transitionOrganizationPlan({
      state: { subscriptions: [existing] },
      config,
      userId: "user_123",
      userEmail: "member@example.test",
      orgId: "org_123",
      planTier: "operations_support",
      priceId: "price_ops",
      origin: "https://example.test",
      successUrl: "/success",
      cancelUrl: "/billing",
      source: "billing",
      attempt: "attempt_123",
    })

    expect(result.kind).toBe("updated")
    expect(update).toHaveBeenCalledWith(
      "sub_existing",
      expect.objectContaining({
        items: [
          {
            id: "si_sub_existing",
            price: "price_ops",
            quantity: 1,
          },
        ],
        proration_behavior: "none",
      }),
      {
        idempotencyKey: buildPlanTransitionIdempotencyKey({
          orgId: "org_123",
          planTier: "operations_support",
          attempt: "attempt_123",
        }),
      }
    )
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "org_123",
        stripe_subscription_id: "sub_existing",
        metadata: expect.objectContaining({
          plan_tier: "operations_support",
        }),
        current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      }),
      { onConflict: "user_id,stripe_subscription_id" }
    )
  })

  it("creates an idempotent checkout only when no active subscription exists", async () => {
    const checkout = vi.fn().mockResolvedValue({
      id: "cs_123",
      url: "https://checkout.stripe.test/session",
    })
    const config = stripeConfig({ checkout })

    const result = await transitionOrganizationPlan({
      state: { subscriptions: [] },
      config,
      userId: "user_123",
      userEmail: "member@example.test",
      orgId: "org_123",
      planTier: "organization",
      priceId: "price_org",
      origin: "https://example.test",
      successUrl: "/success",
      cancelUrl: "/billing?cancelled=true",
      source: "billing",
      attempt: "attempt_123",
    })

    expect(result).toEqual({
      kind: "checkout",
      url: "https://checkout.stripe.test/session",
      sessionId: "cs_123",
    })
    expect(checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "member@example.test",
        line_items: [{ price: "price_org", quantity: 1 }],
      }),
      {
        idempotencyKey: buildPlanTransitionIdempotencyKey({
          orgId: "org_123",
          planTier: "organization",
          attempt: "attempt_123",
        }),
      }
    )
  })
})
