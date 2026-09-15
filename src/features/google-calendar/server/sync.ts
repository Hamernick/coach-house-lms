import "server-only"
import { randomUUID } from "node:crypto"
import { CalendarError } from "../types"
import { calendarConfig } from "./config"
import { accessToken } from "./oauth"
import {
  asJson,
  getConnection,
  requireActiveLease,
  stateOf,
  updateConnection,
} from "./store"
import { importCalendarPage } from "./sync-import"
import { exportBoardEvents } from "./sync-export"

export async function syncCalendar(
  userId: string,
  stopAt = Date.now() + 40000
) {
  calendarConfig()
  const existing = await getConnection(userId)
  if (!existing?.enabled || existing.status !== "connected")
    throw new CalendarError("sync_paused", 409)
  if (
    existing.lease_id &&
    Date.parse(existing.lease_expires_at ?? "") > Date.now()
  )
    throw new CalendarError("sync_busy", 409)
  const lease = randomUUID()
  // Changing revision is the compare-and-swap claim; only one worker can win.
  let row = await updateConnection(existing, {
    revision: randomUUID(),
    lease_id: lease,
    lease_expires_at: new Date(Date.now() + 120000).toISOString(),
  })
  const state = stateOf(row)
  const deadline = Math.min(Date.now() + 40000, stopAt)
  let requests = 0
  const guard = async () => {
    if (++requests > 45 || Date.now() > deadline)
      throw new CalendarError("sync_continue", 409)
    await requireActiveLease(row)
  }
  const persist = async () => {
    await requireActiveLease(row)
    row = await updateConnection(row, { state: asJson(state) })
  }
  try {
    await guard()
    const token = await accessToken(row)
    for (const calendar of state.selected) {
      let pages = 0
      do {
        await guard()
        state.caches[calendar.id] = await importCalendarPage(
          token,
          calendar,
          state.caches[calendar.id]
        )
        await persist()
        if (++pages >= 5 && state.caches[calendar.id].pageToken)
          throw new CalendarError("sync_continue", 409)
      } while (
        state.caches[calendar.id].pageToken ||
        !state.caches[calendar.id].syncToken
      )
    }
    await exportBoardEvents(token, row, state, guard, persist)
    await requireActiveLease(row)
    await updateConnection(row, {
      lease_id: null,
      lease_expires_at: null,
      last_error: null,
      last_synced_at: new Date().toISOString(),
      next_sync_at: new Date(Date.now() + 300000).toISOString(),
    })
    return { complete: true }
  } catch (error) {
    const code =
      error instanceof CalendarError ? error.code : "provider_unavailable"
    const current = await getConnection(userId)
    if (current?.revision === row.revision) {
      await updateConnection(row, {
        lease_id: null,
        lease_expires_at: null,
        last_error: code === "sync_continue" ? null : code,
        next_sync_at: new Date(
          Date.now() + (code === "sync_continue" ? 15000 : 300000)
        ).toISOString(),
        ...(code === "access_lost" ? { export_org_id: null } : {}),
      })
    }
    if (code === "sync_continue") return { complete: false }
    throw error
  }
}
