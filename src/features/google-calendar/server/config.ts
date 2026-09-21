import "server-only"
import { env } from "@/lib/env"
import { CalendarError } from "../types"
export const CALENDAR_READ_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.readonly"
export const CALENDAR_LIST_SCOPE =
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
export const CALENDAR_EXPORT_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created"
export function calendarConfig() {
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = env.GOOGLE_CALENDAR_CLIENT_SECRET
  const redirect = env.GOOGLE_CALENDAR_REDIRECT_URI
  if (
    env.GOOGLE_CALENDAR_ENABLED !== "true" ||
    !clientId ||
    !clientSecret ||
    !redirect ||
    !env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEYS ||
    !env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_CURRENT_VERSION
  )
    throw new CalendarError("not_configured", 503)
  let url: URL
  try {
    url = new URL(redirect)
  } catch {
    throw new CalendarError("not_configured", 503)
  }
  if (
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )) ||
    url.pathname !== "/api/integrations/google-calendar/callback" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new CalendarError("not_configured", 503)
  return { clientId, clientSecret, redirectUri: url.toString() }
}
export function calendarConfigured() {
  try {
    calendarConfig()
    return true
  } catch {
    return false
  }
}
