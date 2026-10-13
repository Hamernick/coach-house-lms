"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { DotsThreeVertical, Plus } from "@phosphor-icons/react/dist/ssr"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

import type { ProjectDetails, ProjectTask } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { getProjectTasks } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import type { FilterChip as FilterChipType } from "@/features/platform-admin-dashboard/upstream/lib/view-options"
import { Button } from "@/features/platform-admin-dashboard/upstream/components/ui/button"
import { Badge } from "@/features/platform-admin-dashboard/upstream/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/features/platform-admin-dashboard/upstream/components/ui/avatar"
import { FilterPopover } from "@/features/platform-admin-dashboard/upstream/components/filter-popover"
import { ChipOverflow } from "@/features/platform-admin-dashboard/upstream/components/chip-overflow"
import { TaskRowBase } from "@/features/platform-admin-dashboard/upstream/components/tasks/TaskRowBase"
import {
  computeTaskFilterCounts,
  filterTasksByChips,
} from "@/features/platform-admin-dashboard/upstream/components/tasks/task-helpers"
import { cn } from "@/features/platform-admin-dashboard/upstream/lib/utils"
import type { CreateTaskContext } from "@/features/platform-admin-dashboard/upstream/components/tasks/TaskQuickCreateModal"

type ProjectTasksTabProps = {
  project: ProjectDetails
  canReorder?: boolean
  onCreateTask?: (context?: CreateTaskContext) => void
  onUpdateTaskStatus?: (
    taskId: string,
    nextStatus: ProjectTask["status"],
  ) => Promise<{ ok: true; taskId: string; status: ProjectTask["status"] } | { error: string }>
  onReorderTasks?: (
    projectId: string,
    orderedTaskIds: string[],
  ) => Promise<{ ok: true; projectId: string } | { error: string }>
}

export function ProjectTasksTab({
  project,
  canReorder = true,
  onCreateTask,
  onUpdateTaskStatus,
  onReorderTasks,
}: ProjectTasksTabProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>(() => getProjectTasks(project))
  const [filters, setFilters] = useState<FilterChipType[]>([])
  const [, startTransition] = useTransition()

  useEffect(() => {
    setTasks(getProjectTasks(project))
  }, [project])

  const counts = useMemo(() => computeTaskFilterCounts(tasks, filters), [tasks, filters])
  const canCreateTask = Boolean(onCreateTask)
  const canToggleTasks = Boolean(onUpdateTaskStatus)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const memberOptions = useMemo(() => {
    const options = new Map<
      string,
      { id: string; label: string; avatar?: string | null; countKey: string }
    >()

    if (tasks.some((task) => !task.assignee)) {
      options.set("no-member", {
        id: "no-member",
        label: "No member",
        countKey: "no-member",
      })
    }

    for (const task of tasks) {
      const assignee = task.assignee
      if (!assignee) continue
      const key = assignee.name.trim().toLowerCase()
      if (options.has(key)) continue
      options.set(key, {
        id: assignee.id,
        label: assignee.name,
        avatar: assignee.avatarUrl ?? undefined,
        countKey: key,
      })
    }

    return Array.from(options.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    )
  }, [tasks])

  const filteredTasks = useMemo(
    () => filterTasksByChips(tasks, filters),
    [tasks, filters],
  )

  const toggleTask = (taskId: string) => {
    if (!canToggleTasks) {
      return
    }

    const currentTask = tasks.find((task) => task.id === taskId)
    if (!currentTask) return

    const nextStatus = currentTask.status === "done" ? "todo" : "done"
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task,
      ),
    )

    startTransition(async () => {
      const result = await onUpdateTaskStatus!(taskId, nextStatus)
      if ("error" in result) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: currentTask.status,
                }
              : task,
          ),
        )
        toast.error(result.error)
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const previousTasks = tasks
      const nextTasks = arrayMove(
        previousTasks,
        previousTasks.findIndex((item) => item.id === active.id),
        previousTasks.findIndex((item) => item.id === over.id),
      )

      setTasks(nextTasks)

      if (!onReorderTasks) {
        return
      }

      startTransition(async () => {
        const result = await onReorderTasks(
          project.id,
          nextTasks.map((task) => task.id),
        )
        if ("error" in result) {
          setTasks(previousTasks)
          toast.error(result.error)
        }
      })
    }
  }

  if (!tasks.length) {
    return (
      <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
        No tasks defined yet.
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-workstream)]">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <FilterPopover
            initialChips={filters}
            onApply={setFilters}
            onClear={() => setFilters([])}
            counts={counts}
            memberOptions={memberOptions}
          />
          <ChipOverflow
            chips={filters}
            onRemove={(key, value) =>
              setFilters((prev) => prev.filter((chip) => !(chip.key === key && chip.value === value)))
            }
            maxVisible={4}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-border/60 bg-transparent px-3 text-xs font-medium"
          >
            View
          </Button>
          {canCreateTask ? (
            <Button
              size="sm"
              className="h-8 rounded-lg px-3 text-xs font-medium"
              type="button"
              onClick={() =>
                onCreateTask?.({
                  projectId: project.id,
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Task
            </Button>
          ) : null}
        </div>
      </header>

      <div className="space-y-1 px-2 py-3">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext items={filteredTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {filteredTasks.map((task) => (
              <TaskRowDnD
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                canReorder={canReorder}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  )
}

type TaskBadgesProps = {
  workstreamName?: string
}

function TaskBadges({ workstreamName }: TaskBadgesProps) {
  if (!workstreamName) return null

  return (
    <Badge variant="muted" className="whitespace-nowrap text-[11px]">
      {workstreamName}
    </Badge>
  )
}

type TaskStatusProps = {
  status: ProjectTask["status"]
}

function TaskStatus({ status }: TaskStatusProps) {
  const label = getStatusLabel(status)
  const color = getStatusColor(status)

  return <span className={cn("font-medium", color)}>{label}</span>
}

function getStatusLabel(status: ProjectTask["status"]): string {
  switch (status) {
    case "done":
      return "Done"
    case "in-progress":
      return "In Progress"
    default:
      return "To do"
  }
}

function getStatusColor(status: ProjectTask["status"]): string {
  switch (status) {
    case "done":
      return "text-emerald-500"
    case "in-progress":
      return "text-amber-500"
    default:
      return "text-muted-foreground"
  }
}

type TaskRowDnDProps = {
  task: ProjectTask
  onToggle: () => void
  canReorder?: boolean
}

function TaskRowDnD({ task, onToggle, canReorder = true }: TaskRowDnDProps) {
  const isDone = task.status === "done"

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canReorder,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRowBase
        checked={isDone}
        title={task.name}
        onCheckedChange={onToggle}
        titleAriaLabel={task.name}
        titleSuffix={<TaskBadges workstreamName={task.workstreamName} />}
        meta={
          <>
            <TaskStatus status={task.status} />
            {task.dueLabel && (
              <span className="text-muted-foreground">{task.dueLabel}</span>
            )}
            {task.assignee && (
              <Avatar className="size-6">
                {task.assignee.avatarUrl && (
                  <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                )}
                <AvatarFallback>{task.assignee.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            {canReorder ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="size-7 rounded-md text-muted-foreground cursor-grab active:cursor-grabbing"
                aria-label="Reorder task"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                {...attributes}
                {...listeners}
              >
                <DotsThreeVertical className="h-4 w-4" weight="regular" />
              </Button>
            ) : null}
          </>
        }
        className={isDragging ? "opacity-60" : ""}
      />
    </div>
  )
}
