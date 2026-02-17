import { beforeEach, describe, expect, it, vi } from "vitest"

import { startCheckout } from "@/app/(public)/pricing/actions"
import {
  captureRedirect,
  headersMock,
  resetTestMocks,
  stripeCheckoutCreateMock,
} from "./test-utils"

const { requireServerSessionMock } = vi.hoisted(() => ({
  requireServerSessionMock: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  requireServerSession: requireServerSessionMock,
}))

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "sk_test_checkout",
    STRIPE_ORGANIZATION_PRICE_ID: "price_org",
    STRIPE_OPERATIONS_SUPPORT_PRICE_ID: "price_ops",
    NEXT_PUBLIC_MEETING_FREE_URL: undefined,
    NEXT_PUBLIC_MEETING_DISCOUNTED_URL: undefined,
    NEXT_PUBLIC_MEETING_FULL_URL: undefined,
  },
}))

describe("pricing checkout metadata", () => {
  beforeEach(() => {
    resetTestMocks()
    headersMock.mockResolvedValue({
      get: (name: string) => (name.toLowerCase() === "origin" ? "https://example.test" : undefined),
    })

    requireServerSessionMock.mockResolvedValue({
      supabase: {
        from: vi.fn(() => ({
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      },
      session: {
        user: {
          id: "user-accelerator",
          email: "accelerator@example.test",
        },
      },
    })
  })

  it("creates organization checkout with subscription mode and organization price", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/organization" })

    const form = new FormData()
    form.set("checkoutMode", "organization")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/organization")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("subscription")
    expect(params.line_items).toEqual([{ price: "price_org", quantity: 1 }])

    const metadata = params.metadata as Record<string, string>
    expect(metadata).toMatchObject({
      kind: "organization",
      user_id: "user-accelerator",
      planName: "Organization",
      plan_tier: "organization",
    })

    const subscriptionData = params.subscription_data as { metadata: Record<string, string> }
    expect(subscriptionData.metadata).toMatchObject({
      kind: "organization",
      user_id: "user-accelerator",
      planName: "Organization",
      plan_tier: "organization",
    })
  })

  it("creates operations support checkout with provided price id and operations metadata", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/operations" })

    const form = new FormData()
    form.set("checkoutMode", "organization")
    form.set("planName", "Operations Support")
    form.set("priceId", "price_ops_custom")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/operations")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("subscription")
    expect(params.line_items).toEqual([{ price: "price_ops_custom", quantity: 1 }])

    const metadata = params.metadata as Record<string, string>
    expect(metadata).toMatchObject({
      kind: "organization",
      user_id: "user-accelerator",
      planName: "Operations Support",
      plan_tier: "operations_support",
    })
  })

  it("uses operations support env price when plan name is operations and no explicit price id is provided", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/operations-default" })

    const form = new FormData()
    form.set("checkoutMode", "organization")
    form.set("planName", "Operations Support")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/operations-default")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.line_items).toEqual([{ price: "price_ops", quantity: 1 }])
  })

  it("treats legacy accelerator checkout mode as organization checkout", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/legacy" })

    const form = new FormData()
    form.set("checkoutMode", "accelerator")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/legacy")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("subscription")
    expect(params.line_items).toEqual([{ price: "price_org", quantity: 1 }])
  })
})
