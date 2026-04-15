import { describe, expect, it } from "vitest"

import { shouldAutoSubmitPaidOnboardingPricingReturn } from "@/lib/onboarding/pricing-return"
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

  it("auto-submits the paid post-signup builder return without requiring a checkout success query", () => {
    const searchParams = createSearchParams("source=onboarding_pricing")

    expect(
      shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams,
        mode: "post_signup_access",
        builderPlanTier: "organization",
      }),
    ).toBe(true)
  })

  it("auto-submits a paid post-signup pricing step even after the user lands on the generic onboarding route", () => {
    const searchParams = createSearchParams("source=onboarding")

    expect(
      shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams,
        mode: "post_signup_access",
        builderPlanTier: "organization",
      }),
    ).toBe(true)
  })

  it("recovers paid post-signup pricing steps even when stale checkout error params remain in the URL", () => {
    const failedSearchParams = createSearchParams(
      "source=onboarding&checkout_error=checkout_failed",
    )
    const cancelledSearchParams = createSearchParams(
      "source=onboarding_pricing&cancelled=true",
    )

    expect(
      shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams: failedSearchParams,
        mode: "post_signup_access",
        builderPlanTier: "organization",
      }),
    ).toBe(true)
    expect(
      shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams: cancelledSearchParams,
        mode: "post_signup_access",
        builderPlanTier: "operations_support",
      }),
    ).toBe(true)
  })

  it("does not auto-submit non-onboarding sources even when a paid plan is already active", () => {
    const searchParams = createSearchParams("source=billing")

    expect(
      shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams,
        mode: "post_signup_access",
        builderPlanTier: "organization",
      }),
    ).toBe(false)
  })

  it("does not auto-submit onboarding pricing returns outside the post-signup access flow", () => {
    const searchParams = createSearchParams("source=onboarding_pricing")

    expect(
      shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams,
        mode: "full",
        builderPlanTier: "organization",
      }),
    ).toBe(false)
  })
})
