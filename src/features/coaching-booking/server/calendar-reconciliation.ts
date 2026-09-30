import "server-only"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { normalizeCoachId } from "../lib"
import {
  deleteGoogleCoachingEvent,
  updateGoogleCoachingEvent,
} from "./google-calendar"
import { loadGoogleCoachingEventState } from "./google-event-state"
import {
  confirmCoachingBooking,
  loadCoachingBookingForConfirmation,
} from "./booking-finalizer"

export async function flushCoachingCalendarChange(bookingId: string) {
  const admin = createSupabaseAdminClient()
  const { data: b, error } = await admin
    .from("coaching_bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle()
  if (error) throw new Error("Unable to load calendar update.")
  if (!b?.calendar_pending_action) return
  const coachId = normalizeCoachId(b.coach_id)
  if (b.calendar_pending_action === "create") {
    const booking = await loadCoachingBookingForConfirmation({
      admin,
      bookingId,
    })
    if (!booking) return
    if (b.google_event_id) {
      const state = await loadGoogleCoachingEventState(
        coachId,
        b.google_event_id
      ).catch(() => null)
      if (state?.status === "cancelled") {
        const canceled = await admin.rpc("manage_coaching_credit_booking", {
          p_booking_id: b.id,
          p_actor_id: null,
          p_action: "calendar_cancel",
          p_staff: true,
          p_reason: "Coach canceled the Calendar event during confirmation.",
        })
        if (canceled.error) throw new Error(canceled.error.message)
        return
      }
    }
    const user = await admin.auth.admin.getUserById(b.user_id)
    if (user.error) throw new Error("Unable to load coaching participant.")
    await confirmCoachingBooking({
      admin,
      booking,
      attendeeEmail: user.data.user?.email ?? null,
    })
    return
  }
  if (b.google_event_id) {
    if (b.calendar_pending_action === "delete") {
      const event = await loadGoogleCoachingEventState(
        coachId,
        b.google_event_id
      )
      // A 404/access failure is not proof of cancellation. Only explicit canceled status is.
      if (event.status !== "cancelled")
        await deleteGoogleCoachingEvent({
          coachId,
          googleEventId: b.google_event_id,
        })
    } else {
      await updateGoogleCoachingEvent({
        coachId,
        googleEventId: b.google_event_id,
        startsAt: b.starts_at,
        endsAt: b.ends_at,
        timezone: b.timezone,
      })
    }
  }
  const saved = await admin
    .from("coaching_bookings")
    .update({
      calendar_pending_action: null,
      calendar_checked_at: new Date().toISOString(),
    })
    .eq("id", b.id)
    .eq("credit_revision", b.credit_revision)
    .eq("status", b.status)
    .eq("calendar_pending_action", b.calendar_pending_action)
  if (saved.error) throw new Error("Unable to record calendar update.")
}

export async function reconcileCoachingCalendar(stopAt = Date.now() + 40000) {
  const admin = createSupabaseAdminClient()
  const result = await admin
    .from("coaching_bookings")
    .select("id, coach_id, google_event_id, calendar_pending_action, starts_at")
    .or("calendar_pending_action.not.is.null,status.eq.confirmed")
    .order("calendar_checked_at", { ascending: true, nullsFirst: true })
    .limit(40)
  if (result.error) throw new Error("Unable to load coaching calendar queue.")
  let processed = 0
  let failed = 0
  for (const b of result.data ?? []) {
    if (Date.now() > stopAt - 5000) break
    try {
      if (b.calendar_pending_action) await flushCoachingCalendarChange(b.id)
      else if (b.google_event_id) {
        const state = await loadGoogleCoachingEventState(
          normalizeCoachId(b.coach_id),
          b.google_event_id
        )
        if (state.status === "cancelled") {
          const canceled = await admin.rpc("manage_coaching_credit_booking", {
            p_booking_id: b.id,
            p_actor_id: null,
            p_action: "calendar_cancel",
            p_staff: true,
            p_reason: "Coach canceled or deleted the organizer Calendar event.",
          })
          if (canceled.error) throw new Error(canceled.error.message)
        }
        // External reschedules preserve the same reservation; they are coach-managed.
        if (
          state.status === "confirmed" &&
          state.startsAt &&
          state.endsAt &&
          Date.parse(state.startsAt) !== Date.parse(b.starts_at)
        ) {
          const moved = await admin.rpc("manage_coaching_credit_booking", {
            p_booking_id: b.id,
            p_actor_id: null,
            p_action: "reschedule",
            p_staff: true,
            p_reason: "Coach rescheduled in Google Calendar.",
            p_starts_at: state.startsAt,
            p_request_id: crypto.randomUUID(),
            p_expected_starts_at: b.starts_at,
          })
          if (moved.error) throw new Error(moved.error.message)
        }
      }
      processed += 1
    } catch (error) {
      failed += 1
      logger.warn("coaching_calendar_reconcile_failed", {
        bookingId: b.id,
        message:
          error instanceof Error ? error.message : "Calendar unavailable",
      })
    } finally {
      await admin
        .from("coaching_bookings")
        .update({ calendar_checked_at: new Date().toISOString() })
        .eq("id", b.id)
    }
  }
  return { processed, failed }
}
