import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureRedirect,
  createSupabaseServerClientServerMock,
  resetTestMocks,
} from "./test-utils"

// Load the action before timed cases so a cold import cannot outlive a test
// and resume against the next case's mocks. vi.mock declarations are hoisted.
import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"

const fetchLearningEntitlementsMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/accelerator/entitlements", () => ({
  fetchLearningEntitlements: fetchLearningEntitlementsMock,
}))

describe("completeOnboardingAction", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.clearAllMocks()
    fetchLearningEntitlementsMock.mockReset()
  })

  it.each([
    ["", "Community House", "missing_formation_status"],
    ["unknown", "Community House", "missing_formation_status"],
    ["approved", "   ", "missing_org_name"],
    ["approved", "x".repeat(121), "invalid_org_name"],
  ])("rejects invalid organization basics before writing setup (%s)", async (formationStatus, orgName, errorCode) => {
    const from = vi.fn()
    const updateUser = vi.fn()
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner", email: "owner@example.com" } }, error: null }),
        updateUser,
      },
      from,
    })
    const form = new FormData()
    form.set("intentFocus", "build")
    form.set("onboardingMode", "full")
    form.set("orgName", orgName)
    form.set("orgSlug", "community-house")
    form.set("formationStatus", formationStatus)
    expect(await captureRedirect(() => completeOnboardingAction(form))).toBe(`/onboarding?error=${errorCode}`)
    expect(from).not.toHaveBeenCalled()
    expect(updateUser).not.toHaveBeenCalled()
  })

  it.each([
    ["organization", "full", false],
    ["operations_support", "full", false],
    ["organization", "post_signup_access", true],
    ["operations_support", "post_signup_access", true],
  ] as const)(
    "blocks %s onboarding in %s mode without an active subscription",
    async (builderPlanTier, onboardingMode, forceStripeSync) => {
      const profilesWriteMock = vi.fn()
      const updateUserMock = vi.fn()
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
        from: profilesWriteMock,
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
      form.set("builderPlanTier", builderPlanTier)
      form.set("onboardingMode", onboardingMode)

      const destination = await captureRedirect(() =>
        completeOnboardingAction(form)
      )

      expect(fetchLearningEntitlementsMock).toHaveBeenCalledWith({
        supabase: expect.any(Object),
        userId: "user_123",
        forceStripeSync,
      })
      expect(fetchLearningEntitlementsMock).toHaveBeenCalledTimes(1)
      expect(destination).toBe("/onboarding?error=builder_plan_required")
      expect(profilesWriteMock).not.toHaveBeenCalled()
      expect(updateUserMock).not.toHaveBeenCalled()
    }
  )

  it("sends free post-signup builders to required workspace setup without a subscription check", async () => {
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

    const destination = await captureRedirect(() =>
      completeOnboardingAction(form)
    )

    expect(fetchLearningEntitlementsMock).not.toHaveBeenCalled()
    expect(profilesUpsertMock).toHaveBeenCalled()
    expect(updateUserMock).toHaveBeenCalled()
    expect(updateUserMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        onboarding_completed: false,
        onboarding_completed_at: null,
        workspace_onboarding_active: false,
      }),
    })
    expect(destination).toBe("/workspace?source=onboarding_setup")
  })

  it("sends completed member onboarding to find", async () => {
    const profilesUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateUserMock = vi.fn().mockResolvedValue({ error: null })
    const rpcMock = vi.fn().mockResolvedValue({
      data: { ok: true, code: "claimed", handle: "ada-lovelace" },
      error: null,
    })
    createSupabaseServerClientServerMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user_123",
              email: "member@example.com",
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
      rpc: rpcMock,
    })

    const form = new FormData()
    form.set("intentFocus", "find")
    form.set("onboardingMode", "post_signup_access")
    form.set("firstName", "Ada")
    form.set("lastName", "Lovelace")
    form.set("personHandle", "ada-lovelace")

    const destination = await captureRedirect(() =>
      completeOnboardingAction(form)
    )

    expect(fetchLearningEntitlementsMock).not.toHaveBeenCalled()
    expect(profilesUpsertMock).toHaveBeenCalled()
    expect(updateUserMock).toHaveBeenCalled()
    expect(rpcMock).toHaveBeenCalledWith("claim_person_public_handle", {
      p_handle: "ada-lovelace",
    })
    expect(destination).toBe("/?member_onboarding=0&source=member_onboarding")
  })

  it.each(["free", "operations_support"])("saves %s workspace setup while preserving existing documents and billing", async (planTier) => {
    fetchLearningEntitlementsMock.mockResolvedValue({ hasActiveSubscription: true })
    const savedProfile = {
      mission_final_statement: "Existing mission",
      roadmap: { sections: [{ id: "vision", content: "Existing vision" }, { id: "values", content: "Existing values" }] },
      documents: { bylaws: { path: "owner/bylaws.pdf" } },
      customField: "preserve this",
    }
    const profilesUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const membershipsEqMock = vi.fn().mockReturnValue({
      returns: vi.fn().mockResolvedValue({
        data: [
          {
            org_id: "org_active",
            role: "admin",
            created_at: "2026-04-01T00:00:00.000Z",
          },
        ],
        error: null,
      }),
    })
    const organizationsSlugCountQueryMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
      count: 0,
    })
    const organizationsSelectMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { profile: savedProfile, updated_at: "revision-1" },
      error: null,
    })
    const organizationsUpdateMaybeSingleMock = vi.fn().mockResolvedValue({
      data: { updated_at: "revision-2" },
      error: null,
    })
    const organizationsUpdateSelectMock = vi.fn().mockReturnValue({
      maybeSingle: organizationsUpdateMaybeSingleMock,
    })
    const organizationsUpdateRevisionEqMock = vi.fn().mockReturnValue({
      select: organizationsUpdateSelectMock,
    })
    const organizationsUpdateUserEqMock = vi.fn().mockReturnValue({
      eq: organizationsUpdateRevisionEqMock,
    })
    const organizationsUpdateMock = vi.fn().mockReturnValue({
      eq: organizationsUpdateUserEqMock,
    })
    const setupModulesReturnsMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "organization_setup_module",
          slug: "organization-setup",
        },
      ],
      error: null,
    })
    const moduleProgressMaybeSingleMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    const moduleProgressUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateUserMock = vi.fn().mockResolvedValue({ error: null })
    const rpcMock = vi.fn().mockResolvedValue({
      data: { ok: true, code: "claimed", handle: "ada-lovelace" },
      error: null,
    })

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
        if (table === "organization_memberships") {
          return {
            select: vi.fn().mockReturnValue({
              eq: membershipsEqMock,
            }),
          }
        }
        if (table === "organizations") {
          return {
            select: vi.fn(
              (
                columns?: string,
                options?: { count?: string; head?: boolean }
              ) => {
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
              }
            ),
            update: organizationsUpdateMock,
          }
        }
        if (table === "modules") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  returns: setupModulesReturnsMock,
                }),
              }),
            }),
          }
        }
        if (table === "module_progress") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: moduleProgressMaybeSingleMock,
                }),
              }),
            }),
            upsert: moduleProgressUpsertMock,
          }
        }
        throw new Error(`Unexpected table lookup: ${table}`)
      }),
      rpc: rpcMock,
    })

    const form = new FormData()
    form.set("intentFocus", "build")
    form.set("onboardingMode", "workspace_setup")
    form.set("builderPlanTier", planTier)
    form.set("formationStatus", "approved")
    form.set("orgName", "Bright Futures Collective")
    form.set("orgSlug", "bright-futures-collective")
    form.set("firstName", "Ada")
    form.set("lastName", "Lovelace")
    form.set("personHandle", "ada-lovelace")

    const destination = await captureRedirect(() =>
      completeOnboardingAction(form)
    )

    expect(fetchLearningEntitlementsMock).toHaveBeenCalledTimes(planTier === "free" ? 0 : 1)
    expect(profilesUpsertMock).toHaveBeenCalled()
    expect(rpcMock).toHaveBeenCalledWith("claim_person_public_handle", {
      p_handle: "ada-lovelace",
    })
    expect(membershipsEqMock).toHaveBeenCalledWith("member_id", "user_123")
    expect(organizationsSlugCountQueryMock).toHaveBeenCalledWith(
      "user_id",
      "org_active"
    )
    expect(organizationsSelectMaybeSingleMock).toHaveBeenCalled()
    expect(organizationsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        public_slug: "bright-futures-collective",
        profile: expect.objectContaining({
          ...savedProfile,
          name: "Bright Futures Collective",
          formationStatus: "approved",
        }),
      })
    )
    expect(organizationsUpdateUserEqMock).toHaveBeenCalledWith(
      "user_id",
      "org_active"
    )
    expect(organizationsUpdateRevisionEqMock).toHaveBeenCalledWith(
      "updated_at",
      "revision-1"
    )
    expect(updateUserMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        onboarding_completed: true,
        workspace_onboarding_active: true,
        workspace_onboarding_completed_at: null,
        workspace_onboarding_stage: 2,
      }),
    })
    expect(moduleProgressUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_123",
        module_id: "organization_setup_module",
        status: "completed",
        completed_at: expect.any(String),
      }),
      { onConflict: "user_id,module_id" }
    )
    expect(destination).toBe(
      "/workspace?onboarding_flow=1&onboarding_stage=2&source=onboarding"
    )
  })

  it.each(["organization", "operations_support"] as const)(
    "sends paid %s builders to required workspace setup after entitlement recovery",
    async (builderPlanTier) => {
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
      form.set("builderPlanTier", builderPlanTier)
      form.set("firstName", "Ada")
      form.set("lastName", "Lovelace")

      const destination = await captureRedirect(() =>
        completeOnboardingAction(form)
      )

      expect(fetchLearningEntitlementsMock).toHaveBeenCalledWith({
        supabase: expect.any(Object),
        userId: "user_123",
        forceStripeSync: true,
      })
      expect(profilesUpsertMock).toHaveBeenCalled()
      expect(updateUserMock).toHaveBeenCalled()
      expect(updateUserMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          onboarding_completed: false,
          onboarding_completed_at: null,
          workspace_onboarding_active: false,
        }),
      })
      expect(destination).toBe("/workspace?source=onboarding_setup")
    }
  )
})
