import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientServerMock,
  resetTestMocks,
} from "./test-utils"

const fetchLearningEntitlementsMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/accelerator/entitlements", () => ({
  fetchLearningEntitlements: fetchLearningEntitlementsMock,
}))

describe("completeOnboardingAction", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.clearAllMocks()
  })

  it("blocks paid build onboarding when no active subscription entitlement exists", async () => {
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "founder@example.com",
            },
          },
          error: null,
        }),
      },
    })
    fetchLearningEntitlementsMock.mockResolvedValue({
      hasAcceleratorPurchase: false,
      hasActiveSubscription: false,
      hasAcceleratorAccess: false,
      hasElectiveAccess: false,
      ownedElectiveModuleSlugs: [],
    })

    const form = new FormData()
    form.set("intentFocus", "build")
    form.set("builderPlanTier", "organization")

    const { completeOnboardingAction } = await import("@/app/(dashboard)/onboarding/actions")
    const destination = await captureRedirect(() => completeOnboardingAction(form))

    expect(fetchLearningEntitlementsMock).toHaveBeenCalledWith({
      supabase: expect.any(Object),
      userId: "user_123",
      forceStripeSync: false,
    })
    expect(destination).toBe("/onboarding?error=builder_plan_required")
  })

  it("lets free post-signup builders enter the workspace without a subscription check", async () => {
    const profilesUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateUserMock = vi.fn().mockResolvedValue({ error: null })
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "founder@example.com",
            },
          },
          error: null,
        }),
        updateUser: updateUserMock,
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            upsert: profilesUpsertMock,
          }
        }
        throw new Error(`Unexpected table lookup: ${table}`)
      }),
    })

    const form = new FormData()
    form.set("intentFocus", "build")
    form.set("onboardingMode", "post_signup_access")
    form.set("builderPlanTier", "free")
    form.set("firstName", "Ada")
    form.set("lastName", "Lovelace")

    const { completeOnboardingAction } = await import("@/app/(dashboard)/onboarding/actions")
    const destination = await captureRedirect(() => completeOnboardingAction(form))

    expect(fetchLearningEntitlementsMock).not.toHaveBeenCalled()
    expect(profilesUpsertMock).toHaveBeenCalled()
    expect(updateUserMock).toHaveBeenCalled()
    expect(destination).toBe("/workspace?onboarding_flow=1&onboarding_stage=2&source=onboarding")
  })

  it("lets free workspace setup finish organization creation without a subscription check", async () => {
    const profilesUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const organizationsSlugCountQueryMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
      count: 0,
    })
    const organizationsSelectMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { profile: null },
      error: null,
    })
    const organizationsUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateUserMock = vi.fn().mockResolvedValue({ error: null })

    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "founder@example.com",
            },
          },
          error: null,
        }),
        updateUser: updateUserMock,
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            upsert: profilesUpsertMock,
          }
        }
        if (table === "organizations") {
          return {
            select: vi.fn((columns?: string, options?: { count?: string; head?: boolean }) => {
              if (options?.count === "exact" && options?.head) {
                return {
                  ilike: vi.fn().mockReturnValue({
                    neq: organizationsSlugCountQueryMock,
                  }),
                }
              }

              return {
                eq: vi.fn().mockReturnValue({
                  maybeSingle: organizationsSelectMaybeSingleMock,
                }),
              }
            }),
            upsert: organizationsUpsertMock,
          }
        }
        throw new Error(`Unexpected table lookup: ${table}`)
      }),
    })

    const form = new FormData()
    form.set("intentFocus", "build")
    form.set("onboardingMode", "workspace_setup")
    form.set("builderPlanTier", "free")
    form.set("formationStatus", "approved")
    form.set("orgName", "Bright Futures Collective")
    form.set("orgSlug", "bright-futures-collective")
    form.set("firstName", "Ada")
    form.set("lastName", "Lovelace")

    const { completeOnboardingAction } = await import("@/app/(dashboard)/onboarding/actions")
    const destination = await captureRedirect(() => completeOnboardingAction(form))

    expect(fetchLearningEntitlementsMock).not.toHaveBeenCalled()
    expect(profilesUpsertMock).toHaveBeenCalled()
    expect(organizationsSlugCountQueryMock).toHaveBeenCalled()
    expect(organizationsSelectMaybeSingleMock).toHaveBeenCalled()
    expect(organizationsUpsertMock).toHaveBeenCalled()
    expect(updateUserMock).toHaveBeenCalled()
    expect(destination).toBe("/workspace?onboarding_flow=1&onboarding_stage=2&source=onboarding")
  })

  it("allows build onboarding to finish when entitlement fallback reports an active subscription", async () => {
    const profilesUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateUserMock = vi.fn().mockResolvedValue({ error: null })
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "founder@example.com",
            },
          },
          error: null,
        }),
        updateUser: updateUserMock,
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            upsert: profilesUpsertMock,
          }
        }
        throw new Error(`Unexpected table lookup: ${table}`)
      }),
    })
    fetchLearningEntitlementsMock.mockResolvedValue({
      hasAcceleratorPurchase: false,
      hasActiveSubscription: true,
      hasAcceleratorAccess: true,
      hasElectiveAccess: true,
      ownedElectiveModuleSlugs: [],
    })

    const form = new FormData()
    form.set("intentFocus", "build")
    form.set("onboardingMode", "post_signup_access")
    form.set("builderPlanTier", "organization")
    form.set("firstName", "Ada")
    form.set("lastName", "Lovelace")

    const { completeOnboardingAction } = await import("@/app/(dashboard)/onboarding/actions")
    const destination = await captureRedirect(() => completeOnboardingAction(form))

    expect(fetchLearningEntitlementsMock).toHaveBeenCalledWith({
      supabase: expect.any(Object),
      userId: "user_123",
      forceStripeSync: true,
    })
    expect(profilesUpsertMock).toHaveBeenCalled()
    expect(updateUserMock).toHaveBeenCalled()
    expect(destination).toBe("/workspace?onboarding_flow=1&onboarding_stage=2&source=onboarding")
  })
})
