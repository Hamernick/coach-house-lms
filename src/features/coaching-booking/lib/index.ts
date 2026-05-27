import {
  COACHING_COACHES,
  COACHING_INCLUDED_SESSION_LIMIT,
  normalizeCoachingCoachId,
  type CoachingCoachId,
} from "@/lib/meetings"
import type { CoachingCoach, CoachingPriceTier } from "../types"

export const COACHING_PATH = "/coaching"
export const COACHING_SESSION_MINUTES = 60
export const COACHING_HOLD_MINUTES = 15
export const COACHING_DEFAULT_TIMEZONE = "America/New_York"
export const COACHING_JOINT_PRIMARY_COACH_ID = "joel" satisfies CoachingCoachId
export const COACHING_JOINT_COACH_IDS = ["joel", "paula"] satisfies CoachingCoachId[]
export const COACHING_JOINT_COACH_LABEL = "Joel & Paula"

export const COACHING_BOOKING_STATUSES = [
  "held",
  "pending_payment",
  "confirmed",
  "canceled",
  "rescheduled",
] as const

export const COACHING_PRICE_TIERS = ["included", "discounted", "full"] as const

export function listDefaultCoaches(): CoachingCoach[] {
  return COACHING_COACHES.map((coach) => ({
    id: coach.id,
    name: coach.name,
    title: coach.title,
    focus: coach.focus,
    initials: coach.initials,
    imageUrl: coach.imageUrl,
  }))
}

export function normalizeCoachId(input: unknown): CoachingCoachId {
  return normalizeCoachingCoachId(input)
}

export function normalizePriceTier(input: unknown): CoachingPriceTier {
  if (input === "included" || input === "discounted") return input
  return "full"
}

export function isManageableBookingStatus(status: string) {
  return status === "confirmed" || status === "pending_payment" || status === "held"
}

export function resolveCreditPriceTier({
  availableCredits,
  hasDiscountAccess,
}: {
  availableCredits: number
  hasDiscountAccess: boolean
}): CoachingPriceTier {
  if (availableCredits > 0) return "included"
  return hasDiscountAccess ? "discounted" : "full"
}

export function getIncludedCoachingAllowance(hasIncludedCoaching: boolean) {
  return hasIncludedCoaching ? COACHING_INCLUDED_SESSION_LIMIT : 0
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export function isValidFutureDate(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && parsed > Date.now()
}

export function toSlotId(coachId: CoachingCoachId, startsAt: string) {
  return `${coachId}:${startsAt}`
}

export function formatIcsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

export function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}
