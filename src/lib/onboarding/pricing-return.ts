import type { PricingPlanTier } from "@/lib/billing/plan-tier"

type OnboardingFlowMode = "full" | "post_signup_access" | "workspace_setup"

type SearchParamReader = {
  get: (key: string) => string | null
}

export const ONBOARDING_PRICING_RETURN = "/onboarding?source=onboarding_pricing"

export function isOnboardingPricingSource(searchParams: SearchParamReader) {
  return searchParams.get("source") === "onboarding_pricing"
}

export function shouldAutoSubmitPaidOnboardingPricingReturn({
  searchParams,
  mode,
  builderPlanTier,
}: {
  searchParams: SearchParamReader
  mode: OnboardingFlowMode
  builderPlanTier: PricingPlanTier
}) {
  if (mode !== "post_signup_access") return false
  const onboardingSource = searchParams.get("source")
  if (
    onboardingSource !== null &&
    onboardingSource !== "onboarding" &&
    onboardingSource !== "onboarding_pricing"
  ) {
    return false
  }
  return builderPlanTier === "organization" || builderPlanTier === "operations_support"
}
