import { describe, expect, it } from "vitest"

import {
  resolveOnboardingPricingEntryStepId,
  resolveOnboardingPricingPlanOverride,
} from "@/components/onboarding/onboarding-dialog/helpers"

function createSearchParams(value: string) {
  return new URLSearchParams(value)
}

describe("onboarding pricing return helpers", () => {
  it("keeps onboarding pricing entry on the pricing step before checkout succeeds", () => {
    const searchParams = createSearchParams("source=onboarding_pricing")

    expect(resolveOnboardingPricingEntryStepId(searchParams)).toBe("pricing")
    expect(resolveOnboardingPricingPlanOverride(searchParams)).toBeNull()
  })

  it("advances onboarding past pricing after a successful return", () => {
    const searchParams = createSearchParams(
      "source=onboarding_pricing&checkout=success&plan=operations_support",
    )

    expect(resolveOnboardingPricingEntryStepId(searchParams)).toBe("org")
    expect(resolveOnboardingPricingPlanOverride(searchParams)).toBe("operations_support")
  })

  it("keeps successful pricing returns on the pricing step during post-signup access onboarding", () => {
    const searchParams = createSearchParams(
      "source=onboarding_pricing&checkout=success&plan=organization",
    )

    expect(resolveOnboardingPricingEntryStepId(searchParams, "post_signup_access")).toBe("pricing")
    expect(resolveOnboardingPricingPlanOverride(searchParams)).toBe("organization")
  })

  it("defaults successful onboarding pricing returns to the organization plan", () => {
    const searchParams = createSearchParams(
      "source=onboarding_pricing&checkout=success",
    )

    expect(resolveOnboardingPricingPlanOverride(searchParams)).toBe("organization")
  })
})
