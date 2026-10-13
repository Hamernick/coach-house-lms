"use client"

import Link from "next/link"
import { useMemo } from "react"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import FileStackIcon from "lucide-react/dist/esm/icons/file-stack"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import PlayIcon from "lucide-react/dist/esm/icons/play"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useWorkspaceAcceleratorCardController } from "../hooks/use-workspace-accelerator-card-controller"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorStepKind,
  WorkspaceAcceleratorTask,
  WorkspaceAcceleratorTaskStatus,
} from "../types"

type WorkspaceAcceleratorCardPanelProps = {
  input: WorkspaceAcceleratorCardInput
}

const TASK_COLUMNS: Array<{ id: WorkspaceAcceleratorTaskStatus; label: string }> = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
]

function resolveStepKindLabel(kind: WorkspaceAcceleratorStepKind) {
  if (kind === "lesson") return "Lesson"
  if (kind === "video") return "Video"
  if (kind === "resources") return "Resources"
  if (kind === "assignment") return "Assignment"
  return "Deck"
}

function formatDueDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsed)
}

function TaskCard({
  task,
  onToggle,
  canToggle,
}: {
  task: WorkspaceAcceleratorTask
  onToggle: (taskId: string) => void
  canToggle: boolean
}) {
  const dueLabel = formatDueDate(task.dueAt ?? null)
  const isDone = task.status === "done"
  const isInProgress = task.status === "in_progress"

  const content = (
    <div className="space-y-1">
      <p className={cn("line-clamp-2 text-[11px] font-medium leading-snug", isDone && "text-muted-foreground line-through")}>
        {task.title}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {dueLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Clock3Icon className="h-3 w-3" aria-hidden />
            {dueLabel}
          </span>
        ) : null}
        {task.priority && task.priority !== "normal" ? (
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {task.priority}
          </span>
        ) : null}
      </div>
      <span className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px]",
        isDone
          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : isInProgress
            ? "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300"
            : "border-border/70 bg-background/70 text-muted-foreground",
      )}>
        {task.status === "todo" ? "Not started" : task.status === "in_progress" ? "In progress" : "Completed"}
      </span>
    </div>
  )

  if (!canToggle) {
    return (
      <div className="rounded-md border border-border/60 bg-background/65 px-2 py-1.5">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="w-full rounded-md border border-border/60 bg-background/65 px-2 py-1.5 text-left transition-colors hover:bg-muted/35"
      onClick={() => onToggle(task.id)}
      aria-label={`Advance task: ${task.title}`}
    >
      {content}
    </button>
  )
}

