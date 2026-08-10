import { beforeEach, describe, expect, it, vi } from "vitest"

import { createBillingPortalSession } from "@/app/(dashboard)/billing/actions"
import {
  createSupabaseServerClientServerMock,
  headersMock,
  loggerErrorMock,
  loggerInfoMock,
  resetTestMocks,
  stripeBillingPortalCreateMock,
  stripeConstructorMock,
  stripeSubscriptionSearchMock,
} from "./test-utils"

import { env } from "@/lib/env"

const { resolveActiveOrganizationMock, resolveDevtoolsAudienceMock } =
  vi.hoisted(() => ({
    resolveActiveOrganizationMock: vi.fn(),
    resolveDevtoolsAudienceMock: vi.fn(),
  }))

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: resolveActiveOrganizationMock,
}))

vi.mock("@/lib/devtools/audience", () => ({
  resolveDevtoolsAudience: resolveDevtoolsAudienceMock,
  resolveTesterMetadata: vi.fn(() => false),
}))

function activeSubscription(id = "sub_123") {
  return {
    id,
    created: 1_700_000_000,
    status: "active",
    customer: "cus_123",
    cancel_at: null,
    canceled_at: null,
    cancel_at_period_end: false,
    metadata: {
      kind: "organization",
      org_user_id: "org_123",
      user_id: "user-123",
      plan_tier: "organization",
    },
    items: {
      data: [
        {
          id: `si_${id}`,
          price: { id: "price_org" },
          quantity: 1,
          current_period_end: 1_800_000_000,
        },
      ],
    },
  }
}

function billingSupabase() {
  const subscriptionsTable = {
    select: () => subscriptionsTable,
    eq: () => subscriptionsTable,
    not: () => subscriptionsTable,
    order: () => subscriptionsTable,
    limit: () => Promise.resolve({ data: [], error: null }),
  }

  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: { user: { id: "user-123" } } } }),
    },
    from: () => subscriptionsTable,
  }
}

describe("billing portal flow", () => {
  const originalStripeSecret = env.STRIPE_SECRET_KEY

  beforeEach(() => {
    resetTestMocks()
    env.STRIPE_SECRET_KEY = originalStripeSecret
    resolveActiveOrganizationMock.mockResolvedValue({
      orgId: "org_123",
      role: "owner",
    })
    resolveDevtoolsAudienceMock.mockResolvedValue({
      isAdmin: false,
      isTester: false,
    })
    stripeSubscriptionSearchMock.mockResolvedValue({ data: [] })
  })

  it("returns an error when Stripe is not configured", async () => {
    env.STRIPE_SECRET_KEY = undefined

    createSupabaseServerClientServerMock.mockReturnValue(billingSupabase())

    const result = await createBillingPortalSession()

    expect(result).toEqual({ error: "Billing portal not available yet." })
    expect(stripeConstructorMock).not.toHaveBeenCalled()
  })

  it("creates a billing portal session when Stripe is available", async () => {
    env.STRIPE_SECRET_KEY = "sk_test_acceptance"

    createSupabaseServerClientServerMock.mockReturnValue(billingSupabase())
    stripeSubscriptionSearchMock.mockResolvedValue({
      data: [activeSubscription()],
    })
    headersMock.mockResolvedValue({
      get: (name: string) =>
        name === "origin" ? "https://app.test" : undefined,
    })
    stripeBillingPortalCreateMock.mockResolvedValue({
      url: "https://billing.example/session",
    })

    const result = await createBillingPortalSession()

    expect(stripeConstructorMock).toHaveBeenCalledWith("sk_test_acceptance", {
      apiVersion: "2025-08-27.basil",
    })
    expect(result).toEqual({ url: "https://billing.example/session" })
    expect(loggerInfoMock).toHaveBeenCalledWith(
      "billing_portal_session_created",
      expect.objectContaining({
        userId: "user-123",
      })
    )
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })

  it("blocks the portal when duplicate active subscriptions exist", async () => {
    env.STRIPE_SECRET_KEY = "sk_test_acceptance"
    createSupabaseServerClientServerMock.mockReturnValue(billingSupabase())
    stripeSubscriptionSearchMock.mockResolvedValue({
      data: [activeSubscription("sub_one"), activeSubscription("sub_two")],
    })

    const result = await createBillingPortalSession()

    expect(result).toEqual({
      error:
        "Multiple active subscriptions need support review before billing changes.",
    })
    expect(stripeBillingPortalCreateMock).not.toHaveBeenCalled()
  })
})
