import { describe, expect, it } from "vitest"

import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"

describe("onboarding defaults", () => {
  it("derives workspace onboarding defaults from user metadata and org profile", () => {
    const defaults = buildOnboardingFlowDefaults({
      userId: "user-1",
      email: "owner@example.com",
      displayName: "Jordan Rivers",
      avatarUrl: "https://example.com/avatar.png",
      userMetadata: {
        onboarding_intent_focus: "build",
        onboarding_role_interest: "operator",
        marketing_opt_in: true,
        newsletter_opt_in: false,
      },
      orgProfile: {
        name: "Bright Futures Collective",
        formationStatus: "in_progress",
        email: "team@brightfutures.org",
        linkedin: "https://linkedin.com/company/bright-futures",
        org_people: [
          {
            id: "user-1",
            email: "owner@example.com",
            title: "Founder",
          },
        ],
      },
      orgSlug: "bright-futures",
    })

    expect(defaults.defaultOrgName).toBe("Bright Futures Collective")
    expect(defaults.defaultOrgSlug).toBe("bright-futures")
    expect(defaults.defaultFormationStatus).toBe("in_progress")
    expect(defaults.defaultIntentFocus).toBe("build")
    expect(defaults.defaultRoleInterest).toBe("operator")
    expect(defaults.defaultFirstName).toBe("Jordan")
    expect(defaults.defaultLastName).toBe("Rivers")
    expect(defaults.defaultPublicEmail).toBe("team@brightfutures.org")
    expect(defaults.defaultTitle).toBe("Founder")
    expect(defaults.defaultLinkedin).toBe("https://linkedin.com/company/bright-futures")
    expect(defaults.defaultAvatarUrl).toBe("https://example.com/avatar.png")
    expect(defaults.defaultOptInUpdates).toBe(true)
    expect(defaults.defaultNewsletterOptIn).toBe(false)
  })
})
