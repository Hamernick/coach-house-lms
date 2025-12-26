import type { Json } from "@/lib/supabase"

export const FREE_TIER_MEETING_LIMIT = 4

export function isFreeTierSubscription(subscription: { status: string | null; metadata?: Json | null } | null) {
  if (!subscription) return true
  const status = subscription.status ?? ""
  const active = status === "active" || status === "trialing"
  const metadata = (subscription.metadata ?? null) as Record<string, string | null> | null
  const planName = metadata?.planName?.toLowerCase() ?? ""
  if (planName.includes("free")) return true
  return !active
}
