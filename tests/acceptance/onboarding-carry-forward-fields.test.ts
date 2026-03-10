import { describe, expect, it } from "vitest"

import { buildOnboardingCarryForwardFieldMap } from "@/components/onboarding/onboarding-dialog/state-helpers"

describe("onboarding carry-forward field map", () => {
  it("includes the latest org and account values for final submit", () => {
    const fieldMap = buildOnboardingCarryForwardFieldMap({
      intentFocus: "build",
      roleInterest: "operator",
      formationStatus: "approved",
      organizationValues: {
        orgName: "Bright Futures Collective",
        orgSlug: "bright-futures-collective",
      },
      accountValues: {
        firstName: "Caleb",
        lastName: "Hamernick",
        phone: "773-333-3333",
        publicEmail: "contact@daerdy.com",
        title: "Founder",
        linkedin: "linkedin.com/in/caleb",
        optInUpdates: true,
        newsletterOptIn: false,
      },
    })

    expect(fieldMap).toEqual({
      intentFocus: "build",
      roleInterest: "operator",
      formationStatus: "approved",
      orgName: "Bright Futures Collective",
      orgSlug: "bright-futures-collective",
      firstName: "Caleb",
      lastName: "Hamernick",
      phone: "773-333-3333",
      publicEmail: "contact@daerdy.com",
      title: "Founder",
      linkedin: "linkedin.com/in/caleb",
      optInUpdates: "on",
    })
  })
})
