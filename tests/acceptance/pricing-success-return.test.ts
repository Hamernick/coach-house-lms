import { beforeEach, describe, expect, it, vi } from "vitest"

import { captureRedirect, resetTestMocks } from "./test-utils"

const {
  requireServerSessionMock,
  resolveDevtoolsAudienceMock,
  resolveTesterMetadataMock,
  resolveStripeRuntimeConfigsForFallbackMock,
  maybeStartOrganizationTrialFromAcceleratorMock,
  createSupabaseAdminClientMock,
} = vi.hoisted(() => ({
  requireServerSessionMock: vi.fn(),
  resolveDevtoolsAudienceMock: vi.fn(),
  resolveTesterMetadataMock: vi.fn(),
  resolveStripeRuntimeConfigsForFallbackMock: vi.fn(),
  maybeStartOrganizationTrialFromAcceleratorMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  requireServerSession: requireServerSessionMock,
}))

vi.mock("@/lib/devtools/audience", () => ({
  resolveDevtoolsAudience: resolveDevtoolsAudienceMock,
  resolveTesterMetadata: resolveTesterMetadataMock,
}))

vi.mock("@/lib/billing/stripe-runtime", () => ({
  resolveStripeRuntimeConfigsForFallback: resolveStripeRuntimeConfigsForFallbackMock,
}))

vi.mock("@/app/(public)/pricing/success/_lib/success-helpers", () => ({
  maybeStartOrganizationTrialFromAccelerator: maybeStartOrganizationTrialFromAcceleratorMock,
}))

vi.mock("@/lib/supabase", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase")>("@/lib/supabase")
  return {
    ...actual,
    createSupabaseAdminClient: createSupabaseAdminClientMock,
  }
})

