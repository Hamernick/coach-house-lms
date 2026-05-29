import type { SupabaseClient } from "@supabase/supabase-js"

import { resolvePaidPlanTierFromMetadata } from "@/lib/billing/plan-tier"
import { isStripeCoachingCheckoutConfigured } from "@/lib/billing/stripe-runtime"
import { resolveDevtoolsAudience } from "@/lib/devtools/audience"
import { getCoachingRemainingSessions } from "@/lib/meetings"
import { createSupabaseAdminClient, type Database, type Json } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  COACHING_DEFAULT_TIMEZONE,
  COACHING_JOINT_COACH_LABEL,
  COACHING_JOINT_PRIMARY_COACH_ID,
  getIncludedCoachingAllowance,
  isManageableBookingStatus,
  listDefaultCoaches,
  normalizeCoachId,
  normalizePriceTier,
  resolveCreditPriceTier,
} from "../lib"
import type {
  CoachingBookingPageData,
  CoachingBookingRecord,
  CoachingCoach,
  CoachingCoachId,
  CoachingCreditSummary,
  CoachingParticipant,
} from "../types"
import { isGoogleCoachingConfigured } from "./google-calendar"

type AppSupabase = SupabaseClient<Database>

type SubscriptionRow = {
  status: string
  metadata: Json | null
}

type LedgerRow = {
  quantity: number
  source: string
  expires_at: string | null
}

type BookingRow = {
  id: string
  coach_id: string
  status: string
  price_tier: string
  starts_at: string
  ends_at: string
  timezone: string
  google_meet_url: string | null
  google_event_html_link: string | null
}

type CurrentUserProfileRow = {
  full_name: string | null
  avatar_url: string | null
  email: string | null
}

function metadataRecord(metadata: Json | null): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {}
}

function subscriptionIsAcceleratorWithCoaching(subscription: SubscriptionRow) {
  const metadata = metadataRecord(subscription.metadata)
  if (metadata.kind !== "accelerator") return false
  if (metadata.coaching_included === "true") return true
  if (metadata.accelerator_variant === "without_coaching") return false
  return metadata.accelerator_variant === "with_coaching"
}

function subscriptionIsOperationsSupport(subscription: SubscriptionRow) {
  return resolvePaidPlanTierFromMetadata(subscription.metadata) === "operations_support"
}

function normalizedText(value: string | null | undefined) {
  const text = value?.trim() ?? ""
  return text.length > 0 ? text : null
}

function initialsFromName(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
  return initials || "U"
}

export async function loadCoachingCurrentUserProfile({
  supabase,
  userId,
  userEmail,
}: {
  supabase: AppSupabase
  userId: string
  userEmail?: string | null
}): Promise<CoachingParticipant> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", userId)
    .maybeSingle<CurrentUserProfileRow>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load coaching attendee profile.")
  }

  const email = normalizedText(data?.email) ?? normalizedText(userEmail)
  const name = normalizedText(data?.full_name) ?? email?.split("@")[0] ?? "You"

  return {
    name,
    initials: initialsFromName(name),
    imageUrl: normalizedText(data?.avatar_url),
  }
}

