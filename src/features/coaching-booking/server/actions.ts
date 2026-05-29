"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { resolveStripePriceIdForCoaching, resolveStripeRuntimeConfigForCoaching } from "@/lib/billing/stripe-runtime"
import { env } from "@/lib/env"
import { resolveDevtoolsAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { trackUserJourneyMilestone } from "@/lib/user-journey"
import {
  addMinutes,
  COACHING_HOLD_MINUTES,
  COACHING_JOINT_COACH_IDS,
  COACHING_JOINT_PRIMARY_COACH_ID,
  COACHING_PATH,
  COACHING_SESSION_MINUTES,
  getValidGoogleCalendarEventId,
  isValidFutureDate,
  normalizeCoachId,
} from "../lib"
import { buildCandidateSlots } from "../lib/availability"
import type {
  CoachingActionResult,
  CoachingAvailabilityInput,
  CoachingBookingInput,
  CoachingManageBookingInput,
  CoachingSlot,
} from "../types"
import {
  confirmCoachingBooking,
  loadCoachingBookingForConfirmation,
  restoreBookingCredit,
} from "./booking-finalizer"
import { listLocalBusyWindows, resolveCoachingCreditSummary } from "./data"
import {
  deleteGoogleCoachingEvent,
  isGoogleCoachingConfigured,
  listGoogleBusyWindows,
  updateGoogleCoachingEvent,
} from "./google-calendar"

type AuthContext = {
  userId: string
  userEmail: string | null
  orgId: string
}

async function getAppOrigin() {
  const requestHeaders = await headers()
  const requestOrigin = requestHeaders.get("origin")
  if (requestOrigin) return requestOrigin

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  if (host) {
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    return `${protocol}://${host}`
  }

  return (
    env.NEXT_PUBLIC_SITE_URL ??
    env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  )
}

async function resolveActionContext(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load authenticated user.")
  }
  if (!user) {
    throw new Error("Sign in to book coaching.")
  }

  const activeOrg = await resolveActiveOrganization(supabase, user.id)
  return {
    userId: user.id,
    userEmail: user.email ?? null,
    orgId: activeOrg.orgId,
  }
}

function parseRange(input: CoachingAvailabilityInput) {
  const coachId = normalizeCoachId(input.coachId)
  const from = new Date(input.from)
  const to = new Date(input.to)
  const timezone = input.timezone || "America/New_York"
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to) {
    throw new Error("Choose a valid date range.")
  }
  return { coachId, from, to, timezone }
}

function hasOverlap({
  startsAt,
  endsAt,
  windows,
}: {
  startsAt: Date
  endsAt: Date
  windows: Array<{ startsAt: string; endsAt: string }>
}) {
  return windows.some((window) => {
    const busyStart = new Date(window.startsAt)
    const busyEnd = new Date(window.endsAt)
    return startsAt < busyEnd && busyStart < endsAt
  })
}

async function listJointBusyWindows({
  from,
  to,
}: {
  from: string
  to: string
}) {
  const admin = createSupabaseAdminClient()
  const windows = await Promise.all([
    ...COACHING_JOINT_COACH_IDS.map((coachId) => listLocalBusyWindows({ supabase: admin, coachId, from, to })),
    ...COACHING_JOINT_COACH_IDS.map((coachId) => listGoogleBusyWindows({ coachId, timeMin: from, timeMax: to })),
  ])
  return windows.flat()
}

async function createStripeCheckout({
  bookingId,
  userId,
  userEmail,
  orgId,
  priceTier,
}: {
  bookingId: string
  userId: string
  userEmail: string | null
  orgId: string
  priceTier: "discounted" | "full"
}) {
  const supabase = await createSupabaseServerClient()
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId,
    fallbackIsTester: resolveTesterMetadata({}),
  })
  const config = resolveStripeRuntimeConfigForCoaching({ isTester: audience.isTester, priceTier })
  if (!config) {
    throw new Error("Stripe is not configured for coaching checkout.")
  }

  const priceId = resolveStripePriceIdForCoaching({ config, priceTier })
  if (!priceId) {
    throw new Error("Coaching price is not configured.")
  }

  const origin = await getAppOrigin()
  const checkout = await config.client.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    customer_email: userEmail ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      kind: "coaching_booking",
      booking_id: bookingId,
      user_id: userId,
      org_user_id: orgId,
      price_tier: priceTier,
      stripe_mode: config.mode,
    },
    success_url: `${origin}${COACHING_PATH}?checkout=success&booking=${bookingId}`,
    cancel_url: `${origin}${COACHING_PATH}?checkout=cancelled&booking=${bookingId}`,
  })

  if (!checkout.url) {
    throw new Error("Stripe did not return a checkout URL.")
  }

  return { checkoutUrl: checkout.url, checkoutSessionId: checkout.id }
}

