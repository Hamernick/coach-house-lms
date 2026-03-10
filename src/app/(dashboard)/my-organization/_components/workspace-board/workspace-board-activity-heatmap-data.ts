import { startOfDay } from "date-fns"

import type { HeatmapDatum } from "@/components/heatmap-calendar"

import {
  buildWorkspaceActivityHeatmapWindow,
  WORKSPACE_ACTIVITY_TOTAL_WEEKS,
} from "../../_lib/workspace-activity"
import type {
  WorkspaceActivityRecord,
  WorkspaceActivityType,
} from "./workspace-board-types"

export const WORKSPACE_ACTIVITY_HEATMAP_RANGE_DAYS =
  WORKSPACE_ACTIVITY_TOTAL_WEEKS * 7

export type WorkspaceActivityHeatmapMeta = {
  totalCount: number
  completedCount: number
  scheduledCount: number
  activities: WorkspaceActivityRecord[]
}

const ACTIVITY_PRIORITY: Record<WorkspaceActivityType, number> = {
  donation: 7,
  calendar_board_meeting: 6,
  accelerator: 5,
  social_posted: 4,
  social_scheduled: 3,
  calendar_meeting: 2,
  calendar_deadline: 2,
  calendar_milestone: 2,
  calendar_other: 1,
}

function toLocalDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(value.getDate()).padStart(2, "0")}`
}

function sortActivitiesForHeatmap(records: WorkspaceActivityRecord[]) {
  return [...records].sort((left, right) => {
    const priorityDelta = ACTIVITY_PRIORITY[right.type] - ACTIVITY_PRIORITY[left.type]
    if (priorityDelta !== 0) return priorityDelta
    return right.timestamp.localeCompare(left.timestamp)
  })
}

export function buildWorkspaceBoardActivityHeatmapData(
  records: WorkspaceActivityRecord[],
  referenceDate = new Date(),
) {
  const { start, end } = buildWorkspaceActivityHeatmapWindow(referenceDate)
  const windowStart = startOfDay(start)
  const windowEnd = startOfDay(end)
  const byDay = new Map<string, WorkspaceActivityRecord[]>()

  for (const record of records) {
    const parsed = new Date(record.timestamp)
    if (!Number.isFinite(parsed.getTime())) continue
    const day = startOfDay(parsed)
    if (day < windowStart || day > windowEnd) continue
    const key = toLocalDateKey(day)
    const existing = byDay.get(key)
    if (existing) {
      existing.push(record)
      continue
    }
    byDay.set(key, [record])
  }

  const data: HeatmapDatum<WorkspaceActivityHeatmapMeta>[] = Array.from(
    byDay.entries(),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayRecords]) => {
      const activities = sortActivitiesForHeatmap(dayRecords)
      return {
        date,
        value: activities.length,
        meta: {
          totalCount: activities.length,
          completedCount: activities.filter((entry) => entry.status === "completed")
            .length,
          scheduledCount: activities.filter((entry) => entry.status === "scheduled")
            .length,
          activities,
        },
      }
    })

  return {
    data,
    endDate: end,
    rangeDays: WORKSPACE_ACTIVITY_HEATMAP_RANGE_DAYS,
  }
}
