import {
  CalendarError,
  type CalendarEvent,
  type CalendarSettings,
  type GoogleEvent,
} from "../types"

export function normalizeCalendarSettings(input: unknown): CalendarSettings {
  if (!input || typeof input !== "object") throw new CalendarError("invalid")
  const value = input as Record<string, unknown>
  if (
    !Array.isArray(value.calendarIds) ||
    value.calendarIds.length > 5 ||
    value.calendarIds.some(
      (id) => typeof id !== "string" || !id.length || id.length > 1024
    ) ||
    new Set(value.calendarIds).size !== value.calendarIds.length ||
    typeof value.exportBoard !== "boolean" ||
    typeof value.timeZone !== "string"
  )
    throw new CalendarError("invalid")
  try {
    new Intl.DateTimeFormat("en", { timeZone: value.timeZone }).format()
  } catch {
    throw new CalendarError("invalid_time_zone")
  }
  return {
    calendarIds: value.calendarIds,
    exportBoard: value.exportBoard,
    timeZone: value.timeZone,
  }
}
export function safeCalendarUrl(value?: string): string | null {
  try {
    const url = new URL(value ?? "")
    return url.protocol === "https:" &&
      ["calendar.google.com", "www.google.com"].includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.toString()
      : null
  } catch {
    return null
  }
}
export function normalizeGoogleEvent(
  event: GoogleEvent,
  calendarId: string,
  calendarName: string
): CalendarEvent | null {
  if (
    !event.id ||
    event.status === "cancelled" ||
    event.extendedProperties?.private?.coachHouseEvent
  )
    return null
  const allDay = Boolean(event.start?.date)
  const start = event.start?.date ?? event.start?.dateTime
  const end = event.end?.date ?? event.end?.dateTime
  if (
    !start ||
    !end ||
    !Number.isFinite(Date.parse(start)) ||
    !Number.isFinite(Date.parse(end)) ||
    Date.parse(end) <= Date.parse(start)
  )
    return null
  return {
    id: event.id,
    calendarId,
    calendarName,
    title: event.summary?.slice(0, 500) || "Busy",
    start,
    end,
    allDay,
    url: safeCalendarUrl(event.htmlLink),
  }
}
export function calendarEventOccursOnDay(event: CalendarEvent, date: Date) {
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
  if (event.allDay) return event.start <= day && day < event.end
  const from = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime()
  const to = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  ).getTime()
  return Date.parse(event.start) < to && Date.parse(event.end) > from
}
export function mergeCalendarPage(
  previous: CalendarEvent[],
  incoming: GoogleEvent[],
  calendarId: string,
  name: string,
  from: string,
  to: string
) {
  const events = new Map(previous.map((event) => [event.id, event]))
  for (const item of incoming) {
    events.delete(item.id)
    const event = normalizeGoogleEvent(item, calendarId, name)
    if (
      event &&
      Date.parse(event.start) < Date.parse(to) &&
      Date.parse(event.end) > Date.parse(from)
    )
      events.set(event.id, event)
  }
  if (events.size > 10000) throw new CalendarError("calendar_too_large", 422)
  return [...events.values()]
}
export const CALENDAR_ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Google Calendar isn’t enabled for Coach House yet.",
  unauthorized: "Sign in again to manage your calendar.",
  invalid_state: "This connection request expired. Connect again.",
  authorization_denied:
    "Google Calendar connection was canceled. Try again when ready.",
  scope_denied: "Allow calendar viewing to finish connecting.",
  export_permission_required:
    "Reconnect and allow Coach House to create its own calendar.",
  missing_refresh_token: "Reconnect Google Calendar to allow background sync.",
  reconnect_required: "Reconnect Google Calendar to continue syncing.",
  provider_unavailable: "Google Calendar could not be reached. Try again.",
  rate_limited: "Google Calendar is busy. Sync will retry later.",
  calendar_unavailable:
    "A selected calendar is no longer available. Update your selections.",
  workspace_changed:
    "Your workspace changed. Reopen Calendar settings before saving.",
  sync_paused: "Calendar sync is off.",
  sync_busy: "A sync is already running. Try again shortly.",
  access_lost: "Board export stopped because your organization access changed.",
  invalid: "Check your calendar selections and try again.",
  calendar_too_large:
    "This calendar exceeds the sync limit. Choose a smaller calendar.",
}
export function calendarErrorMessage(code: string) {
  return (
    CALENDAR_ERROR_MESSAGES[code] ?? "Calendar could not be updated. Try again."
  )
}
