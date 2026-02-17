import type { Json } from "@/lib/supabase"

export type PaidPlanTier = "organization" | "operations_support"
export type PricingPlanTier = "free" | PaidPlanTier

type SubscriptionLike = {
  status: string | null
  metadata?: Json | null
}

function asRecord(value: Json | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function resolvePaidPlanTierFromMetadata(metadata: Json | null | undefined): PaidPlanTier | null {
  const source = asRecord(metadata)
  if (!source) return null

  const explicitTier =
    typeof source.plan_tier === "string" ? source.plan_tier.trim().toLowerCase() : ""
  if (explicitTier === "operations_support") return "operations_support"
  if (explicitTier === "organization") return "organization"

  const planName = typeof source.planName === "string" ? source.planName.trim().toLowerCase() : ""
  if (planName.includes("operations")) return "operations_support"
  if (planName.length > 0) return "organization"

  return null
}

export function resolvePricingPlanTier(subscription: SubscriptionLike | null | undefined): PricingPlanTier {
  if (!subscription) return "free"

  const status = subscription.status ?? null
  const isPaidStatus =
    status === "active" || status === "trialing" || status === "past_due" || status === "incomplete"
  if (!isPaidStatus) return "free"

  return resolvePaidPlanTierFromMetadata(subscription.metadata ?? null) ?? "organization"
}

