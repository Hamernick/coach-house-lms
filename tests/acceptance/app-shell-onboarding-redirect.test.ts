import { describe, expect, it } from "vitest"

import { resolveAppShellOnboardingRedirectTarget } from "@/components/app-shell/onboarding-redirect"

describe("app shell onboarding redirect", () => {
  it("redirects onboarding-locked builder users to the dedicated onboarding route", () => {
    expect(
      resolveAppShellOnboardingRedirectTarget({
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        isAdminContext: false,
        pathname: "/accelerator",
      }),
    ).toBe("/onboarding?source=onboarding")
  })

  it("does not redirect once the user is already on onboarding", () => {
    expect(
      resolveAppShellOnboardingRedirectTarget({
        onboardingLocked: true,
        onboardingIntentFocus: "build",
        isAdminContext: false,
        pathname: "/onboarding",
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
