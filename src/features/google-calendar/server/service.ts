import "server-only"
import {
  CalendarError,
  type CalendarSettings,
  type CalendarSummary,
} from "../types"
import { calendarConfigured, CALENDAR_EXPORT_SCOPE } from "./config"
import { listCalendarChoices } from "./google-api"
import { accessToken } from "./oauth"
import {
  asJson,
  canExportOrganization,
  checked,
  emptyCalendarState,
  getConnection,
  stateOf,
  updateConnection,
} from "./store"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function calendarSummary(
  userId: string,
  orgId: string
): Promise<CalendarSummary> {
  const configured = calendarConfigured()
  const row = configured ? await getConnection(userId) : null
  const connected = Boolean(row?.refresh_secret && row.status === "connected")
  return {
    configured,
    connected,
    enabled: configured && Boolean(row?.enabled),
    activeOrgId: orgId,
    status:
      row?.status === "reconnect_required"
        ? "reconnect_required"
        : connected
          ? "connected"
          : "not_connected",
    email: row?.status !== "disconnected" ? (row?.google_email ?? null) : null,
    selectedCalendars: row ? stateOf(row).selected : [],
    exportOrgId: row?.export_org_id ?? null,
    canExport: Boolean(row?.granted_scopes.includes(CALENDAR_EXPORT_SCOPE)),
    timeZone: row?.time_zone ?? "UTC",
    lastSyncedAt: row?.last_synced_at ?? null,
    error: row?.last_error ?? null,
    syncing: Boolean(
      row?.lease_id && Date.parse(row.lease_expires_at ?? "") > Date.now()
    ),
  }
}
export async function calendarChoices(userId: string) {
  const row = await getConnection(userId)
  if (!row) throw new CalendarError("reconnect_required", 409)
  const choices = await listCalendarChoices(await accessToken(row))
  const exports = new Set(
    Object.values(stateOf(row).destinations).map((item) => item.calendarId)
  )
  return choices.filter((choice) => !exports.has(choice.id))
}
export async function saveCalendarSettings(
  userId: string,
  orgId: string,
  input: CalendarSettings
) {
  if (!input.calendarIds.length && !input.exportBoard)
    throw new CalendarError("invalid")
  const row = await getConnection(userId)
  if (!row?.refresh_secret || row.status !== "connected")
    throw new CalendarError("reconnect_required", 409)
  if (input.exportBoard && !row.granted_scopes.includes(CALENDAR_EXPORT_SCOPE))
    throw new CalendarError("export_permission_required", 409)
  if (input.exportBoard && !(await canExportOrganization(userId, orgId)))
    throw new CalendarError("access_lost", 403)
  const available = await calendarChoices(userId)
  const selected = input.calendarIds.map((id) =>
    available.find((calendar) => calendar.id === id)
  )
  if (selected.some((calendar) => !calendar))
    throw new CalendarError("calendar_unavailable", 409)
  const state = stateOf(row)
  state.selected = selected.filter((calendar) =>
    Boolean(calendar)
  ) as typeof state.selected
  state.caches = Object.fromEntries(
    Object.entries(state.caches).filter(([id]) =>
      input.calendarIds.includes(id)
    )
  )
  await updateConnection(
    row,
    {
      state: asJson(state),
      enabled: true,
      time_zone: input.timeZone,
      export_org_id: input.exportBoard ? orgId : null,
      last_error: null,
      last_synced_at: null,
      next_sync_at: new Date().toISOString(),
    },
    true
  )
}
export async function setCalendarEnabled(userId: string, enabled: boolean) {
  const row = await getConnection(userId)
  if (!row?.refresh_secret || row.status !== "connected")
    throw new CalendarError("reconnect_required", 409)
  if (enabled && !stateOf(row).selected.length && !row.export_org_id)
    throw new CalendarError("invalid")
  await updateConnection(
    row,
    { enabled, next_sync_at: new Date().toISOString() },
    true
  )
}
export async function disconnectCalendar(userId: string) {
  checked(
    await createSupabaseAdminClient()
      .from("google_calendar_oauth_intents")
      .delete()
      .eq("user_id", userId)
  )
  const row = await getConnection(userId)
  if (!row) return
  // Retain only destination IDs/fingerprints so reconnection cannot duplicate exports.
  const state = emptyCalendarState()
  state.destinations = stateOf(row).destinations
  await updateConnection(
    row,
    {
      enabled: false,
      status: "disconnected",
      refresh_secret: null,
      state: asJson(state),
      export_org_id: null,
      granted_scopes: [],
      last_synced_at: null,
      last_error: null,
    },
    true
  )
  // Google revocation is project-wide; feature disconnect only erases local credentials.
}
export async function personalCalendarEvents(
  userId: string,
  from: string,
  to: string
) {
  const row = await getConnection(userId)
  if (!row?.enabled || row.status !== "connected") return []
  const state = stateOf(row)
  return state.selected
    .flatMap((calendar) => state.caches[calendar.id]?.events ?? [])
    .filter(
      (event) =>
        Date.parse(event.start) < Date.parse(to) &&
        Date.parse(event.end) > Date.parse(from)
    )
    .sort((a, b) => a.start.localeCompare(b.start))
}
