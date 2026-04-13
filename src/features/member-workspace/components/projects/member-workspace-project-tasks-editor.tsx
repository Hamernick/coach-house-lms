"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  PencilSimpleLine,
  Plus,
  Trash,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"

import type {
  CreateTaskContext,
  ProjectDetails,
  ProjectTask,
} from "@/features/platform-admin-dashboard"
import { Button } from "@/components/ui/button"
import type {
  MemberWorkspaceCreateTaskInput,
  MemberWorkspacePersonOption,
} from "../../types"
import {
  buildTaskDraft,
  buildTaskInput,
  formatTaskDateLabel,
  moveArrayItem,
  NEW_TASK_ID,
  TaskInlineForm,
  TaskToneBadge,
  type TaskDraft,
} from "./member-workspace-project-task-editor-shared"

function getProjectTasks(details: ProjectDetails): ProjectTask[] {
  return (details.workstreams ?? []).flatMap((group) =>
    group.tasks.map((task) => ({
      ...task,
      projectId: details.id,
      projectName: details.name,
      workstreamId: group.id,
      workstreamName: group.name,
    })),
  )
}

type MemberWorkspaceProjectTasksEditorProps = {
  assigneeOptions: MemberWorkspacePersonOption[]
  createTaskAction?: (
    input: MemberWorkspaceCreateTaskInput
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
  deleteTaskAction?: (
    taskId: string
  ) => Promise<{ ok: true; taskId: string; projectId: string } | { error: string }>
  onPendingCreateContextHandled?: () => void
  pendingCreateContext?: CreateTaskContext
  project: ProjectDetails
  updateTaskOrderAction?: (
    projectId: string,
    orderedTaskIds: string[]
  ) => Promise<{ ok: true; projectId: string } | { error: string }>
  updateTaskAction?: (
    taskId: string,
    input: MemberWorkspaceCreateTaskInput
  ) => Promise<{ ok: true; taskId: string } | { error: string }>
}

export function MemberWorkspaceProjectTasksEditor({
  project,
  assigneeOptions,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  updateTaskOrderAction,
  pendingCreateContext,
  onPendingCreateContextHandled,
}: MemberWorkspaceProjectTasksEditorProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<ProjectTask[]>(() => getProjectTasks(project))
  const [draftTargetId, setDraftTargetId] = useState<string | null>(null)
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)

  useEffect(() => {
    setTasks(getProjectTasks(project))
  }, [project])

  useEffect(() => {
    if (!pendingCreateContext) {
      return
    }

    setDraftTargetId(NEW_TASK_ID)
    setTaskDraft(
      buildTaskDraft({
        project,
        context: pendingCreateContext,
      }),
    )
    onPendingCreateContextHandled?.()
  }, [onPendingCreateContextHandled, pendingCreateContext, project])

  const workstreamSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...project.workstreams.map((workstream) => workstream.name.trim()),
            ...tasks.map((task) => task.workstreamName?.trim() ?? ""),
          ].filter(Boolean),
        ),
      ),
    [project.workstreams, tasks],
  )

  const handleChangeDraftField = useCallback(
    (field: keyof TaskDraft, value: string) => {
      setTaskDraft((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              [field]: value,
            }
          : currentDraft,
      )
    },
    [],
  )

  const handleStartCreateTask = useCallback(
    (context?: CreateTaskContext) => {
      setDraftTargetId(NEW_TASK_ID)
      setTaskDraft(
        buildTaskDraft({
          project,
          context,
        }),
      )
    },
    [project],
  )

  const handleStartEditTask = useCallback(
    (task: ProjectTask) => {
      setDraftTargetId(task.id)
      setTaskDraft(
        buildTaskDraft({
          project,
          task,
        }),
      )
    },
    [project],
  )

  const handleCancelDraft = useCallback(() => {
    setDraftTargetId(null)
    setTaskDraft(null)
  }, [])

  const handleSaveTask = useCallback(async () => {
    if (!draftTargetId || !taskDraft) {
      return
    }

    const mutationInput = buildTaskInput({
      draft: taskDraft,
      projectId: project.id,
    })

    setSavingTaskId(draftTargetId)

    try {
      const result =
        draftTargetId === NEW_TASK_ID
          ? await createTaskAction?.(mutationInput)
          : await updateTaskAction?.(draftTargetId, mutationInput)

      if (!result) {
        toast.error("Task editing is unavailable.")
        return
      }

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(draftTargetId === NEW_TASK_ID ? "Task created" : "Task updated")
      handleCancelDraft()
      router.refresh()
    } finally {
      setSavingTaskId(null)
    }
  }, [
    createTaskAction,
    draftTargetId,
    handleCancelDraft,
    project.id,
    router,
    taskDraft,
    updateTaskAction,
  ])

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!deleteTaskAction) {
        toast.error("Task deletion is unavailable.")
        return
      }

      setDeletingTaskId(taskId)
      try {
        const result = await deleteTaskAction(taskId)
        if ("error" in result) {
          toast.error(result.error)
          return
        }

        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
        if (draftTargetId === taskId) {
          handleCancelDraft()
        }
        toast.success("Task deleted")
        router.refresh()
      } finally {
        setDeletingTaskId(null)
      }
    },
    [deleteTaskAction, draftTargetId, handleCancelDraft, router],
  )

  const handleMoveTask = useCallback(
    async (taskId: string, direction: -1 | 1) => {
      if (!updateTaskOrderAction) {
        toast.error("Task ordering is unavailable.")
        return
      }

      const currentIndex = tasks.findIndex((task) => task.id === taskId)
      const nextIndex = currentIndex + direction
      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= tasks.length) {
        return
      }

      const previousTasks = tasks
      const nextTasks = moveArrayItem(tasks, currentIndex, nextIndex)
      setTasks(nextTasks)
      setMovingTaskId(taskId)

      try {
        const result = await updateTaskOrderAction(
          project.id,
          nextTasks.map((task) => task.id),
        )

        if ("error" in result) {
          setTasks(previousTasks)
          toast.error(result.error)
          return
        }

        router.refresh()
      } finally {
        setMovingTaskId(null)
      }
    },
    [project.id, router, tasks, updateTaskOrderAction],
  )

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Tasks</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Task rows edit inline while the page stays in edit mode. Reordering uses
            explicit up and down controls so the layout remains touch-friendly on mobile.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => handleStartCreateTask()}>
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>

      {draftTargetId === NEW_TASK_ID && taskDraft ? (
        <div className="mt-5">
          <TaskInlineForm
            assigneeOptions={assigneeOptions}
            draft={taskDraft}
            formId="member-workspace-new-task"
            isNewTask
            isSaving={savingTaskId === NEW_TASK_ID}
            onCancel={handleCancelDraft}
            onChangeDraftField={handleChangeDraftField}
            onSave={handleSaveTask}
            workstreamSuggestions={workstreamSuggestions}
          />
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            No tasks yet. Add the first task inline without leaving the page.
          </div>
        ) : null}

        {tasks.map((task, index) => {
          const isEditingTask = draftTargetId === task.id && taskDraft
          const isDeleting = deletingTaskId === task.id
          const isMoving = movingTaskId === task.id

          return (
            <article
              key={task.id}
              className="rounded-2xl border border-border/70 bg-background/80 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                      {task.name}
                    </h3>
                    <TaskToneBadge
                      label={
                        task.status === "in-progress"
                          ? "In progress"
                          : task.status === "done"
                            ? "Done"
                            : "To do"
                      }
                    />
                    {task.workstreamName ? (
                      <TaskToneBadge label={task.workstreamName} tone="outline" />
                    ) : null}
                    {task.tag ? <TaskToneBadge label={task.tag} tone="outline" /> : null}
                  </div>

                  {task.description ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {task.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span>Start {formatTaskDateLabel(task.startDate)}</span>
                    <span>Due {formatTaskDateLabel(task.endDate ?? task.startDate)}</span>
                    <span>
                      {task.assignee ? `Assignee ${task.assignee.name}` : "Unassigned"}
                    </span>
                    <span>
                      Priority{" "}
                      {!task.priority || task.priority === "no-priority"
                        ? "None"
                        : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0 || isMoving}
                    onClick={() => handleMoveTask(task.id, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === tasks.length - 1 || isMoving}
                    onClick={() => handleMoveTask(task.id, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEditTask(task)}
                  >
                    <PencilSimpleLine className="h-4 w-4" />
                    Edit task
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

              {isEditingTask ? (
                <TaskInlineForm
                  assigneeOptions={assigneeOptions}
                  draft={taskDraft}
                  formId={`member-workspace-task-${task.id}`}
                  isSaving={savingTaskId === task.id}
                  onCancel={handleCancelDraft}
                  onChangeDraftField={handleChangeDraftField}
                  onDelete={() => handleDeleteTask(task.id)}
                  onSave={handleSaveTask}
                  workstreamSuggestions={workstreamSuggestions}
                />
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
