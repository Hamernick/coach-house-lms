import { beforeEach, describe, expect, it, vi } from "vitest"

import PricingSuccessPage from "@/app/(public)/pricing/success/page"
import { startCheckout } from "@/app/(public)/pricing/actions"
import {
  captureRedirect,
  createSupabaseServerClientMock,
  headersMock,
  resetTestMocks,
} from "./test-utils"

function createSupabaseStub() {
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
  const supabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: "user-123", email: "user@example.com" },
          },
        },
      }),
    },
    from: vi.fn(() => ({
      upsert,
    })),
  }

  return { supabase, upsert }
}

describe("pricing acceptance", () => {
  beforeEach(() => {
    resetTestMocks()
    headersMock.mockResolvedValue({
      get: (name: string) => (name.toLowerCase() === "origin" ? "https://example.test" : undefined),
    })
  })

  it("redirects trialing users to dashboard when checkout cannot reach Stripe", async () => {
    const { supabase, upsert } = createSupabaseStub()
    createSupabaseServerClientMock.mockReturnValue(supabase)

    const form = new FormData()
    form.set("priceId", "price_basic")
    form.set("planName", "Starter")

    const destination = await captureRedirect(() => startCheckout(form))

    expect(destination).toBe("/dashboard?subscription=trialing")
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        status: "trialing",
      }),
      expect.objectContaining({ onConflict: "stripe_subscription_id" })
    )
  })

  it("records subscription state on checkout success callback", async () => {
    const { supabase, upsert } = createSupabaseStub()
    createSupabaseServerClientMock.mockReturnValue(supabase)

    const destination = await captureRedirect(() =>
      PricingSuccessPage({ searchParams: Promise.resolve({}) })
    )

    expect(destination).toBe("/dashboard?subscription=trialing")
    expect(upsert).toHaveBeenCalledTimes(1)
    const [payload] = upsert.mock.calls[0]
    expect(payload).toMatchObject({
      user_id: "user-123",
      status: "trialing",
    })
    expect(payload.stripe_subscription_id).toMatch(/^stub_/)
  })
})
