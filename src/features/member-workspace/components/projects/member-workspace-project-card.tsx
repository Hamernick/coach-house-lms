"use client"

import type { ReactNode } from "react"
import { useMemo, useRef } from "react"
import { format } from "date-fns"
import { CalendarBlank, Flag, Folder, PencilSimpleLine, User } from "@phosphor-icons/react/dist/ssr"
import { useRouter } from "next/navigation"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MemberWorkspaceProjectPriorityBadge } from "./member-workspace-project-priority"
import { MemberWorkspaceProjectProgress } from "./member-workspace-project-progress"

type MemberWorkspaceProjectCardProps = {
  project: PlatformAdminDashboardLabProject
  actions?: ReactNode
  onEditProject?: (project: PlatformAdminDashboardLabProject) => void
  variant?: "list" | "board"
  visibleProperties?: Array<"title" | "status" | "assignee" | "dueDate">
}

function getStatusConfig(status: PlatformAdminDashboardLabProject["status"]) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        dot: "bg-teal-600 dark:bg-teal-400",
        pill: "text-teal-700 border-teal-200 bg-teal-50 dark:text-teal-100 dark:border-teal-500/40 dark:bg-teal-500/10",
      }
    case "planned":
      return {
        label: "Planned",
        dot: "bg-zinc-900 dark:bg-zinc-200",
        pill: "text-zinc-900 border-zinc-200 bg-zinc-50 dark:text-zinc-50 dark:border-zinc-600/60 dark:bg-zinc-600/20",
      }
    case "backlog":
      return {
        label: "Backlog",
        dot: "bg-orange-600 dark:bg-orange-400",
        pill: "text-orange-700 border-orange-200 bg-orange-50 dark:text-orange-100 dark:border-orange-500/40 dark:bg-orange-500/10",
      }
    case "completed":
      return {
        label: "Completed",
        dot: "bg-blue-600 dark:bg-blue-400",
        pill: "text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-100 dark:border-blue-500/40 dark:bg-blue-500/10",
      }
    case "cancelled":
      return {
        label: "Cancelled",
        dot: "bg-rose-600 dark:bg-rose-400",
        pill: "text-rose-700 border-rose-200 bg-rose-50 dark:text-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10",
      }
    default:
      return {
        label: status,
        dot: "bg-zinc-400 dark:bg-zinc-300",
        pill: "text-zinc-700 border-zinc-200 bg-zinc-50 dark:text-zinc-100 dark:border-zinc-600/60 dark:bg-zinc-600/20",
      }
  }
}

export function MemberWorkspaceProjectCard({
  project,
  actions,
  onEditProject,
  variant = "list",
  visibleProperties = ["title", "status", "assignee", "dueDate"],
}: MemberWorkspaceProjectCardProps) {
  const router = useRouter()
  const status = getStatusConfig(project.status)
  const assignee = project.members[0]
  const isBoard = variant === "board"
  const draggingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const initials = useMemo(() => {
    if (!assignee) return null
    return assignee
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [assignee])

  const secondaryLine = (() => {
    const summary = [project.client, project.typeLabel, project.durationLabel].filter(Boolean)
    if (summary.length > 0) {
      return summary.join(" • ")
    }
    if (project.tags.length > 0) {
      return project.tags.join(" • ")
    }
    return ""
  })()

  const showStatus = visibleProperties.includes("status")
  const showAssignee = visibleProperties.includes("assignee")
  const showDueDate = visibleProperties.includes("dueDate")

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open project ${project.name}`}
      onClick={() => {
        if (isBoard && draggingRef.current) {
          draggingRef.current = false
          return
        }
        router.push(`/projects/${project.id}`)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          router.push(`/projects/${project.id}`)
        }
      }}
      onMouseDown={(event) => {
        if (!isBoard) return
        startPosRef.current = { x: event.clientX, y: event.clientY }
        draggingRef.current = false
      }}
      onMouseMove={(event) => {
        if (!isBoard || !startPosRef.current) return
        const dx = Math.abs(event.clientX - startPosRef.current.x)
        const dy = Math.abs(event.clientY - startPosRef.current.y)
        if (dx > 5 || dy > 5) {
          draggingRef.current = true
        }
      }}
      onMouseUp={() => {
        if (!isBoard) return
        startPosRef.current = null
      }}
      className="cursor-pointer rounded-2xl border border-border bg-background transition-shadow hover:shadow-lg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {isBoard ? (
            showDueDate ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag className="h-4 w-4" />
                <span>{format(project.endDate, "MMM d")}</span>
              </div>
            ) : (
              <div className="h-4" />
            )
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Folder className="h-5 w-5" />
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isBoard && showStatus ? (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  status.pill,
                )}
              >
                <span className={cn("inline-block size-1.5 rounded-full", status.dot)} />
                {status.label}
              </div>
            ) : (
              <MemberWorkspaceProjectPriorityBadge level={project.priority} appearance="inline" />
            )}
            {actions || onEditProject ? (
              <div
                className="flex shrink-0 items-center gap-1"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {actions}
                {onEditProject ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => onEditProject(project)}
                  >
                    <PencilSimpleLine />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[15px] font-semibold leading-6 text-foreground">{project.name}</p>
          {secondaryLine ? (
            <p className={cn("mt-1 text-sm text-muted-foreground", isBoard && "truncate")}>
              {secondaryLine}
            </p>
          ) : null}
        </div>

        {!isBoard ? (
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            {showDueDate ? (
              <div className="flex items-center gap-2">
                <CalendarBlank className="h-4 w-4" />
                <span>{format(project.endDate, "MMM d, yyyy")}</span>
              </div>
            ) : (
              <div />
            )}
            <MemberWorkspaceProjectPriorityBadge level={project.priority} appearance="inline" />
          </div>
        ) : null}

        <div className="mt-4 border-t border-border/60" />

        <div className="mt-3 flex items-center justify-between">
          <MemberWorkspaceProjectProgress project={project} size={isBoard ? 20 : 18} />
          {showAssignee ? (
            <Avatar className="size-6 border border-border">
              <AvatarFallback className="text-xs">
                {initials ? initials : <User className="h-4 w-4 text-muted-foreground" />}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="size-6" />
          )}
        </div>
      </div>
    </div>
  )
}
