import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const {
  createSupabaseRouteHandlerClientMock,
  resolveActiveOrganizationMock,
  resolveDevtoolsAudienceMock,
  resolveTesterMetadataMock,
  resolveStripeRuntimeConfigForAudienceMock,
  resolveStripePriceIdForPlanMock,
  resolveOrganizationSubscriptionStateMock,
  transitionOrganizationPlanMock,
} = vi.hoisted(() => ({
  createSupabaseRouteHandlerClientMock: vi.fn(),
  resolveActiveOrganizationMock: vi.fn(),
  resolveDevtoolsAudienceMock: vi.fn(),
  resolveTesterMetadataMock: vi.fn(),
  resolveStripeRuntimeConfigForAudienceMock: vi.fn(),
  resolveStripePriceIdForPlanMock: vi.fn(),
  resolveOrganizationSubscriptionStateMock: vi.fn(),
  transitionOrganizationPlanMock: vi.fn(),
}))

vi.mock("@/lib/supabase", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/supabase")>("@/lib/supabase")
  return {
    ...actual,
    createSupabaseRouteHandlerClient: createSupabaseRouteHandlerClientMock,
  }
})

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: resolveActiveOrganizationMock,
}))

vi.mock("@/lib/devtools/audience", () => ({
  resolveDevtoolsAudience: resolveDevtoolsAudienceMock,
  resolveTesterMetadata: resolveTesterMetadataMock,
}))

vi.mock("@/lib/billing/stripe-runtime", () => ({
  resolveStripeRuntimeConfigForAudience:
    resolveStripeRuntimeConfigForAudienceMock,
  resolveStripePriceIdForPlan: resolveStripePriceIdForPlanMock,
}))

vi.mock("@/lib/billing/organization-plan-transition", () => ({
  resolveOrganizationSubscriptionState:
    resolveOrganizationSubscriptionStateMock,
  transitionOrganizationPlan: transitionOrganizationPlanMock,
}))

vi.mock("@/lib/billing/stripe-checkout-diagnostics", () => ({
  collectStripeCheckoutPriceDiagnostics: vi.fn(),
}))

function authenticatedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user_123",
            email: "builder@example.test",
            user_metadata: {},
          },
        },
      }),
    },
  }
}

describe("stripe checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveTesterMetadataMock.mockReturnValue(false)
    resolveDevtoolsAudienceMock.mockResolvedValue({ isTester: false })
    resolveActiveOrganizationMock.mockResolvedValue({
      orgId: "org_123",
      role: "owner",
    })
    resolveStripePriceIdForPlanMock.mockReturnValue("price_ops")
    resolveStripeRuntimeConfigForAudienceMock.mockReturnValue({
      client: {},
      mode: "live",
      target: "primary",
    })
    resolveOrganizationSubscriptionStateMock.mockResolvedValue({
      subscriptions: [],
    })
    transitionOrganizationPlanMock.mockResolvedValue({
      kind: "checkout",
      url: "https://checkout.stripe.test/session_123",
      sessionId: "cs_123",
    })
  })

  it("preserves onboarding return params when redirecting unauthenticated users to login", async () => {
    createSupabaseRouteHandlerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    })

    const { GET } = await import("@/app/api/stripe/checkout/route")
    const request = new NextRequest(
      "http://localhost/api/stripe/checkout?plan=operations_support&source=onboarding&redirect=%2Fworkspace%3Fonboarding_flow%3D1%26source%3Donboarding_pricing&cancel=%2Fworkspace%3Fonboarding_flow%3D1%26source%3Donboarding_pricing&context=onboarding_builder"
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain(
      "/login?source=onboarding"
    )
    expect(resolveOrganizationSubscriptionStateMock).not.toHaveBeenCalled()
  })

  it("returns checkout setup errors to the onboarding workspace", async () => {
    createSupabaseRouteHandlerClientMock.mockReturnValue(
      authenticatedSupabase()
    )
    resolveStripeRuntimeConfigForAudienceMock.mockReturnValue(null)

    const { GET } = await import("@/app/api/stripe/checkout/route")
    const response = await GET(
      new NextRequest(
        "http://localhost/api/stripe/checkout?plan=organization&source=onboarding&redirect=%2Fworkspace%3Fonboarding_flow%3D1&cancel=%2Fworkspace%3Fonboarding_flow%3D1"
      )
    )

    expect(response.headers.get("location")).toContain(
      "/workspace?onboarding_flow=1"
    )
    expect(response.headers.get("location")).toContain(
      "checkout_error=stripe_unavailable"
    )
  })

  it("sends an existing subscriber to billing without creating checkout", async () => {
    createSupabaseRouteHandlerClientMock.mockReturnValue(
      authenticatedSupabase()
    )
    resolveOrganizationSubscriptionStateMock.mockResolvedValue({
      subscriptions: [{ id: "sub_existing" }],
    })

    const { GET } = await import("@/app/api/stripe/checkout/route")
    const response = await GET(
      new NextRequest(
        "http://localhost/api/stripe/checkout?plan=operations_support&source=sidebar_upgrade"
      )
    )

    expect(response.headers.get("location")).toBe(
      "http://localhost/billing?plan=operations_support&requested_plan=operations_support"
    )
    expect(transitionOrganizationPlanMock).not.toHaveBeenCalled()
  })

  it("blocks checkout when more than one active subscription exists", async () => {
    createSupabaseRouteHandlerClientMock.mockReturnValue(
      authenticatedSupabase()
    )
    resolveOrganizationSubscriptionStateMock.mockResolvedValue({
      subscriptions: [{ id: "sub_one" }, { id: "sub_two" }],
    })

    const { GET } = await import("@/app/api/stripe/checkout/route")
    const response = await GET(
      new NextRequest("http://localhost/api/stripe/checkout?plan=organization")
    )

    expect(response.headers.get("location")).toBe(
      "http://localhost/billing?plan=organization&billing_error=duplicate_subscriptions"
    )
    expect(transitionOrganizationPlanMock).not.toHaveBeenCalled()
  })

  it("fails closed when subscription verification is unavailable", async () => {
    createSupabaseRouteHandlerClientMock.mockReturnValue(
      authenticatedSupabase()
    )
    resolveOrganizationSubscriptionStateMock.mockRejectedValue(
      new Error("verification unavailable")
    )

    const { GET } = await import("@/app/api/stripe/checkout/route")
    const response = await GET(
      new NextRequest("http://localhost/api/stripe/checkout?plan=organization")
    )

    expect(response.headers.get("location")).toContain(
      "checkout_error=checkout_failed"
    )
    expect(transitionOrganizationPlanMock).not.toHaveBeenCalled()
  })

  it("creates a guarded checkout with preserved return metadata for a free user", async () => {
    createSupabaseRouteHandlerClientMock.mockReturnValue(
      authenticatedSupabase()
    )

    const { GET } = await import("@/app/api/stripe/checkout/route")
    const response = await GET(
      new NextRequest(
        "http://localhost/api/stripe/checkout?plan=operations_support&source=onboarding&redirect=%2Fworkspace%3Fonboarding_flow%3D1&cancel=%2Ffind&context=onboarding_builder"
      )
    )

    expect(response.headers.get("location")).toBe(
      "https://checkout.stripe.test/session_123"
    )
    expect(transitionOrganizationPlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_123",
        planTier: "operations_support",
        priceId: "price_ops",
        cancelUrl: "http://localhost/find?cancelled=true",
        checkoutContext: "onboarding_builder",
        checkoutMetadata: {
          redirect_after_success: "/workspace?onboarding_flow=1",
        },
      })
    )
  })
})
