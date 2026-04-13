"use client"

import { ListChecks } from "@phosphor-icons/react/dist/ssr"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { cn } from "@/lib/utils"

function ProgressCircle({
  progress,
  color,
  size = 18,
  strokeWidth = 2,
}: {
  progress: number
  color: string
  size?: number
  strokeWidth?: number
}) {
  const s = Math.round(size)
  const r = Math.floor((s - strokeWidth) / 2)
  const cx = s / 2
  const cy = s / 2
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - progress / 100)

  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
    </div>
  )
}

function getProjectProgress(project: PlatformAdminDashboardLabProject) {
  const totalTasks = project.tasks.length > 0 ? project.tasks.length : project.taskCount
  const doneTasks =
    project.tasks.length > 0
      ? project.tasks.filter((task) => task.status === "done").length
      : Math.round(((project.progress ?? 0) / 100) * totalTasks)

  const percent =
    typeof project.progress === "number"
      ? project.progress
      : totalTasks > 0
        ? Math.round((doneTasks / totalTasks) * 100)
        : 0

  return {
    totalTasks,
    doneTasks,
    percent: Math.max(0, Math.min(100, percent)),
  }
}

function getProgressColor(percent: number) {
  if (percent >= 80) return "var(--chart-3)"
  if (percent >= 50) return "var(--chart-4)"
  if (percent > 0) return "var(--chart-5)"
  return "var(--chart-2)"
}

export function MemberWorkspaceProjectProgress({
  project,
  className,
  size = 18,
  showTaskSummary = true,
}: {
  project: PlatformAdminDashboardLabProject
  className?: string
  size?: number
  showTaskSummary?: boolean
}) {
  const { totalTasks, doneTasks, percent } = getProjectProgress(project)
  const color = getProgressColor(percent)
  const taskSummaryLabel = project.taskSummaryLabel ?? "Tasks"

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <ProgressCircle progress={percent} color={color} size={size} />
      <div className="flex items-center gap-4">
        <span>{percent}%</span>
        {showTaskSummary && totalTasks > 0 ? (
          <span className="flex items-center gap-1 text-sm">
            <ListChecks className="h-4 w-4" />
            {doneTasks} / {totalTasks} {taskSummaryLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
