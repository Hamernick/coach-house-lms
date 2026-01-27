import type { Json } from "@/lib/supabase"

export const COACHING_INCLUDED_SESSION_LIMIT = 4

export type CoachingTier = "free" | "discounted" | "full"

export function resolveCoachingTier(options: {
  hasAccelerator: boolean
  freeSessionsUsed: number
}): CoachingTier {
  if (!options.hasAccelerator) return "full"
  if (options.freeSessionsUsed < COACHING_INCLUDED_SESSION_LIMIT) return "free"
  return "discounted"
}

export function getCoachingRemainingSessions(freeSessionsUsed: number) {
  return Math.max(0, COACHING_INCLUDED_SESSION_LIMIT - freeSessionsUsed)
}

export function isFreeTierSubscription(subscription: { status: string | null; metadata?: Json | null } | null) {
  if (!subscription) return true
  const status = subscription.status ?? ""
  const active = status === "active" || status === "trialing"
  const metadata = (subscription.metadata ?? null) as Record<string, string | null> | null
  const planName = metadata?.planName?.toLowerCase() ?? ""
  if (planName.includes("free")) return true
  return !active
}
