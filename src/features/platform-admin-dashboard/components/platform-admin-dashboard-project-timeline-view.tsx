import { differenceInCalendarDays, endOfWeek, format, startOfWeek } from "date-fns"

import { cn } from "@/lib/utils"
import type { PlatformAdminDashboardLabProject } from "../types"

type PlatformAdminDashboardProjectTimelineViewProps = {
  projects: PlatformAdminDashboardLabProject[]
}

function getProjectTone(project: PlatformAdminDashboardLabProject) {
  switch (project.status) {
    case "active":
      return "bg-emerald-500/85"
    case "planned":
      return "bg-slate-500/85"
    case "completed":
      return "bg-sky-500/85"
    case "backlog":
      return "bg-amber-500/85"
    case "cancelled":
      return "bg-rose-500/85"
    default:
      return "bg-slate-500/85"
  }
}

export function PlatformAdminDashboardProjectTimelineView({
  projects,
}: PlatformAdminDashboardProjectTimelineViewProps) {
  const start = startOfWeek(
    new Date(Math.min(...projects.map((project) => project.startDate.getTime()))),
    {
      weekStartsOn: 1,
    },
  )
  const end = endOfWeek(
    new Date(Math.max(...projects.map((project) => project.endDate.getTime()))),
    {
      weekStartsOn: 1,
    },
  )
  const totalDays = differenceInCalendarDays(end, start) + 1
  const dayWidth = 18
  const timelineWidth = totalDays * dayWidth

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/95">
      <div style={{ minWidth: `${280 + timelineWidth}px` }}>
        <div className="flex border-b border-border/60 bg-muted/30">
          <div className="w-72 shrink-0 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Projects
          </div>
          <div className="relative flex-1">
            <div className="flex">
              {Array.from({ length: totalDays }).map((_, index) => {
                const current = new Date(start)
                current.setDate(start.getDate() + index)
                return (
                  <div
                    key={current.toISOString()}
                    className="border-l border-border/50 px-1 py-3 text-center text-[10px] text-muted-foreground"
                    style={{ width: `${dayWidth}px` }}
                  >
                    {index % 7 === 0 ? format(current, "MMM d") : ""}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {projects.map((project) => {
          const offset = differenceInCalendarDays(project.startDate, start)
          const width = differenceInCalendarDays(project.endDate, project.startDate) + 1

          return (
            <div
              key={project.id}
              className="flex border-b border-border/50 last:border-b-0"
            >
              <div className="w-72 shrink-0 space-y-1 px-5 py-4">
                <p className="text-sm font-semibold text-foreground">
                  {project.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.client ?? "Coach House imported sample"}
                </p>
              </div>
              <div className="relative flex-1" style={{ width: `${timelineWidth}px` }}>
                <div className="pointer-events-none absolute inset-0 flex">
                  {Array.from({ length: totalDays }).map((_, index) => (
                    <div
                      key={`${project.id}:grid:${index}`}
                      className="border-l border-border/50"
                      style={{ width: `${dayWidth}px` }}
                    />
                  ))}
                </div>
                <div
                  className={cn(
                    "absolute top-1/2 h-8 -translate-y-1/2 rounded-full px-3 text-xs font-medium text-white shadow-sm",
                    getProjectTone(project),
                  )}
                  style={{
                    left: `${offset * dayWidth + 4}px`,
                    width: `${Math.max(width * dayWidth - 8, 48)}px`,
                  }}
                >
                  <span className="block truncate pt-2">{project.status}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
