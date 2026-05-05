import type { SupabaseClient } from "@supabase/supabase-js"

import type { Json } from "@/lib/supabase"
import type { Database } from "@/lib/supabase/types"

type SubscriptionLike = {
  status: string | null
  metadata?: Json | null
}

export function hasPaidTeamAccessFromSubscription(subscription: SubscriptionLike | null) {
  if (!subscription) return false

  const status = subscription.status ?? null
  const active = status === "active" || status === "trialing"
  const metadata = (subscription.metadata ?? null) as Record<string, string | null> | null
  const planHints = [metadata?.planName, metadata?.plan_tier, metadata?.tier]
    .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
    .join(" ")

  return active && !planHints.includes("free")
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