export async function listCoachingAvailabilityAction(
  input: CoachingAvailabilityInput,
): Promise<CoachingActionResult<{ slots: CoachingSlot[]; calendarConfigured: boolean }>> {
  try {
    const { from, to, timezone } = parseRange(input)
    if (!isGoogleCoachingConfigured()) {
      return { ok: true, slots: [], calendarConfigured: false }
    }

    const busyWindows = await listJointBusyWindows({
      from: from.toISOString(),
      to: to.toISOString(),
    })
    const slots = buildCandidateSlots({
      coachId: COACHING_JOINT_PRIMARY_COACH_ID,
      from,
      to,
      timezone,
      busyWindows,
    }).filter((slot) => slot.available)

    return { ok: true, slots, calendarConfigured: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load coaching availability.",
    }
  }
}

export async function reserveCoachingBookingAction(
  input: CoachingBookingInput,
): Promise<
  CoachingActionResult<{
    bookingId: string
    checkoutUrl?: string
    confirmed: boolean
  }>
> {
  try {
    normalizeCoachId(input.coachId)
    const coachId = COACHING_JOINT_PRIMARY_COACH_ID
    const startsAt = new Date(input.startsAt)
    if (!isValidFutureDate(input.startsAt)) {
      return { ok: false, error: "Choose a future coaching slot." }
    }
    if (!isGoogleCoachingConfigured()) {
      return { ok: false, error: "Coach calendar is not connected yet." }
    }

    const endsAt = addMinutes(startsAt, COACHING_SESSION_MINUTES)
    const busyWindows = await listJointBusyWindows({
      from: startsAt.toISOString(),
      to: endsAt.toISOString(),
    })
    if (hasOverlap({ startsAt, endsAt, windows: busyWindows })) {
      return { ok: false, error: "That slot was just taken. Pick another time." }
    }

    const context = await resolveActionContext()
    const admin = createSupabaseAdminClient()
    const creditSummary = await resolveCoachingCreditSummary({
      supabase: admin,
      userId: context.userId,
      orgId: context.orgId,
    })
    const priceTier = creditSummary.priceTier
    const status = priceTier === "included" ? "held" : "pending_payment"
    const holdExpiresAt = addMinutes(new Date(), COACHING_HOLD_MINUTES).toISOString()

    const { data: booking, error } = await admin
      .from("coaching_bookings")
      .insert({
        org_id: context.orgId,
        user_id: context.userId,
        coach_id: coachId,
        status,
        price_tier: priceTier,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        timezone: input.timezone || "America/New_York",
        hold_expires_at: holdExpiresAt,
      })
      .select("id, org_id, user_id, coach_id, status, price_tier, starts_at, ends_at, timezone, google_event_id, google_meet_url")
      .single()

    if (error) {
      throw supabaseErrorToError(error, "Unable to reserve coaching booking.")
    }

    if (priceTier === "included") {
      try {
        await confirmCoachingBooking({
          admin,
          booking,
          attendeeEmail: context.userEmail,
        })
      } catch (confirmError) {
        await admin
          .from("coaching_bookings")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            cancel_reason: "Unable to create the coach calendar event.",
          })
          .eq("id", booking.id)
        throw confirmError
      }
      revalidatePath(COACHING_PATH)
      return { ok: true, bookingId: booking.id, confirmed: true }
    }

    const checkout = await createStripeCheckout({
      bookingId: booking.id,
      userId: context.userId,
      userEmail: context.userEmail,
      orgId: context.orgId,
      priceTier,
    })

    const { error: checkoutUpdateError } = await admin
      .from("coaching_bookings")
      .update({ stripe_checkout_session_id: checkout.checkoutSessionId })
      .eq("id", booking.id)

    if (checkoutUpdateError) {
      throw supabaseErrorToError(checkoutUpdateError, "Unable to attach coaching checkout.")
    }

    await trackUserJourneyMilestone({
      userId: context.userId,
      orgId: context.orgId,
      eventName: "checkout_started",
      journey: "coaching",
      source: "coaching_booking",
      surface: "coaching",
      checkpoint: "checkout_started",
      metadata: {
        bookingId: booking.id,
        coachId,
        startsAt: booking.starts_at,
        priceTier,
      },
    })

    revalidatePath(COACHING_PATH)
    return {
      ok: true,
      bookingId: booking.id,
      checkoutUrl: checkout.checkoutUrl,
      confirmed: false,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to book coaching.",
    }
  }
}

