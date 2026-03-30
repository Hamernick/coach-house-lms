import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientServerMock,
  redirectMock,
  resetTestMocks,
} from "./test-utils"

const fetchLearningEntitlementsMock = vi.hoisted(() => vi.fn())
const resolveActiveOrganizationMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/accelerator/entitlements", () => ({
  fetchLearningEntitlements: fetchLearningEntitlementsMock,
}))

vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: resolveActiveOrganizationMock,
}))

describe("onboarding gate", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("redirects completed builder users to workspace", async () => {
    vi.doMock("@/app/(dashboard)/_lib/dashboard-layout-state", () => ({
      resolveDashboardLayoutState: async () => ({
        userPresent: true,
        onboardingLocked: false,
        onboardingIntentFocus: "build",
      }),
    }))
    vi.doMock("@/components/onboarding/onboarding-workspace-card", () => ({
      OnboardingWorkspaceCard: () => null,
    }))

    const { default: Page } = await import("@/app/(dashboard)/onboarding/page")
    const destination = await captureRedirect(() => Page())
    expect(destination).toBe("/workspace")
  })

  it("renders onboarding workspace card while onboarding is still locked", async () => {
    vi.doMock("@/app/(dashboard)/_lib/dashboard-layout-state", () => ({
      resolveDashboardLayoutState: async () => ({
        userPresent: true,
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        onboardingDefaults: {},
        currentPlanTier: "free",
      }),
    }))
    vi.doMock("@/components/onboarding/onboarding-workspace-card", () => ({
      OnboardingWorkspaceCard: () => "onboarding-workspace-card",
    }))

    const { default: Page } = await import("@/app/(dashboard)/onboarding/page")
    const result = await Page()

    expect(result).toBeTruthy()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("recovers a paid onboarding pricing return from Stripe-backed entitlements when the local subscription row was missing before sync", async () => {
    vi.doMock("@/app/(dashboard)/_lib/dashboard-layout-state", () => ({
      resolveDashboardLayoutState: async () => ({
        userPresent: true,
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        onboardingDefaults: {},
        currentPlanTier: "free",
        isAdmin: false,
      }),
    }))
    vi.doMock("@/components/onboarding/onboarding-workspace-card", () => ({
      OnboardingWorkspaceCard: (props: unknown) => props,
    }))
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
            },
          },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            status: "active",
            metadata: {
              plan_tier: "organization",
            },
          },
          error: null,
        }),
      })),
    })
    resolveActiveOrganizationMock.mockResolvedValue({ orgId: "org_123", role: "owner" })
    fetchLearningEntitlementsMock.mockResolvedValue({
      hasAcceleratorPurchase: false,
      hasActiveSubscription: true,
      hasAcceleratorAccess: true,
      hasElectiveAccess: true,
      ownedElectiveModuleSlugs: [],
    })

    const { default: Page } = await import("@/app/(dashboard)/onboarding/page")
    const result = await Page({
      searchParams: Promise.resolve({
        source: "onboarding_pricing",
      }),
    })

    expect(result).toBeTruthy()
    expect(fetchLearningEntitlementsMock).toHaveBeenCalledWith({
      supabase: expect.any(Object),
      userId: "user_123",
      orgUserId: "org_123",
      isAdmin: false,
      forceStripeSync: true,
    })
    const child = (result as { props: { children: { props: Record<string, unknown> } } }).props.children
    expect(child.props).toEqual(
      expect.objectContaining({
        defaultBuilderPlanTier: "organization",
        mode: "post_signup_access",
      }),
    )
  })
})