export async function listCoachingCoaches(supabase: AppSupabase): Promise<CoachingCoach[]> {
  const { data, error } = await supabase
    .from("coaching_coaches")
    .select("id, display_name, title, focus, avatar_url, active, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .returns<
      Array<{
        id: string
        display_name: string
        title: string
        focus: string
        avatar_url: string | null
      }>
    >()

  if (error) {
    const code = (error as { code?: string }).code
    if (code === "42P01") return listDefaultCoaches()
    throw supabaseErrorToError(error, "Unable to load coaching coaches.")
  }

  const defaults = listDefaultCoaches()
  const byId = new Map(defaults.map((coach) => [coach.id, coach]))
  return (data ?? []).map((row) => {
    const id = normalizeCoachId(row.id)
    const fallback = byId.get(id) ?? defaults[0]
    return {
      id,
      name: row.display_name,
      title: row.title,
      focus: row.focus,
      initials: fallback.initials,
      imageUrl: row.avatar_url ?? fallback.imageUrl,
    }
  })
}

export async function resolveCoachingCreditSummary({
  supabase,
  userId,
  orgId,
}: {
  supabase: AppSupabase
  userId: string
  orgId: string
}): Promise<CoachingCreditSummary> {
  const purchaseResult = await supabase
    .from("accelerator_purchases")
    .select("coaching_included")
    .in("user_id", Array.from(new Set([userId, orgId])))
    .eq("status", "active")
    .returns<Array<{ coaching_included: boolean | null }>>()

  const purchaseIncludesCoaching =
    !purchaseResult.error &&
    (purchaseResult.data ?? []).some((purchase) => purchase.coaching_included !== false)

  const subscriptionsResult = await supabase
    .from("subscriptions")
    .select("status, metadata")
    .in("user_id", Array.from(new Set([userId, orgId])))
    .in("status", ["active", "trialing"])
    .returns<SubscriptionRow[]>()

  const subscriptions = subscriptionsResult.error ? [] : subscriptionsResult.data ?? []
  const subscriptionIncludesCoaching = subscriptions.some(subscriptionIsAcceleratorWithCoaching)
  const operationsSupport = subscriptions.some(subscriptionIsOperationsSupport)
  const hasIncludedCoaching = purchaseIncludesCoaching || subscriptionIncludesCoaching

  const ledgerResult = await supabase
    .from("coaching_credit_ledger")
    .select("quantity, source, expires_at")
    .eq("org_id", orgId)
    .returns<LedgerRow[]>()

  const ledgerRows = ledgerResult.error ? [] : ledgerResult.data ?? []
  const now = Date.now()
  const ledgerBalance = ledgerRows.reduce((sum, row) => {
    if (row.expires_at && Date.parse(row.expires_at) < now) return sum
    return sum + row.quantity
  }, 0)
  const consumed = Math.abs(
    ledgerRows
      .filter((row) => row.source === "booking" && row.quantity < 0)
      .reduce((sum, row) => sum + row.quantity, 0),
  )
  const includedAllowance = getIncludedCoachingAllowance(hasIncludedCoaching)
  const available = Math.max(0, includedAllowance + ledgerBalance)
  const hasDiscountAccess = operationsSupport

  return {
    available,
    includedAllowance,
    ledgerBalance,
    consumed,
    priceTier: resolveCreditPriceTier({ availableCredits: available, hasDiscountAccess }),
    hasDiscountAccess,
  }
}

export async function listUpcomingCoachingBookings({
  supabase,
  orgId,
}: {
  supabase: AppSupabase
  orgId: string
}): Promise<CoachingBookingRecord[]> {
  const { data, error } = await supabase
    .from("coaching_bookings")
    .select("id, coach_id, status, price_tier, starts_at, ends_at, timezone, google_meet_url, google_event_html_link")
    .eq("org_id", orgId)
    .eq("status", "confirmed")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(6)
    .returns<BookingRow[]>()

  if (error) {
    const code = (error as { code?: string }).code
    if (code === "42P01") return []
    throw supabaseErrorToError(error, "Unable to load coaching bookings.")
  }

  return (data ?? []).map((booking) => {
    const coachId = normalizeCoachId(booking.coach_id)
    return {
      id: booking.id,
      coachId,
      coachName: COACHING_JOINT_COACH_LABEL,
      status: isManageableBookingStatus(booking.status) ? booking.status : "held",
      priceTier: normalizePriceTier(booking.price_tier),
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      timezone: booking.timezone,
      googleMeetUrl: booking.google_meet_url,
      googleEventHtmlLink: booking.google_event_html_link,
      canManage: Date.parse(booking.starts_at) > Date.now(),
    }
  })
}

export async function cancelPendingCoachingCheckoutReturn({
  bookingId,
  userId,
  orgId,
}: {
  bookingId: string
  userId: string
  orgId: string
}) {
  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from("coaching_bookings")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_reason: "Stripe checkout canceled before payment.",
    })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .eq("status", "pending_payment")

  if (error) {
    throw supabaseErrorToError(error, "Unable to cancel pending coaching checkout.")
  }
}

export async function loadCoachingBookingPageData({
  supabase,
  userId,
  orgId,
  userEmail,
  timezone = COACHING_DEFAULT_TIMEZONE,
}: {
  supabase: AppSupabase
  userId: string
  orgId: string
  userEmail?: string | null
  timezone?: string
}): Promise<CoachingBookingPageData> {
  const [coaches, creditSummary, upcomingBookings, audience, currentUser] = await Promise.all([
    listCoachingCoaches(supabase),
    resolveCoachingCreditSummary({ supabase, userId, orgId }),
    listUpcomingCoachingBookings({ supabase, orgId }),
    resolveDevtoolsAudience({ supabase, userId }),
    loadCoachingCurrentUserProfile({ supabase, userId, userEmail }),
  ])
  const selectedCoachId = COACHING_JOINT_PRIMARY_COACH_ID
  const paidPriceTier = creditSummary.priceTier === "discounted" ? "discounted" : "full"
  const paymentConfigured =
    creditSummary.priceTier === "included" ||
    isStripeCoachingCheckoutConfigured({
      isTester: audience.isTester,
      priceTier: paidPriceTier,
    })

  return {
    coaches,
    selectedCoachId,
    currentUser,
    creditSummary,
    upcomingBookings,
    timezone,
    calendarConfigured: isGoogleCoachingConfigured(),
    paymentConfigured,
  }
}

export async function listLocalBusyWindows({
  supabase,
  coachId,
  from,
  to,
}: {
  supabase: AppSupabase
  coachId: CoachingCoachId
  from: string
  to: string
}) {
  const { data, error } = await supabase
    .from("coaching_bookings")
    .select("starts_at, ends_at, status, hold_expires_at")
    .eq("coach_id", coachId)
    .in("status", ["held", "pending_payment", "confirmed"])
    .lt("starts_at", to)
    .gt("ends_at", from)
    .returns<Array<{ starts_at: string; ends_at: string; status: string; hold_expires_at: string | null }>>()

  if (error) {
    const code = (error as { code?: string }).code
    if (code === "42P01") return []
    throw supabaseErrorToError(error, "Unable to load local coaching holds.")
  }

  const now = Date.now()
  return (data ?? [])
    .filter((booking) => {
      if (booking.status === "confirmed") return true
      if (!booking.hold_expires_at) return true
      return Date.parse(booking.hold_expires_at) > now
    })
    .map((booking) => ({ startsAt: booking.starts_at, endsAt: booking.ends_at }))
}

export function getRemainingIncludedSessions(summary: CoachingCreditSummary) {
  return getCoachingRemainingSessions(summary.consumed)
}
