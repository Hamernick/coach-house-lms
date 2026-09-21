import "server-only"
import { createHash } from "node:crypto"
import sanitizeHtml from "sanitize-html"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  mapCalendarRow,
  type RoadmapCalendarEvent,
} from "@/lib/roadmap/calendar"
import { CalendarError, type CalendarState, type GoogleEvent } from "../types"
import { calendarRequest } from "./google-api"
import { canExportOrganization, checked, type Connection } from "./store"

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex")
export function exportEventId(orgId: string, eventId: string) {
  return "ch" + digest(orgId + ":" + eventId)
}
function localDate(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value))
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)?.value)
    .join("-")
}
export function exportEventBody(event: RoadmapCalendarEvent, timeZone: string) {
  const end =
    event.endsAt ?? new Date(Date.parse(event.startsAt) + 3600000).toISOString()
  const startDate = localDate(event.startsAt, timeZone)
  const nextDay = new Date(Date.parse(startDate + "T00:00:00Z") + 86400000)
    .toISOString()
    .slice(0, 10)
  const endDate = localDate(end, timeZone)
  const recurrence = event.recurrence
  const frequency =
    recurrence?.frequency === "annual"
      ? "YEARLY"
      : recurrence?.frequency === "weekly"
        ? "WEEKLY"
        : "MONTHLY"
  const interval =
    (recurrence?.interval ?? 1) *
    (recurrence?.frequency === "quarterly" ? 3 : 1)
  let rule = recurrence
    ? "RRULE:FREQ=" + frequency + ";INTERVAL=" + interval
    : null
  if (rule && recurrence?.endDate) {
    const until = event.allDay
      ? recurrence.endDate.slice(0, 10).replace(/-/g, "")
      : new Date(recurrence.endDate.slice(0, 10) + "T23:59:59Z")
          .toISOString()
          .replace(/[-:]/g, "")
          .split(".")[0] + "Z"
    rule += ";UNTIL=" + until
  } else if (rule && recurrence?.count) rule += ";COUNT=" + recurrence.count
  if (rule && recurrence?.byDay?.length)
    rule += ";BYDAY=" + recurrence.byDay.join(",")
  return {
    summary: event.title,
    description: sanitizeHtml(event.description ?? "", {
      allowedTags: [],
      allowedAttributes: {},
    }),
    start: event.allDay
      ? { date: startDate }
      : { dateTime: event.startsAt, timeZone },
    end: event.allDay
      ? { date: endDate > startDate ? endDate : nextDay }
      : { dateTime: end, timeZone },
    recurrence: rule ? [rule] : [],
    reminders: { useDefault: false },
    extendedProperties: {
      private: { coachHouseEvent: event.id, coachHouseOrg: event.orgId },
    },
  }
}
type Guard = () => Promise<void>
async function destinationCalendar(
  token: string,
  row: Connection,
  guard: Guard
) {
  const marker =
    "Coach House board sync " + digest(row.user_id + ":" + row.export_org_id)
  let pageToken: string | undefined
  for (let page = 0; page < 20; page++) {
    await guard()
    const params = new URLSearchParams({
      maxResults: "250",
      fields: "nextPageToken,items(id,description)",
    })
    if (pageToken) params.set("pageToken", pageToken)
    const result = await calendarRequest<{
      items?: { id: string; description?: string }[]
      nextPageToken?: string
    }>(token, "users/me/calendarList?" + params)
    const found = result.items?.find((item) => item.description === marker)
    if (found) return found.id
    pageToken = result.nextPageToken
    if (!pageToken) break
    if (page === 19) throw new CalendarError("calendar_too_large", 422)
  }
  await guard()
  const result = await calendarRequest<{ id: string }>(token, "calendars", {
    method: "POST",
    body: JSON.stringify({
      summary: "Coach House — Board calendar",
      description: marker,
      timeZone: row.time_zone,
    }),
  })
  return result.id
}
async function boardEvents(orgId: string) {
  const events: RoadmapCalendarEvent[] = []
  const admin = createSupabaseAdminClient()
  for (let offset = 0; offset < 10000; offset += 500) {
    const rows =
      checked(
        await admin
          .from("roadmap_calendar_internal_events")
          .select(
            "id,org_id,title,description,event_type,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at"
          )
          .eq("org_id", orgId)
          .order("id")
          .range(offset, offset + 499)
      ) ?? []
    events.push(...rows.map(mapCalendarRow))
    if (rows.length < 500) return events
  }
  throw new CalendarError("calendar_too_large", 422)
}
export async function exportBoardEvents(
  token: string,
  row: Connection,
  state: CalendarState,
  guard: Guard,
  persist: () => Promise<void>
) {
  const orgId = row.export_org_id
  if (!orgId) return
  const exportGuard = async () => {
    await guard()
    if (!(await canExportOrganization(row.user_id, orgId)))
      throw new CalendarError("access_lost", 403)
  }
  await exportGuard()
  const events = await boardEvents(orgId)
  if (state.destinations[orgId]) {
    await exportGuard()
    try {
      await calendarRequest(
        token,
        "calendars/" + encodeURIComponent(state.destinations[orgId].calendarId)
      )
    } catch (error) {
      if (
        !(
          error instanceof CalendarError &&
          ["google_404", "google_410"].includes(error.code)
        )
      )
        throw error
      delete state.destinations[orgId]
      await persist()
    }
  }
  if (!state.destinations[orgId]) {
    state.destinations[orgId] = {
      calendarId: await destinationCalendar(token, row, exportGuard),
      events: {},
    }
    await persist()
  }
  const destination = state.destinations[orgId]
  const base =
    "calendars/" + encodeURIComponent(destination.calendarId) + "/events"
  const activeIds = new Set(
    events
      .filter((event) => event.status !== "canceled")
      .map((event) => event.id)
  )
  for (const eventId of Object.keys(destination.events)) {
    if (
      activeIds.has(eventId) ||
      destination.events[eventId].fingerprint === "deleted"
    )
      continue
    await exportGuard()
    try {
      await calendarRequest(
        token,
        base + "/" + destination.events[eventId].id + "?sendUpdates=none",
        { method: "DELETE" }
      )
    } catch (error) {
      if (
        !(
          error instanceof CalendarError &&
          ["google_404", "google_410"].includes(error.code)
        )
      )
        throw error
    }
    // Keep a fresh deterministic generation ready for a later uncancel/recreate.
    const previous = destination.events[eventId]
    if (previous.fingerprint !== "deleted") {
      destination.events[eventId] = {
        id: "ch" + digest(previous.id),
        fingerprint: "deleted",
      }
      await persist()
    }
  }
  for (const event of events) {
    if (event.status === "canceled") continue
    const body = exportEventBody(event, row.time_zone)
    const fingerprint = digest(JSON.stringify(body))
    if (destination.events[event.id]?.fingerprint === fingerprint) continue
    await exportGuard()
    const id =
      destination.events[event.id]?.id ?? exportEventId(orgId, event.id)
    try {
      const existing = await calendarRequest<GoogleEvent>(
        token,
        base + "/" + id
      )
      if (existing.extendedProperties?.private?.coachHouseEvent !== event.id)
        throw new CalendarError("calendar_unavailable", 409)
      await exportGuard()
      await calendarRequest(token, base + "/" + id + "?sendUpdates=none", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
    } catch (error) {
      if (error instanceof CalendarError && error.code === "google_410") {
        destination.events[event.id] = {
          id: "ch" + digest(id),
          fingerprint: "",
        }
        await persist()
        throw new CalendarError("sync_continue", 409)
      }
      if (!(error instanceof CalendarError && error.code === "google_404"))
        throw error
      await exportGuard()
      try {
        await calendarRequest(token, base + "?sendUpdates=none", {
          method: "POST",
          body: JSON.stringify({ ...body, id }),
        })
      } catch (insertError) {
        // The stable ID makes a timed-out insert safe to retry without duplicates.
        if (
          !(
            insertError instanceof CalendarError &&
            insertError.code === "google_409"
          )
        )
          throw insertError
        throw new CalendarError("sync_continue", 409)
      }
    }
    destination.events[event.id] = { id, fingerprint }
    await persist()
  }
}
