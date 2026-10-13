import type Stripe from "stripe"

import { createSupabaseAdminClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  confirmCoachingBooking,
  loadCoachingBookingForConfirmation,
} from "./booking-finalizer"

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export async function processCoachingCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment" || session.metadata?.kind !== "coaching_booking") {
    return false
  }

  const bookingId = readString(session.metadata.booking_id)
  if (!bookingId) return true

  const admin = createSupabaseAdminClient()
  const booking = await loadCoachingBookingForConfirmation({ admin, bookingId })
  if (!booking) return true

  const { data: userRow, error: userError } = await admin.auth.admin.getUserById(booking.user_id)
  if (userError) {
    throw supabaseErrorToError(userError, "Unable to load coaching booking user.")
  }

  await confirmCoachingBooking({
    admin,
    booking,
    attendeeEmail: userRow.user?.email ?? null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
  })

  return true
}
