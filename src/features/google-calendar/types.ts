export type CalendarChoice = { id: string; name: string; timeZone: string }
export type CalendarEvent = {
  id: string
  calendarId: string
  calendarName: string
  title: string
  start: string
  end: string
  allDay: boolean
  url: string | null
}
export type CalendarSummary = {
  activeOrgId: string
  configured: boolean
  connected: boolean
  enabled: boolean
  status: "not_connected" | "connected" | "reconnect_required"
  email: string | null
  selectedCalendars: CalendarChoice[]
  exportOrgId: string | null
  canExport: boolean
  timeZone: string
  lastSyncedAt: string | null
  error: string | null
  syncing: boolean
}
export type CalendarSettings = {
  calendarIds: string[]
  exportBoard: boolean
  timeZone: string
}
export type EncryptedCalendarSecret = {
  ciphertext: string
  iv: string
  authTag: string
  keyVersion: string
}
export type GoogleEvent = {
  id: string
  status?: string
  summary?: string
  htmlLink?: string
  start?: { date?: string; dateTime?: string; timeZone?: string }
  end?: { date?: string; dateTime?: string; timeZone?: string }
  extendedProperties?: { private?: Record<string, string> }
}
export type CalendarCache = {
  events: CalendarEvent[]
  syncToken?: string
  pageToken?: string
  fullStartedAt: string
  from: string
  to: string
}
export type CalendarState = {
  selected: CalendarChoice[]
  caches: Record<string, CalendarCache>
  destinations: Record<
    string,
    {
      calendarId: string
      events: Record<string, { id: string; fingerprint: string }>
    }
  >
}
export class CalendarError extends Error {
  constructor(
    public code: string,
    public status = 400
  ) {
    super(code)
    this.name = "CalendarError"
  }
}