export function WorkspaceAcceleratorCardPanel({ input }: WorkspaceAcceleratorCardPanelProps) {
  const controller = useWorkspaceAcceleratorCardController(input)
  const currentStep = controller.currentStep
  const currentModuleStepDisplayIndex = controller.currentModuleStepIndex + 1

  const completedSetupSteps = useMemo(
    () => controller.steps.filter((step) => step.status === "completed").length,
    [controller.steps],
  )
  const setupProgressPercent =
    controller.steps.length > 0 ? Math.round((completedSetupSteps / controller.steps.length) * 100) : 0

  const tasksByStatus = useMemo(() => {
    const groups: Record<WorkspaceAcceleratorTaskStatus, WorkspaceAcceleratorTask[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }
    for (const task of controller.tasks) {
      groups[task.status].push(task)
    }
    return groups
  }, [controller.tasks])

  const todoCount = tasksByStatus.todo.length
  const inProgressCount = tasksByStatus.in_progress.length
  const doneCount = tasksByStatus.done.length
  const totalTaskCount = controller.tasks.length
  const completedTaskPercent = totalTaskCount > 0 ? Math.round((doneCount / totalTaskCount) * 100) : 0

  const handleTaskToggle = (taskId: string) => {
    if (!controller.allowTaskUpdates || !controller.onTaskStatusToggle) return
    controller.onTaskStatusToggle(taskId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center rounded-full border border-border/70 bg-background/60 p-0.5">
          <button
            type="button"
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] font-medium transition-colors",
              controller.mode === "setup"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => controller.setMode("setup")}
          >
            Setup
          </button>
          <button
            type="button"
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] font-medium transition-colors",
              controller.mode === "tasks"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => controller.setMode("tasks")}
          >
            Tasks
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {controller.mode === "setup"
            ? `${completedSetupSteps}/${controller.steps.length || 0} complete`
            : `${doneCount}/${totalTaskCount || 0} done`}
        </span>
      </div>

      {controller.mode === "tasks" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {totalTaskCount === 0 ? (
            <div className="flex h-full min-h-0 flex-col justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Team tasks will appear here as you create objectives in the workspace.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="self-start rounded-full text-xs"
                onClick={() => controller.setMode("setup")}
              >
                Open setup
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border/60 bg-background/55 px-2.5 py-2">
                <p className="text-[11px] font-medium text-foreground">Accelerator tasks</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-1.5 py-0.5 tabular-nums">{todoCount} to do</span>
                  <span className="rounded-full border border-border/70 px-1.5 py-0.5 tabular-nums">{inProgressCount} in progress</span>
                  <span className="rounded-full border border-border/70 px-1.5 py-0.5 tabular-nums">{doneCount} done</span>
                  <span className="rounded-full border border-border/70 px-1.5 py-0.5 tabular-nums">{completedTaskPercent}% complete</span>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
                {TASK_COLUMNS.map((column) => (
                  <section
                    key={column.id}
                    className="flex min-h-0 flex-col rounded-lg border border-border/60 bg-background/45 p-1.5"
                    aria-label={`${column.label} tasks`}
                  >
                    <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {column.label}
                      <span className="ml-1 tabular-nums">
                        ({tasksByStatus[column.id].length})
                      </span>
                    </p>
                    <div className="mt-1 min-h-0 flex-1 overflow-auto space-y-1 pr-0.5">
                      {tasksByStatus[column.id].map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={handleTaskToggle}
                          canToggle={controller.allowTaskUpdates}
                        />
                      ))}
                      {tasksByStatus[column.id].length === 0 ? (
                        <div className="rounded-md border border-dashed border-border/60 px-2 py-2 text-[10px] text-muted-foreground">
                          No tasks
                        </div>
                      ) : null}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      ) : !currentStep ? (
        <div className="flex h-full min-h-0 flex-col justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Accelerator lessons will appear here once your roadmap is available.
          </p>
          <Button asChild size="sm" variant="outline" className="self-start rounded-full text-xs">
            <Link href="/accelerator">
              Open accelerator
            </Link>
          </Button>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">
                {currentStep.groupTitle} · Module {currentStep.moduleSequenceIndex}/{currentStep.moduleSequenceTotal}
              </p>
              <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{currentStep.moduleTitle}</p>
            </div>
            <div className="nodrag nopan flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={controller.goPrevious}
                disabled={!controller.canGoPrevious}
                aria-label="Previous accelerator lesson"
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={controller.goNext}
                disabled={!controller.canGoNext}
                aria-label="Next accelerator lesson"
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
              {resolveStepKindLabel(currentStep.stepKind)}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              Step {currentModuleStepDisplayIndex}/{Math.max(controller.currentModuleSteps.length, 1)}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              ({currentStep.stepSequenceIndex}/{currentStep.stepSequenceTotal})
            </span>
          </div>

          {currentStep.stepDescription ? (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{currentStep.stepDescription}</p>
          ) : null}

          {currentStep.stepKind === "lesson" && !currentStep.stepDescription ? (
            <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2 text-[11px] text-muted-foreground">
              Work through this lesson in sequence, then continue to the next step.
            </div>
          ) : null}

          {currentStep.stepKind === "video" && currentStep.videoUrl ? (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/25">
              <video
                src={currentStep.videoUrl}
                className="h-24 w-full object-cover"
                controls
                playsInline
                preload="metadata"
              />
            </div>
          ) : currentStep.stepKind === "video" ? (
            <div className="grid h-20 place-items-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-muted-foreground">
              <PlayIcon className="h-4 w-4" aria-hidden />
            </div>
          ) : null}

          {currentStep.stepKind === "resources" && currentStep.resources.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Resources</p>
              <div className="space-y-1">
                {currentStep.resources.slice(0, 3).map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-border/55 bg-background/70 px-2 py-1 text-[11px] transition-colors hover:bg-muted/25"
                  >
                    <FileStackIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{resource.title}</span>
                    <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" aria-hidden />
                  </a>
                ))}
                {currentStep.resources.length > 3 ? (
                  <p className="px-0.5 text-[10px] text-muted-foreground tabular-nums">
                    +{currentStep.resources.length - 3} more resources
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {currentStep.stepKind === "resources" && currentStep.resources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-background/40 px-2 py-2 text-[11px] text-muted-foreground">
              No resources attached to this lesson yet.
            </div>
          ) : null}

          {currentStep.stepKind === "assignment" ? (
            <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2 text-[11px] text-muted-foreground">
              Submit this lesson assignment to advance progression and unlock next modules.
            </div>
          ) : null}

          {currentStep.stepKind === "deck" ? (
            <div className="rounded-lg border border-border/60 bg-background/60 px-2 py-2 text-[11px] text-muted-foreground">
              Supporting deck materials are available for this lesson.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            {controller.currentModuleSteps.map((moduleStep, index) => {
              const active = moduleStep.id === currentStep.id
              const completed = moduleStep.status === "completed"
              return (
                <span
                  key={moduleStep.id}
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[10px]",
                    active
                      ? "border-foreground/30 bg-foreground/10 text-foreground"
                      : completed
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-border/70 text-muted-foreground",
                  )}
                >
                  {completed ? (
                    <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden />
                  ) : active ? (
                    <CircleIcon className="h-3.5 w-3.5 fill-current" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
              )
            })}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {currentStep.durationMinutes ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                  {currentStep.durationMinutes} min
                </span>
              ) : null}
              {currentStep.hasAssignment ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <ListChecksIcon className="mr-1 h-3 w-3" aria-hidden />
                  Assignment
                </span>
              ) : null}
              {currentStep.hasDeck ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Deck
                </span>
              ) : null}
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">{setupProgressPercent}% setup complete</span>
          </div>
        </div>
      )}
    </div>
  )
}
