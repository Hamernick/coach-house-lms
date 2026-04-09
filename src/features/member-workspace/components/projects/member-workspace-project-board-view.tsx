"use client"

import { useEffect, useMemo, useState, useTransition, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { DotsThreeVertical, Plus, StackSimple, Spinner, CircleNotch, CheckCircle } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MemberWorkspaceProjectCard } from "./member-workspace-project-card"

const OPEN_COLUMN_ORDER: Array<PlatformAdminDashboardLabProject["status"]> = [
  "backlog",
  "planned",
  "active",
]

const CLOSED_COLUMN_ORDER: Array<PlatformAdminDashboardLabProject["status"]> = [
  "completed",
  "cancelled",
]

export function getMemberWorkspaceProjectBoardColumnOrder(showClosedProjects: boolean) {
  return showClosedProjects
    ? [...OPEN_COLUMN_ORDER, ...CLOSED_COLUMN_ORDER]
    : OPEN_COLUMN_ORDER
}

function getColumnStatusIcon(status: PlatformAdminDashboardLabProject["status"]) {
  switch (status) {
    case "backlog":
      return <StackSimple className="h-4 w-4 text-muted-foreground" />
    case "planned":
      return <Spinner className="h-4 w-4 text-muted-foreground" />
    case "active":
      return <CircleNotch className="h-4 w-4 text-muted-foreground" />
    case "completed":
      return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    default:
      return <StackSimple className="h-4 w-4 text-muted-foreground" />
  }
}

function getColumnStatusLabel(status: PlatformAdminDashboardLabProject["status"]) {
  switch (status) {
    case "backlog":
      return "Backlog"
    case "planned":
      return "Planned"
    case "active":
      return "Active"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

export function MemberWorkspaceProjectBoardView({
  projects,
  onAddProject,
  onEditProject,
  updateProjectStatusAction,
  showClosedProjects,
  visibleProperties,
}: {
  projects: PlatformAdminDashboardLabProject[]
  onAddProject?: () => void
  onEditProject?: (project: PlatformAdminDashboardLabProject) => void
  updateProjectStatusAction?: (
    projectId: string,
    status: PlatformAdminDashboardLabProject["status"],
  ) => Promise<{ ok: true; id: string } | { error: string }>
  showClosedProjects: boolean
  visibleProperties?: Array<"title" | "status" | "assignee" | "dueDate">
}) {
  const router = useRouter()
  const [items, setItems] = useState<PlatformAdminDashboardLabProject[]>(projects)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [pendingProjectIds, setPendingProjectIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const canManageBoard = Boolean(updateProjectStatusAction)
  const columnOrder = useMemo(
    () => getMemberWorkspaceProjectBoardColumnOrder(showClosedProjects),
    [showClosedProjects],
  )

  useEffect(() => {
    setItems(projects)
  }, [projects])

  const groups = useMemo(() => {
    const grouped = new Map<PlatformAdminDashboardLabProject["status"], PlatformAdminDashboardLabProject[]>()
    for (const status of columnOrder) {
      grouped.set(status, [])
    }
    for (const project of items) {
      if (!grouped.has(project.status)) {
        if (showClosedProjects) {
          continue
        }
        if (project.status === "completed" || project.status === "cancelled") {
          continue
        }
      }
      grouped.get(project.status)?.push(project)
    }
    return grouped
  }, [columnOrder, items, showClosedProjects])

  const commitProjectStatus = (
    projectId: string,
    status: PlatformAdminDashboardLabProject["status"],
  ) => {
    if (!updateProjectStatusAction) {
      return
    }

    const previousItems = items
    setItems((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, status } : project,
      ),
    )
    setPendingProjectIds((current) => Array.from(new Set([...current, projectId])))

    startTransition(async () => {
      const result = await updateProjectStatusAction(projectId, status)

      setPendingProjectIds((current) => current.filter((value) => value !== projectId))

      if ("error" in result) {
        setItems(previousItems)
        toast.error(result.error)
        return
      }

      router.refresh()
    })
  }

  const handleDropTo =
    (status: PlatformAdminDashboardLabProject["status"]) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const id = event.dataTransfer.getData("text/id")
      if (!id) return
      setDraggingId(null)
      commitProjectStatus(id, status)
    }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {columnOrder.map((status) => (
          <div
            key={status}
            className="rounded-xl bg-muted"
            onDragOver={canManageBoard ? handleDragOver : undefined}
            onDrop={canManageBoard ? handleDropTo(status) : undefined}
          >
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                {getColumnStatusIcon(status)}
                <span className="inline-flex items-center gap-1 text-sm font-medium">
                  {getColumnStatusLabel(status)}
                </span>
                <span className="text-xs text-muted-foreground">{groups.get(status)?.length ?? 0}</span>
              </div>
              <div className="flex items-center gap-1">
                {onAddProject ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    type="button"
                    onClick={onAddProject}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  type="button"
                  disabled={isPending || !canManageBoard}
                >
                  <DotsThreeVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-[120px] space-y-3 px-3 pb-3">
              {(groups.get(status) ?? []).map((project) => (
                <div
                  key={project.id}
                  draggable={canManageBoard}
                  aria-disabled={pendingProjectIds.includes(project.id)}
                  className={
                    draggingId === project.id
                      ? "cursor-grabbing opacity-70"
                      : canManageBoard
                        ? "cursor-grab"
                        : ""
                  }
                  onDragStart={(event) => {
                    if (!canManageBoard || pendingProjectIds.includes(project.id)) {
                      event.preventDefault()
                      return
                    }
                    event.dataTransfer.setData("text/id", project.id)
                    setDraggingId(project.id)
                  }}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <MemberWorkspaceProjectCard
                    project={project}
                    variant="board"
                    onEditProject={onEditProject}
                    visibleProperties={visibleProperties}
                    actions={canManageBoard ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            disabled={pendingProjectIds.includes(project.id)}
                            type="button"
                          >
                            <DotsThreeVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2" align="end">
                          <div className="space-y-1">
                            {getMemberWorkspaceProjectBoardColumnOrder(true).map((nextStatus) => (
                              <button
                                key={nextStatus}
                                type="button"
                                className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-accent"
                                onClick={() => commitProjectStatus(project.id, nextStatus)}
                              >
                                Move to {getColumnStatusLabel(nextStatus)}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : undefined}
                  />
                </div>
              ))}
              {onAddProject ? (
                <Button variant="ghost" size="sm" type="button" onClick={onAddProject}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add project
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
