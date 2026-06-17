import type { SupabaseClient } from "@supabase/supabase-js"

import { resolvePaidPlanTierFromMetadata } from "@/lib/billing/plan-tier"
import type { Json } from "@/lib/supabase"
import type { Database } from "@/lib/supabase/types"

type SubscriptionLike = {
  status: string | null
  metadata?: Json | null
  stripe_subscription_id?: string | null
}

export function hasPaidTeamAccessFromSubscription(subscription: SubscriptionLike | null) {
  if (!subscription) return false

  const status = subscription.status ?? null
  const active = status === "active" || status === "trialing"
  return active && resolvePaidPlanTierFromMetadata(subscription.metadata ?? null) !== null
}

export function hasBillingCancellationRiskFromSubscription(
  subscription: SubscriptionLike | null,
) {
  if (!subscription) return false

  const status = subscription.status ?? null
  const billingMayStillRenew =
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "incomplete"
  const subscriptionId =
    typeof subscription.stripe_subscription_id === "string"
      ? subscription.stripe_subscription_id.trim()
      : ""

  return (
    billingMayStillRenew &&
    subscriptionId.length > 0 &&
    !subscriptionId.startsWith("stub_") &&
    resolvePaidPlanTierFromMetadata(subscription.metadata ?? null) !== null
  )
}

export async function resolveAccountBillingCancellationRisk({
  userId,
  supabase,
}: {
  userId: string
  supabase: SupabaseClient<Database, "public">
}) {
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("status, metadata, stripe_subscription_id, created_at")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due", "incomplete"])
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      status: string | null
      metadata: Json | null
      stripe_subscription_id: string | null
    }>()

  if (error) {
    return { error: "Unable to load subscription status." } as const
  }

  return {
    hasBillingCancellationRisk:
      hasBillingCancellationRiskFromSubscription(subscription ?? null),
  } as const
}

export async function resolvePaidTeamAccessForOrgSubscription({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: SupabaseClient<Database, "public">
}) {
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("status, metadata, created_at")
    .eq("user_id", orgId)
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; metadata: Json | null }>()

  if (error) return { error: "Unable to load subscription status." } as const

  return {
    hasPaidTeamAccess: hasPaidTeamAccessFromSubscription(subscription ?? null),
  } as const
}
