import { beforeEach, describe, expect, it } from "vitest"

import { createBillingPortalSession } from "@/app/(dashboard)/billing/actions"
import {
  createSupabaseServerClientServerMock,
  headersMock,
  loggerErrorMock,
  loggerInfoMock,
  resetTestMocks,
  stripeBillingPortalCreateMock,
  stripeConstructorMock,
} from "./test-utils"

import { env } from "@/lib/env"

describe("billing portal flow", () => {
  const originalStripeSecret = env.STRIPE_SECRET_KEY

  beforeEach(() => {
    resetTestMocks()
    env.STRIPE_SECRET_KEY = originalStripeSecret
  })

  it("returns an error when Stripe is not configured", async () => {
    env.STRIPE_SECRET_KEY = undefined

    const supabase = {
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: { user: { id: "user-123" } } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
            }),
          }),
        }),
      }),
    }

    createSupabaseServerClientServerMock.mockReturnValue(supabase)

    const result = await createBillingPortalSession()

    expect(result).toEqual({ error: "Billing portal not available yet." })
    expect(stripeConstructorMock).not.toHaveBeenCalled()
  })

  it("creates a billing portal session when Stripe is available", async () => {
    env.STRIPE_SECRET_KEY = "sk_test_acceptance"

    const subscriptionsTable = {
      select: () => subscriptionsTable,
      eq: () => subscriptionsTable,
      order: () => subscriptionsTable,
      limit: () => subscriptionsTable,
      maybeSingle: () =>
        Promise.resolve({ data: { stripe_customer_id: "cus_123" }, error: null }),
    }

    const supabase = {
      auth: {
        getSession: () =>
          Promise.resolve({ data: { session: { user: { id: "user-123" } } } }),
      },
      from: () => subscriptionsTable,
    }

    createSupabaseServerClientServerMock.mockReturnValue(supabase)
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "origin" ? "https://app.test" : undefined),
    })
    stripeBillingPortalCreateMock.mockResolvedValue({ url: "https://billing.example/session" })

    const result = await createBillingPortalSession()

    expect(stripeConstructorMock).toHaveBeenCalledWith("sk_test_acceptance", {
      apiVersion: "2025-08-27.basil",
    })
    expect(result).toEqual({ url: "https://billing.example/session" })
    expect(loggerInfoMock).toHaveBeenCalledWith("billing_portal_session_created", {
      userId: "user-123",
    })
    expect(loggerErrorMock).not.toHaveBeenCalled()
  })
})
