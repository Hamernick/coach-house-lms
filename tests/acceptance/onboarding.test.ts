import { beforeEach, describe, expect, it, vi } from "vitest"

import { captureRedirect, redirectMock, resetTestMocks } from "./test-utils"

describe("onboarding gate", () => {
  beforeEach(() => {
    resetTestMocks()
    vi.resetModules()
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
})
