"use client"

import { format } from "date-fns"
import { useMemo } from "react"

import {
  type HeatmapCell,
  HeatmapCalendar,
} from "@/components/heatmap-calendar"
import { cn } from "@/lib/utils"

import {
  buildWorkspaceBoardActivityHeatmapData,
  type WorkspaceActivityHeatmapMeta,
} from "./workspace-board-activity-heatmap-data"
import type {
  WorkspaceActivityRecord,
  WorkspaceActivityType,
} from "./workspace-board-types"

type WorkspaceActivityHeatmapProps = {
  records: WorkspaceActivityRecord[]
  compact?: boolean
  className?: string
}

const ACTIVITY_LABELS: Record<WorkspaceActivityType, string> = {
  calendar_meeting: "Meeting",
  calendar_board_meeting: "Board",
  calendar_deadline: "Deadline",
  calendar_milestone: "Milestone",
  calendar_other: "Calendar",
  accelerator: "Accelerator",
  social_scheduled: "Scheduled",
  social_posted: "Published",
  donation: "Donation",
}

const ACTIVITY_SWATCH_CLASS: Record<WorkspaceActivityType, string> = {
  calendar_meeting: "bg-sky-500",
  calendar_board_meeting: "bg-amber-500",
  calendar_deadline: "bg-rose-500",
  calendar_milestone: "bg-cyan-500",
  calendar_other: "bg-slate-500",
  accelerator: "bg-violet-500",
  social_scheduled: "bg-blue-500",
  social_posted: "bg-fuchsia-500",
  donation: "bg-emerald-500",
}

function formatBreakdownTime(value: string) {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)
}

function buildTypeBreakdown(activities: WorkspaceActivityRecord[]) {
  const byType = new Map<
    WorkspaceActivityType,
    { type: WorkspaceActivityType; count: number }
  >()

  for (const activity of activities) {
    const existing = byType.get(activity.type)
    if (existing) {
      existing.count += 1
      continue
    }
    byType.set(activity.type, { type: activity.type, count: 1 })
  }

  return Array.from(byType.values()).sort((left, right) => right.count - left.count)
}

function ActivityBreakdown({
  cell,
}: {
  cell: HeatmapCell<WorkspaceActivityHeatmapMeta>
}) {
  const meta = cell.meta
  if (!meta || meta.totalCount === 0) {
    return <p className="text-xs text-muted-foreground">No activity.</p>
  }

  const visibleActivities = meta.activities.slice(0, 4)
  const remainingCount = meta.activities.length - visibleActivities.length
  const typeBreakdown = buildTypeBreakdown(meta.activities)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {format(cell.date, "EEEE, MMM d")}
        </p>
        <p className="text-xs text-muted-foreground">
          {meta.totalCount} item{meta.totalCount === 1 ? "" : "s"} ·{" "}
          {meta.completedCount} complete · {meta.scheduledCount} scheduled
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {typeBreakdown.map((entry) => (
          <span
            key={`heatmap-type-${entry.type}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2 py-1 text-[11px] text-foreground"
          >
            <span
              className={cn("h-2 w-2 rounded-full", ACTIVITY_SWATCH_CLASS[entry.type])}
              aria-hidden
            />
            {ACTIVITY_LABELS[entry.type]} · {entry.count}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {visibleActivities.map((activity) => (
          <div
            key={`${activity.id}:${activity.timestamp}`}
            className="rounded-xl border border-border/60 bg-background/80 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                      ACTIVITY_SWATCH_CLASS[activity.type],
                    )}
                    aria-hidden
                  />
                  <p className="truncate text-xs font-medium text-foreground">
                    {activity.title}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {ACTIVITY_LABELS[activity.type]} ·{" "}
                  {activity.status === "scheduled" ? "Scheduled" : "Complete"}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatBreakdownTime(activity.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {remainingCount > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          +{remainingCount} more item{remainingCount === 1 ? "" : "s"} on this day
        </p>
      ) : null}
    </div>
  )
}

export function WorkspaceBoardActivityHeatmap({
  records,
  compact = false,
  className,
}: WorkspaceActivityHeatmapProps) {
  const { data, endDate, rangeDays } = useMemo(
    () => buildWorkspaceBoardActivityHeatmapData(records),
    [records],
  )

  return (
    <HeatmapCalendar
      data={data}
      rangeDays={rangeDays}
      endDate={endDate}
      weekStartsOn={0}
      cellSize={compact ? 11 : 12}
      cellGap={compact ? 3 : 4}
      axisLabels={{
        showMonths: true,
        showWeekdays: true,
        weekdayIndices: [1, 3, 5],
        monthFormat: "short",
        minWeekSpacing: 3,
      }}
      legend
      renderTooltip={(cell) => <ActivityBreakdown cell={cell} />}
      className={className}
    />
  )
}
