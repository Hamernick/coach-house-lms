import type { Json } from "@/lib/supabase"

type SubscriptionLike = {
  status: string | null
  metadata?: Json | null
}

export function hasPaidTeamAccessFromSubscription(subscription: SubscriptionLike | null) {
  if (!subscription) return false

  const status = subscription.status ?? null
  const active = status === "active" || status === "trialing"
  const metadata = (subscription.metadata ?? null) as Record<string, string | null> | null
  const planName = typeof metadata?.planName === "string" ? metadata.planName.toLowerCase() : ""

  return active && !planName.includes("free")
}