describe("pricing success return handling", () => {
  const subscriptionsUpsertMock = vi.fn().mockResolvedValue({ data: null, error: null })

  beforeEach(() => {
    resetTestMocks()
    vi.clearAllMocks()
    resolveTesterMetadataMock.mockReturnValue(false)
    resolveDevtoolsAudienceMock.mockResolvedValue({ isTester: false })
    createSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        upsert: subscriptionsUpsertMock,
      })),
    })
    requireServerSessionMock.mockResolvedValue({
      supabase: {},
      session: {
        user: {
          id: "user_123",
          user_metadata: {},
        },
      },
    })
  })

  it("returns successful subscriptions to the onboarding workspace path", async () => {
    resolveStripeRuntimeConfigsForFallbackMock.mockReturnValue([
      {
        client: {
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_success",
                mode: "subscription",
                client_reference_id: "user_123",
                metadata: {},
                subscription: {
                  id: "sub_success",
                  status: "active",
                  customer: "cus_success",
                  metadata: {
                    kind: "organization",
                    planName: "Operations Support",
                    plan_tier: "operations_support",
                  },
                },
              }),
            },
          },
        },
        mode: "live",
      },
    ])

    const Page = (await import("@/app/(public)/pricing/success/page")).default
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          session_id: "cs_test_success",
          redirect: "/workspace?onboarding_flow=1&source=onboarding_pricing",
        }),
      }),
    )

    expect(destination).toBe(
      "/workspace?onboarding_flow=1&source=onboarding_pricing&checkout=success&plan=operations_support",
    )
  })

  it("still returns successful onboarding pricing state when subscription sync fails", async () => {
    resolveStripeRuntimeConfigsForFallbackMock.mockReturnValue([
      {
        client: {
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_success_sync_failure",
                mode: "subscription",
                client_reference_id: "user_123",
                metadata: {},
                subscription: {
                  id: "sub_success_sync_failure",
                  status: "active",
                  customer: "cus_success_sync_failure",
                  metadata: {
                    kind: "organization",
                    planName: "Organization",
                    plan_tier: "organization",
                  },
                },
              }),
            },
          },
        },
        mode: "live",
      },
    ])
    createSupabaseAdminClientMock.mockImplementation(() => {
      throw new Error("missing_service_role")
    })

    const Page = (await import("@/app/(public)/pricing/success/page")).default
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          session_id: "cs_test_success_sync_failure",
          redirect: "/workspace?onboarding_flow=1&source=onboarding_pricing",
        }),
      }),
    )

    expect(destination).toBe(
      "/workspace?onboarding_flow=1&source=onboarding_pricing&checkout=success&plan=organization",
    )
  })

  it("returns successful onboarding pricing state when Stripe completes checkout before subscription expansion is available", async () => {
    resolveStripeRuntimeConfigsForFallbackMock.mockReturnValue([
      {
        client: {
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_success_no_subscription",
                mode: "subscription",
                status: "complete",
                payment_status: "no_payment_required",
                client_reference_id: "user_123",
                metadata: {
                  kind: "organization",
                  planName: "Operations Support",
                  plan_tier: "operations_support",
                },
                subscription: null,
              }),
            },
          },
        },
        mode: "live",
      },
    ])

    const Page = (await import("@/app/(public)/pricing/success/page")).default
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          session_id: "cs_test_success_no_subscription",
          redirect: "/workspace?onboarding_flow=1&source=onboarding_pricing",
        }),
      }),
    )

    expect(destination).toBe(
      "/workspace?onboarding_flow=1&source=onboarding_pricing&checkout=success&plan=operations_support",
    )
  })

  it("hydrates a string subscription id before persisting the local subscription row", async () => {
    const retrieveSubscriptionMock = vi.fn().mockResolvedValue({
      id: "sub_string_hydrated",
      status: "active",
      customer: "cus_string_hydrated",
      metadata: {
        kind: "organization",
        planName: "Organization",
        plan_tier: "organization",
      },
      current_period_end: 1_799_452_800,
    })
    resolveStripeRuntimeConfigsForFallbackMock.mockReturnValue([
      {
        client: {
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_string_subscription",
                mode: "subscription",
                client_reference_id: "user_123",
                metadata: {
                  kind: "organization",
                  planName: "Organization",
                  plan_tier: "organization",
                },
                subscription: "sub_string_hydrated",
              }),
            },
          },
          subscriptions: {
            retrieve: retrieveSubscriptionMock,
          },
        },
        mode: "live",
      },
    ])

    const Page = (await import("@/app/(public)/pricing/success/page")).default
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          session_id: "cs_test_string_subscription",
          redirect: "/workspace?onboarding_flow=1&source=onboarding_pricing",
        }),
      }),
    )

    expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_string_hydrated")
    expect(subscriptionsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: "sub_string_hydrated",
        stripe_customer_id: "cus_string_hydrated",
        status: "active",
      }),
      { onConflict: "user_id,stripe_subscription_id" },
    )
    expect(destination).toBe(
      "/workspace?onboarding_flow=1&source=onboarding_pricing&checkout=success&plan=organization",
    )
  })

  it("returns incomplete subscriptions to the onboarding workspace path with an error", async () => {
    resolveStripeRuntimeConfigsForFallbackMock.mockReturnValue([
      {
        client: {
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_incomplete",
                mode: "subscription",
                client_reference_id: "user_123",
                metadata: {},
                subscription: {
                  id: "sub_incomplete",
                  status: "incomplete",
                  customer: "cus_incomplete",
                  metadata: {
                    kind: "organization",
                    planName: "Organization",
                    plan_tier: "organization",
                  },
                },
              }),
            },
          },
        },
        mode: "live",
      },
    ])

    const Page = (await import("@/app/(public)/pricing/success/page")).default
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          session_id: "cs_test_incomplete",
          redirect: "/workspace?onboarding_flow=1&source=onboarding_pricing",
        }),
      }),
    )

    expect(destination).toBe(
      "/workspace?onboarding_flow=1&source=onboarding_pricing&checkout_error=checkout_failed&subscription=incomplete",
    )
  })

  it("returns checkout errors to the onboarding pricing path instead of dropping users on a bare redirect target", async () => {
    resolveStripeRuntimeConfigsForFallbackMock.mockReturnValue([
      {
        client: {
          checkout: {
            sessions: {
              retrieve: vi.fn().mockRejectedValue(new Error("session_lookup_failed")),
            },
          },
        },
        mode: "live",
      },
    ])

    const Page = (await import("@/app/(public)/pricing/success/page")).default
    const destination = await captureRedirect(() =>
      Page({
        searchParams: Promise.resolve({
          session_id: "cs_test_failed_lookup",
          redirect: "/onboarding?source=onboarding_pricing",
        }),
      }),
    )

    expect(destination).toBe("/onboarding?source=onboarding_pricing&checkout_error=checkout_failed")
  })
})
