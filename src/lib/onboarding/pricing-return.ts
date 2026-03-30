import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import type { OnboardingFlowMode } from "@/components/onboarding/onboarding-dialog/types"

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
  if (!isOnboardingPricingSource(searchParams)) return false
  if (mode !== "post_signup_access") return false
  if (searchParams.get("cancelled") === "true") return false
  if (typeof searchParams.get("checkout_error") === "string") return false
  return builderPlanTier === "organization" || builderPlanTier === "operations_support"
}
