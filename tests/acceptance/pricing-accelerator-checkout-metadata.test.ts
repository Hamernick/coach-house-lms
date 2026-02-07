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
    STRIPE_ACCELERATOR_WITH_COACHING_PRICE_ID: "price_accel_with_one_time",
    STRIPE_ACCELERATOR_WITHOUT_COACHING_PRICE_ID: "price_accel_without_one_time",
    STRIPE_ACCELERATOR_WITH_COACHING_MONTHLY_PRICE_ID: "price_accel_with_monthly",
    STRIPE_ACCELERATOR_WITHOUT_COACHING_MONTHLY_PRICE_ID: "price_accel_without_monthly",
    STRIPE_ACCELERATOR_PRICE_ID: undefined,
    STRIPE_ELECTIVE_RETENTION_AND_SECURITY_PRICE_ID: "price_elective_retention",
    STRIPE_ELECTIVE_DUE_DILIGENCE_PRICE_ID: "price_elective_due_diligence",
    STRIPE_ELECTIVE_FINANCIAL_HANDBOOK_PRICE_ID: "price_elective_financial_handbook",
    NEXT_PUBLIC_MEETING_FREE_URL: undefined,
    NEXT_PUBLIC_MEETING_DISCOUNTED_URL: undefined,
    NEXT_PUBLIC_MEETING_FULL_URL: undefined,
  },
}))

describe("accelerator checkout metadata", () => {
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

  it("creates accelerator monthly checkout with installment metadata", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/monthly" })

    const form = new FormData()
    form.set("checkoutMode", "accelerator")
    form.set("acceleratorVariant", "with_coaching")
    form.set("acceleratorBilling", "monthly")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/monthly")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("subscription")
    expect(params.line_items).toEqual([{ price: "price_accel_with_monthly", quantity: 1 }])

    const metadata = params.metadata as Record<string, string>
    expect(metadata).toMatchObject({
      kind: "accelerator",
      accelerator_variant: "with_coaching",
      accelerator_billing: "monthly",
      coaching_included: "true",
      accelerator_installment_limit: "10",
      accelerator_installments_paid: "0",
    })

    const subscriptionData = params.subscription_data as { metadata: Record<string, string> }
    expect(subscriptionData.metadata).toMatchObject({
      accelerator_billing: "monthly",
      accelerator_installment_limit: "10",
      accelerator_installments_paid: "0",
    })
  })

  it("creates accelerator monthly checkout without coaching using the non-coaching monthly price", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/monthly-no-coaching" })

    const form = new FormData()
    form.set("checkoutMode", "accelerator")
    form.set("acceleratorVariant", "without_coaching")
    form.set("acceleratorBilling", "monthly")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/monthly-no-coaching")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("subscription")
    expect(params.line_items).toEqual([{ price: "price_accel_without_monthly", quantity: 1 }])

    const metadata = params.metadata as Record<string, string>
    expect(metadata).toMatchObject({
      kind: "accelerator",
      accelerator_variant: "without_coaching",
      accelerator_billing: "monthly",
      coaching_included: "false",
      accelerator_installment_limit: "10",
      accelerator_installments_paid: "0",
    })
  })

  it("creates accelerator one-time checkout without installment metadata", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/one-time" })

    const form = new FormData()
    form.set("checkoutMode", "accelerator")
    form.set("acceleratorVariant", "without_coaching")
    form.set("acceleratorBilling", "one_time")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/one-time")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("payment")
    expect(params.line_items).toEqual([{ price: "price_accel_without_one_time", quantity: 1 }])

    const metadata = params.metadata as Record<string, string>
    expect(metadata).toMatchObject({
      kind: "accelerator",
      accelerator_variant: "without_coaching",
      accelerator_billing: "one_time",
      coaching_included: "false",
    })
    expect(metadata).not.toHaveProperty("accelerator_installment_limit")
    expect(metadata).not.toHaveProperty("accelerator_installments_paid")
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

    const subscriptionData = params.subscription_data as { metadata: Record<string, string> }
    expect(subscriptionData.metadata).toMatchObject({
      user_id: "user-accelerator",
      planName: "Organization",
    })
  })

  it("creates elective checkout with elective metadata and elective price", async () => {
    stripeCheckoutCreateMock.mockResolvedValue({ url: "https://checkout.test/elective" })

    const form = new FormData()
    form.set("checkoutMode", "elective")
    form.set("electiveModuleSlug", "due-diligence")

    const destination = await captureRedirect(() => startCheckout(form))
    expect(destination).toBe("https://checkout.test/elective")
    expect(stripeCheckoutCreateMock).toHaveBeenCalledTimes(1)

    const [params] = stripeCheckoutCreateMock.mock.calls[0] as [Record<string, unknown>]
    expect(params.mode).toBe("payment")
    expect(params.line_items).toEqual([{ price: "price_elective_due_diligence", quantity: 1 }])

    const metadata = params.metadata as Record<string, string>
    expect(metadata).toMatchObject({
      kind: "elective",
      user_id: "user-accelerator",
      elective_module_slug: "due-diligence",
    })
  })
})
