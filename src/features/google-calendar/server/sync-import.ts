import "server-only"
import {
  CalendarError,
  type CalendarCache,
  type CalendarChoice,
  type GoogleEvent,
} from "../types"
import { mergeCalendarPage } from "../lib"
import { calendarRequest } from "./google-api"

export function newCalendarCache(now = new Date()): CalendarCache {
  return {
    events: [],
    fullStartedAt: now.toISOString(),
    from: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1)
    ).toISOString(),
    to: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 13, 1)
    ).toISOString(),
  }
}
export async function importCalendarPage(
  token: string,
  choice: CalendarChoice,
  current?: CalendarCache
) {
  let cache = current ?? newCalendarCache()
  // Monthly full refresh rolls the bounded 16-month display window forward.
  if (Date.now() - Date.parse(cache.fullStartedAt) > 30 * 86400000)
    cache = newCalendarCache()
  const params = new URLSearchParams({
    singleEvents: "true",
    showDeleted: "true",
    maxResults: "250",
    fields:
      "nextPageToken,nextSyncToken,items(id,status,summary,htmlLink,start,end,extendedProperties)",
  })
  if (cache.syncToken) params.set("syncToken", cache.syncToken)
  else {
    params.set("timeMin", cache.from)
    params.set("timeMax", cache.to)
  }
  if (cache.pageToken) params.set("pageToken", cache.pageToken)
  try {
    const page = await calendarRequest<{
      items?: GoogleEvent[]
      nextPageToken?: string
      nextSyncToken?: string
    }>(
      token,
      "calendars/" + encodeURIComponent(choice.id) + "/events?" + params
    )
    if (!page.nextPageToken && !page.nextSyncToken)
      throw new CalendarError("provider_unavailable", 503)
    return {
      ...cache,
      events: mergeCalendarPage(
        cache.events,
        page.items ?? [],
        choice.id,
        choice.name,
        cache.from,
        cache.to
      ),
      pageToken: page.nextPageToken,
      syncToken: page.nextSyncToken ?? cache.syncToken,
    }
  } catch (error) {
    if (error instanceof CalendarError && error.code === "google_410")
      return newCalendarCache()
    if (error instanceof CalendarError && error.code === "google_404")
      throw new CalendarError("calendar_unavailable", 409)
    throw error
  }
}
