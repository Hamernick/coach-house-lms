import type {
  WorkspaceCommunicationActivity,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"

export type ActivityState = WorkspaceCommunicationActivity["status"] | "none"

export function buildHeatmapKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

export function buildHeatmapKey(dayOffset: number) {
  const next = new Date()
  next.setDate(next.getDate() - dayOffset)
  return buildHeatmapKeyFromDate(next)
}

export function heatmapCellClass(state: ActivityState) {
  if (state === "posted") return "bg-emerald-500/80"
  if (state === "scheduled") return "bg-sky-500/60"
  return "bg-muted"
}

export function toLocalDateTimeInputValue(iso: string) {
  const parsed = new Date(iso)
  if (!Number.isFinite(parsed.getTime())) return ""
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function toIsoFromLocalInputValue(value: string, fallbackIso: string) {
  if (typeof value !== "string" || value.trim().length === 0) return fallbackIso
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return fallbackIso
  return parsed.toISOString()
}

export function sortActivityEntriesByDay(
  activityByDay: WorkspaceCommunicationsState["activityByDay"],
) {
  return Object.entries(activityByDay).sort(([left], [right]) =>
    left < right ? 1 : left > right ? -1 : 0,
  )
}

export function pruneActivityByDay(
  activityByDay: WorkspaceCommunicationsState["activityByDay"],
  maxEntries = 180,
) {
  const entries = sortActivityEntriesByDay(activityByDay).slice(0, maxEntries)
  return Object.fromEntries(entries)
}

export function buildHeatmapRows(activityByDay: WorkspaceCommunicationsState["activityByDay"]) {
  const rows: Array<Array<{ key: string; entry: WorkspaceCommunicationActivity | null }>> = []
  for (let row = 0; row < 10; row += 1) {
    const cells: Array<{ key: string; entry: WorkspaceCommunicationActivity | null }> = []
    for (let column = 0; column < 7; column += 1) {
      const key = buildHeatmapKey(row * 7 + column)
      cells.push({ key, entry: activityByDay[key] ?? null })
    }
    rows.push(cells)
  }
  return rows
}
