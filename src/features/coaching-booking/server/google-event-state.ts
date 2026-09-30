import {
  getCoachCalendarId,
  isBrokerConfigured,
  requestGoogleCalendarBroker,
  requestGoogleCalendarDirect,
} from "./google-calendar"
import type { CoachingCoachId } from "../types"
export type CoachingGoogleEventState = {
  status: string
  startsAt: string | null
  endsAt: string | null
}
export async function loadGoogleCoachingEventState(
  coachId: CoachingCoachId,
  googleEventId: string
): Promise<CoachingGoogleEventState> {
  if (isBrokerConfigured())
    return requestGoogleCalendarBroker({
      operation: "getEvent",
      payload: { coachId, googleEventId },
    })
  const calendarId = getCoachCalendarId(coachId)
  if (!calendarId) throw new Error("Coach calendar is not configured.")
  const event = await requestGoogleCalendarDirect<{
    status: string
    start?: { dateTime?: string }
    end?: { dateTime?: string }
  }>({
    coachId,
    path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
  })
  return {
    status: event.status,
    startsAt: event.start?.dateTime ?? null,
    endsAt: event.end?.dateTime ?? null,
  }
}