export async function cancelCoachingBookingAction(
  input: CoachingManageBookingInput,
): Promise<CoachingActionResult<{ success: true }>> {
  try {
    const context = await resolveActionContext()
    const admin = createSupabaseAdminClient()
    const booking = await loadCoachingBookingForConfirmation({
      admin,
      bookingId: input.bookingId,
    })

    if (!booking || booking.user_id !== context.userId || booking.org_id !== context.orgId) {
      return { ok: false, error: "Coaching booking not found." }
    }
    if (Date.parse(booking.starts_at) <= Date.now()) {
      return { ok: false, error: "Past coaching sessions cannot be canceled here." }
    }

    const googleEventId = getValidGoogleCalendarEventId(booking.google_event_id)
    if (googleEventId) {
      await deleteGoogleCoachingEvent({
        coachId: normalizeCoachId(booking.coach_id),
        googleEventId,
      })
    }
    await restoreBookingCredit({ admin, booking })

    const { error } = await admin
      .from("coaching_bookings")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancel_reason: input.reason?.trim() || null,
      })
      .eq("id", booking.id)

    if (error) {
      throw supabaseErrorToError(error, "Unable to cancel coaching booking.")
    }

    const notifyResult = await createNotification(admin as never, {
      userId: booking.user_id,
      orgId: booking.org_id,
      title: "Coaching session canceled",
      description: "Your coaching credit is back in your balance.",
      href: COACHING_PATH,
      tone: "info",
      type: "coaching_booking_canceled",
      actorId: booking.user_id,
      metadata: { bookingId: booking.id },
    })
    if ("error" in notifyResult) {
      console.error("Failed to create coaching cancellation notification", notifyResult.error)
    }

    revalidatePath(COACHING_PATH)
    return { ok: true, success: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to cancel coaching.",
    }
  }
}

export async function rescheduleCoachingBookingAction(
  input: CoachingManageBookingInput & { startsAt: string; timezone: string },
): Promise<CoachingActionResult<{ success: true }>> {
  try {
    const context = await resolveActionContext()
    const admin = createSupabaseAdminClient()
    const booking = await loadCoachingBookingForConfirmation({
      admin,
      bookingId: input.bookingId,
    })

    if (!booking || booking.user_id !== context.userId || booking.org_id !== context.orgId) {
      return { ok: false, error: "Coaching booking not found." }
    }
    if (Date.parse(booking.starts_at) <= Date.now()) {
      return { ok: false, error: "Past coaching sessions cannot be rescheduled here." }
    }
    if (!isValidFutureDate(input.startsAt)) {
      return { ok: false, error: "Choose a future coaching slot." }
    }

    const startsAt = new Date(input.startsAt)
    const endsAt = addMinutes(startsAt, COACHING_SESSION_MINUTES)
    const coachId = normalizeCoachId(booking.coach_id)
    const busyWindows = await listJointBusyWindows({
      from: startsAt.toISOString(),
      to: endsAt.toISOString(),
    })
    const conflictingWindows = busyWindows.filter(
      (window) => window.startsAt !== booking.starts_at && window.endsAt !== booking.ends_at,
    )
    if (hasOverlap({ startsAt, endsAt, windows: conflictingWindows })) {
      return { ok: false, error: "That slot was just taken. Pick another time." }
    }

    const googleEventId = getValidGoogleCalendarEventId(booking.google_event_id)
    if (googleEventId) {
      await updateGoogleCoachingEvent({
        coachId,
        googleEventId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: input.timezone || booking.timezone,
      })
    }

    const { error } = await admin
      .from("coaching_bookings")
      .update({
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        timezone: input.timezone || booking.timezone,
      })
      .eq("id", booking.id)

    if (error) {
      throw supabaseErrorToError(error, "Unable to reschedule coaching booking.")
    }

    revalidatePath(COACHING_PATH)
    return { ok: true, success: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to reschedule coaching.",
    }
  }
}
