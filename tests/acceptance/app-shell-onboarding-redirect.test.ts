import { describe, expect, it } from "vitest"

import { resolveAppShellOnboardingRedirectTarget } from "@/components/app-shell/onboarding-redirect"

describe("app shell onboarding redirect", () => {
  it("redirects onboarding-locked users from non-workspace dashboard routes", () => {
    expect(
      resolveAppShellOnboardingRedirectTarget({
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        isAdminContext: false,
        pathname: "/accelerator",
      }),
    ).toBe("/workspace?onboarding_flow=1&source=onboarding")
  })

  it("does not redirect once the user is already on workspace", () => {
    expect(
      resolveAppShellOnboardingRedirectTarget({
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        isAdminContext: false,
        pathname: "/workspace",
      }),
    ).toBeNull()
  })

  it("does not redirect admin context", () => {
    expect(
      resolveAppShellOnboardingRedirectTarget({
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        isAdminContext: true,
        pathname: "/admin",
      }),
    ).toBeNull()
  })

  it("redirects member onboarding users to find instead of workspace", () => {
    expect(
      resolveAppShellOnboardingRedirectTarget({
        onboardingLocked: true,
        onboardingIntentFocus: "find",
        isAdminContext: false,
        pathname: "/community",
      }),
    ).toBe("/find?member_onboarding=1&source=onboarding")
  })
})
