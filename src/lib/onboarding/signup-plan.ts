import type { PaidPlanTier } from "@/lib/billing/plan-tier"
import { ONBOARDING_PRICING_RETURN } from "@/lib/onboarding/pricing-return"

export type SignupBuilderPlanTier = "free" | PaidPlanTier
export type SignupIntentFocus = "build" | "find" | "fund" | "support"

export function resolveSignupBuilderPlanTier(
  value: unknown,
): SignupBuilderPlanTier | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()

  if (
    normalized === "free" ||
    normalized === "formation" ||
    normalized === "individual"
  ) {
    return "free"
  }
  if (normalized === "organization") return "organization"
  if (normalized === "operations" || normalized === "operations_support") {
    return "operations_support"
  }

  return null
}

export function resolveSignupBuilderPlanTierFromRedirect(
  value: string | null | undefined,
): SignupBuilderPlanTier | null {
  if (!value) return null

  try {
    const url = new URL(value, "https://coachhouse.app")
    if (url.pathname !== "/api/stripe/checkout") return null
    return resolveSignupBuilderPlanTier(url.searchParams.get("plan"))
  } catch {
    return null
  }
}

export function resolveSignupIntentFocus(
  value: unknown,
): SignupIntentFocus | null {
  if (
    value === "build" ||
    value === "find" ||
    value === "fund" ||
    value === "support"
  ) {
    return value
  }
  return null
}

export function buildPostSignupBuilderRedirect({
  planTier,
  source,
}: {
  planTier: SignupBuilderPlanTier | null
  source: string
}) {
  if (planTier === "organization" || planTier === "operations_support") {
    const params = new URLSearchParams({
      plan: planTier,
      source,
      redirect: ONBOARDING_PRICING_RETURN,
      cancel: ONBOARDING_PRICING_RETURN,
      context: "onboarding_builder",
    })
    return `/api/stripe/checkout?${params.toString()}`
  }

  const params = new URLSearchParams({ source })
  if (planTier === "free") {
    params.set("plan", "free")
  }
  return `/onboarding?${params.toString()}`
}
