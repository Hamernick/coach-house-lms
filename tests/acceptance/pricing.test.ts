import { beforeEach, describe, expect, it, vi } from "vitest"

import PricingSuccessPage from "@/app/(public)/pricing/success/page"
import { startCheckout } from "@/app/(public)/pricing/actions"
import {
  captureRedirect,
  createSupabaseServerClientMock,
  headersMock,
  resetTestMocks,
} from "./test-utils"

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: undefined,
    STRIPE_TEST_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    STRIPE_TEST_WEBHOOK_SECRET: undefined,
    STRIPE_ORGANIZATION_PRICE_ID: undefined,
    STRIPE_TEST_ORGANIZATION_PRICE_ID: undefined,
    STRIPE_OPERATIONS_SUPPORT_PRICE_ID: undefined,
    STRIPE_TEST_OPERATIONS_SUPPORT_PRICE_ID: undefined,
    NEXT_PUBLIC_MEETING_FREE_URL: undefined,
    NEXT_PUBLIC_MEETING_DISCOUNTED_URL: undefined,
    NEXT_PUBLIC_MEETING_FULL_URL: undefined,
  },
}))

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

  it("redirects to the paywall error state when Stripe is unavailable", async () => {
    const { supabase, upsert } = createSupabaseStub()
    createSupabaseServerClientMock.mockReturnValue(supabase)

    const form = new FormData()
    form.set("priceId", "price_basic")
    form.set("planName", "Starter")

    const destination = await captureRedirect(() => startCheckout(form))

    expect(destination).toBe(
      "/organization?paywall=organization&plan=organization&checkout_error=stripe_unavailable&source=billing",
    )
    expect(upsert).not.toHaveBeenCalled()
  })

  it("treats legacy accelerator checkout mode as organization checkout", async () => {
    const { supabase } = createSupabaseStub()
    createSupabaseServerClientMock.mockReturnValue(supabase)

    const form = new FormData()
    form.set("checkoutMode", "accelerator")

    const destination = await captureRedirect(() => startCheckout(form))

    expect(destination).toBe(
      "/organization?paywall=organization&plan=organization&checkout_error=stripe_unavailable&source=billing",
    )
  })

  it("treats legacy elective checkout mode as organization checkout", async () => {
    const { supabase } = createSupabaseStub()
    createSupabaseServerClientMock.mockReturnValue(supabase)

    const form = new FormData()
    form.set("checkoutMode", "elective")
    form.set("electiveModuleSlug", "due-diligence")

    const destination = await captureRedirect(() => startCheckout(form))

    expect(destination).toBe(
      "/organization?paywall=organization&plan=organization&checkout_error=stripe_unavailable&source=billing",
    )
  })

  it("redirects to paywall error when Stripe is unavailable on success callback", async () => {
    const { supabase, upsert } = createSupabaseStub()
    createSupabaseServerClientMock.mockReturnValue(supabase)

    const destination = await captureRedirect(() =>
      PricingSuccessPage({ searchParams: Promise.resolve({}) })
    )

    expect(destination).toBe(
      "/organization?paywall=organization&plan=organization&checkout_error=stripe_unavailable&source=billing",
    )
    expect(upsert).not.toHaveBeenCalled()
  })
})
