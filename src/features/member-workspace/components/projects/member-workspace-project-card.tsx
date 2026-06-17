"use client"

import type { ReactNode } from "react"
import { useMemo, useRef } from "react"
import { format } from "date-fns"
import {
  CalendarBlank,
  Flag,
  Folder,
  PencilSimpleLine,
  User,
} from "@phosphor-icons/react/dist/ssr"
import { useRouter } from "next/navigation"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MemberWorkspaceProjectPriorityBadge } from "./member-workspace-project-priority"
import { MemberWorkspaceProjectProgress } from "./member-workspace-project-progress"
import {
  buildMemberWorkspaceProjectCardReactGrabOwnerId,
  getMemberWorkspaceProjectCardReactGrabOwnerProps,
  getMemberWorkspaceProjectCardReactGrabSurfaceProps,
  type MemberWorkspaceProjectCardReactGrabSurfaceKind,
} from "./member-workspace-project-card-react-grab"

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
  const primaryPersonName =
    project.primaryPersonName ?? project.members[0] ?? null
  const primaryPersonAvatarUrl = project.primaryPersonAvatarUrl ?? null
  const isBoard = variant === "board"
  const draggingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const initials = useMemo(() => {
    if (!primaryPersonName) return null
    return primaryPersonName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [primaryPersonName])

  const secondaryLine = (() => {
    if (project.projectKind === "organization_admin") {
      const summary = [
        primaryPersonName ? `Created by ${primaryPersonName}` : null,
        project.typeLabel,
        project.client,
        project.durationLabel,
      ].filter(Boolean)
      if (summary.length > 0) {
        return summary.join(" • ")
      }
    }

    const summary = [
      project.client,
      project.typeLabel,
      project.durationLabel,
    ].filter(Boolean)
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
  const reactGrabOwnerId = buildMemberWorkspaceProjectCardReactGrabOwnerId({
    projectId: project.id,
    variant,
  })
  const reactGrabSurface = (
    slot: string,
    surfaceKind?: MemberWorkspaceProjectCardReactGrabSurfaceKind
  ) =>
    getMemberWorkspaceProjectCardReactGrabSurfaceProps({
      ownerId: reactGrabOwnerId,
      slot,
      surfaceKind,
    })

  return (
    <div
      {...getMemberWorkspaceProjectCardReactGrabOwnerProps({
        ownerId: reactGrabOwnerId,
        variant,
      })}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.projectKind === "organization_admin" ? "organization" : "project"} ${project.name}`}
      onClick={() => {
        if (isBoard && draggingRef.current) {
          draggingRef.current = false
          return
        }
        router.push(`/organizations/${project.id}`)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          router.push(`/organizations/${project.id}`)
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
      className="border-border bg-background focus-visible:ring-ring/50 flex h-full cursor-pointer flex-col rounded-2xl border transition-shadow hover:shadow-lg/5 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div {...reactGrabSurface("body")} className="flex flex-1 flex-col p-4">
        <div
          {...reactGrabSurface("header-row")}
          className="flex items-center justify-between"
        >
          {isBoard ? (
            showDueDate ? (
              <div
                {...reactGrabSurface("board-due-date", "content")}
                className="text-muted-foreground flex items-center gap-1.5 text-xs"
              >
                <Flag className="h-4 w-4" />
                <span>{format(project.endDate, "MMM d")}</span>
              </div>
            ) : (
              <div className="h-4" />
            )
          ) : (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Folder className="h-5 w-5" />
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isBoard && showStatus ? (
              <div
                {...reactGrabSurface("status-pill", "indicator")}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  status.pill
                )}
              >
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    status.dot
                  )}
                />
                {status.label}
              </div>
            ) : (
              <span {...reactGrabSurface("header-priority", "indicator")}>
                <MemberWorkspaceProjectPriorityBadge
                  level={project.priority}
                  appearance="inline"
                />
              </span>
            )}
            {actions || onEditProject ? (
              <div
                {...reactGrabSurface("actions")}
                className="flex shrink-0 items-center gap-1"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {actions}
                {onEditProject ? (
                  <Button
                    {...reactGrabSurface("edit-button", "trigger")}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${project.name}`}
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

        <div {...reactGrabSurface("title-block", "content")} className="mt-3">
          <p
            {...reactGrabSurface("title", "content")}
            className="text-foreground text-[15px] leading-6 font-semibold"
          >
            {project.name}
          </p>
          {secondaryLine ? (
            <p
              {...reactGrabSurface("metadata", "content")}
              className={cn(
                "text-muted-foreground mt-1 text-sm",
                isBoard && "truncate"
              )}
            >
              {secondaryLine}
            </p>
          ) : null}
        </div>

        <div {...reactGrabSurface("footer")} className="mt-auto pt-4">
          {!isBoard ? (
            <div
              {...reactGrabSurface("date-priority-row", "content")}
              className="text-muted-foreground mb-4 flex items-center justify-between text-sm"
            >
              {showDueDate ? (
                <div
                  {...reactGrabSurface("due-date", "content")}
                  className="flex items-center gap-2"
                >
                  <CalendarBlank className="h-4 w-4" />
                  <span>{format(project.endDate, "MMM d, yyyy")}</span>
                </div>
              ) : (
                <div />
              )}
              <span {...reactGrabSurface("priority", "indicator")}>
                <MemberWorkspaceProjectPriorityBadge
                  level={project.priority}
                  appearance="inline"
                />
              </span>
            </div>
          ) : null}

          <div
            {...reactGrabSurface("footer-separator", "content")}
            className="border-border/60 border-t"
          />

          <div
            {...reactGrabSurface("progress-row", "content")}
            className="mt-3 flex items-center justify-between"
          >
            <MemberWorkspaceProjectProgress
              project={project}
              size={isBoard ? 20 : 18}
            />
            {showAssignee ? (
              <Avatar
                {...reactGrabSurface("assignee-avatar", "content")}
                className="border-border size-6 border"
              >
                {primaryPersonAvatarUrl ? (
                  <AvatarImage
                    src={primaryPersonAvatarUrl}
                    alt={primaryPersonName ?? project.name}
                  />
                ) : null}
                <AvatarFallback className="text-xs">
                  {initials ? (
                    initials
                  ) : (
                    <User className="text-muted-foreground h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="size-6" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
