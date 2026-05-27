import type { SupabaseClient } from "@supabase/supabase-js"

import { createNotification } from "@/lib/notifications"
import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { trackUserJourneyMilestone } from "@/lib/user-journey"
import {
  COACHING_JOINT_COACH_IDS,
  COACHING_JOINT_COACH_LABEL,
  normalizeCoachId,
  normalizePriceTier,
} from "../lib"
import type { CoachingCoachId } from "../types"
import { createGoogleCoachingEvent, getGoogleCoachingParticipantEmail } from "./google-calendar"

type AdminClient = SupabaseClient<Database>

type BookingForConfirmation = {
  id: string
  org_id: string
  user_id: string
  coach_id: string
  status: string
  price_tier: string
  starts_at: string
  ends_at: string
  timezone: string
  google_event_id: string | null
  google_meet_url: string | null
}

async function insertLedgerEntryIfMissing({
  admin,
  booking,
  source,
  quantity,
  note,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
}: {
  admin: AdminClient
  booking: BookingForConfirmation
  source: "purchase" | "booking" | "cancellation"
  quantity: number
  note: string
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
}) {
  const { data: existing, error: existingError } = await admin
    .from("coaching_credit_ledger")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("source", source)
    .maybeSingle<{ id: string }>()

  if (existingError) {
    throw supabaseErrorToError(existingError, "Unable to inspect coaching credit ledger.")
  }

  if (existing) return

  const { error } = await admin.from("coaching_credit_ledger").insert({
    org_id: booking.org_id,
    user_id: booking.user_id,
    booking_id: booking.id,
    source,
    quantity,
    note,
    stripe_checkout_session_id: stripeCheckoutSessionId ?? null,
    stripe_payment_intent_id: stripePaymentIntentId ?? null,
  })

  if (error) {
    throw supabaseErrorToError(error, "Unable to update coaching credit ledger.")
  }
}

export async function confirmCoachingBooking({
  admin,
  booking,
  attendeeEmail,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  stripeCustomerId,
}: {
  admin: AdminClient
  booking: BookingForConfirmation
  attendeeEmail: string | null
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
  stripeCustomerId?: string | null
}) {
  if (booking.status === "confirmed" && booking.google_event_id) {
    return booking
  }

  const coachId = normalizeCoachId(booking.coach_id)
  const priceTier = normalizePriceTier(booking.price_tier)
  const internalAttendeeEmails = COACHING_JOINT_COACH_IDS
    .filter((participantId) => participantId !== coachId)
    .map((participantId) => getGoogleCoachingParticipantEmail(participantId))
    .filter((email): email is string => Boolean(email))
  const calendarEvent = await createGoogleCoachingEvent({
    coachId,
    summary: `Coach House session with ${COACHING_JOINT_COACH_LABEL}`,
    description: `Coach House coaching session with ${COACHING_JOINT_COACH_LABEL} booked inside the platform.`,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    timezone: booking.timezone,
    attendeeEmail,
    internalAttendeeEmails,
  })

  if (priceTier !== "included") {
    await insertLedgerEntryIfMissing({
      admin,
      booking,
      source: "purchase",
      quantity: 1,
      note: "Paid coaching session purchased through Stripe.",
      stripeCheckoutSessionId,
      stripePaymentIntentId,
    })
  }

  await insertLedgerEntryIfMissing({
    admin,
    booking,
    source: "booking",
    quantity: -1,
    note:
      priceTier === "included"
        ? "Included coaching credit consumed by confirmed booking."
        : "Paid coaching credit consumed by confirmed booking.",
    stripeCheckoutSessionId,
    stripePaymentIntentId,
  })

  const now = new Date().toISOString()
  const { data: updated, error } = await admin
    .from("coaching_bookings")
    .update({
      status: "confirmed",
      confirmed_at: now,
      hold_expires_at: null,
      stripe_checkout_session_id: stripeCheckoutSessionId ?? undefined,
      stripe_payment_intent_id: stripePaymentIntentId ?? undefined,
      stripe_customer_id: stripeCustomerId ?? undefined,
      google_event_id: calendarEvent.googleEventId,
      google_event_html_link: calendarEvent.googleEventHtmlLink,
      google_meet_url: calendarEvent.googleMeetUrl,
    })
    .eq("id", booking.id)
    .select("id, org_id, user_id, coach_id, status, price_tier, starts_at, ends_at, timezone, google_event_id, google_meet_url")
    .single<BookingForConfirmation>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to confirm coaching booking.")
  }

  const notifyResult = await createNotification(admin as never, {
    userId: booking.user_id,
    orgId: booking.org_id,
    title: "Coaching session confirmed",
    description: "Your Coach House session is booked. The Meet link is ready in Coaching.",
    href: "/coaching",
    tone: "success",
    type: "coaching_booking_confirmed",
    actorId: booking.user_id,
    metadata: {
      bookingId: booking.id,
      coachId,
      startsAt: booking.starts_at,
      priceTier,
    },
  })
  if ("error" in notifyResult) {
    console.error("Failed to create coaching confirmation notification", notifyResult.error)
  }

  await trackUserJourneyMilestone({
    userId: booking.user_id,
    orgId: booking.org_id,
    eventName: "coaching_schedule_opened",
    journey: "coaching",
    source: "coaching_booking",
    surface: "coaching",
    checkpoint: "first_coaching_schedule_opened",
    metadata: {
      bookingId: booking.id,
      coachId,
      startsAt: booking.starts_at,
      priceTier,
      hasMeetLink: Boolean(calendarEvent.googleMeetUrl),
    },
  })

  return updated
}

export async function loadCoachingBookingForConfirmation({
  admin,
  bookingId,
}: {
  admin: AdminClient
  bookingId: string
}) {
  const { data, error } = await admin
    .from("coaching_bookings")
    .select("id, org_id, user_id, coach_id, status, price_tier, starts_at, ends_at, timezone, google_event_id, google_meet_url")
    .eq("id", bookingId)
    .maybeSingle<BookingForConfirmation>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load coaching booking.")
  }

  return data
}

export async function restoreBookingCredit({
  admin,
  booking,
}: {
  admin: AdminClient
  booking: BookingForConfirmation
}) {
  const { data: consumedCredit, error } = await admin
    .from("coaching_credit_ledger")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("source", "booking")
    .maybeSingle<{ id: string }>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to inspect consumed coaching credit.")
  }
  if (!consumedCredit) return

  await insertLedgerEntryIfMissing({
    admin,
    booking,
    source: "cancellation",
    quantity: 1,
    note: "Coaching credit restored after cancellation.",
  })
}

export function resolveCoachDisplayName(_coachId: CoachingCoachId) {
  return COACHING_JOINT_COACH_LABEL
}
