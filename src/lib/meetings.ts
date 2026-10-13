import type { Json } from "@/lib/supabase"

export const COACHING_INCLUDED_SESSION_LIMIT = 4

export type CoachingTier = "free" | "discounted" | "full"
export type CoachingCoachId = "joel" | "paula"

export const COACHING_COACHES: Array<{
  id: CoachingCoachId
  name: string
  title: string
  focus: string
  initials: string
  imageUrl: string
}> = [
  {
    id: "joel",
    name: "Joel",
    title: "Strategy coach",
    focus: "Strategy, systems, and next-step planning",
    initials: "J",
    imageUrl: "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Joel.png",
  },
  {
    id: "paula",
    name: "Paula",
    title: "Formation coach",
    focus: "Formation, operations, and coaching support",
    initials: "P",
    imageUrl: "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Paula.png",
  },
]

export function normalizeCoachingCoachId(input: unknown): CoachingCoachId {
  return input === "paula" ? "paula" : "joel"
}

export function resolveCoachingTier(options: {
  hasIncludedCoaching: boolean
  freeSessionsUsed: number
  hasDiscountAccess?: boolean
}): CoachingTier {
  if (options.hasIncludedCoaching && options.freeSessionsUsed < COACHING_INCLUDED_SESSION_LIMIT) {
    return "free"
  }
  return options.hasDiscountAccess ? "discounted" : "full"
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
