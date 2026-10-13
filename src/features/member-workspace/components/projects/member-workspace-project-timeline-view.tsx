"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addDays, addWeeks, differenceInCalendarDays, format, startOfWeek, subWeeks } from "date-fns"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import {
  FIXED_TODAY,
  TimelineCanvas,
  TimelineConfirmDialog,
  TimelineEditDialog,
  TimelineSidebar,
  TimelineToolbar,
  type TimelineConfirmDialogState,
  type TimelineEditDialogState,
  type TimelineViewMode,
} from "./member-workspace-project-timeline-parts"
import { toast } from "@/lib/toast"

function getViewStartForToday() {
  return startOfWeek(addWeeks(FIXED_TODAY, -1), { weekStartsOn: 1 })
}

function getDaysToRender(viewMode: TimelineViewMode) {
  if (viewMode === "Day") return 21
  if (viewMode === "Week") return 60
  if (viewMode === "Month") return 90
  return 120
}

function getBaseCellWidth(viewMode: TimelineViewMode) {
  if (viewMode === "Day") return 140
  if (viewMode === "Week") return 60
  if (viewMode === "Month") return 40
  return 20
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function replaceProjectDuration(
  projects: PlatformAdminDashboardLabProject[],
  projectId: string,
  newStart: Date,
  newEnd: Date,
) {
  return projects.map((project) =>
    project.id === projectId
      ? { ...project, startDate: newStart, endDate: newEnd }
      : project,
  )
}

function shiftProjectStartWithTasks(
  projects: PlatformAdminDashboardLabProject[],
  projectId: string,
  newStart: Date,
) {
  return projects.map((project) => {
    if (project.id !== projectId) return project
    const durationDays = differenceInCalendarDays(project.endDate, project.startDate) + 1
    const newEnd = addDays(newStart, durationDays - 1)
    const diff = differenceInCalendarDays(newStart, project.startDate)

    return {
      ...project,
      startDate: newStart,
      endDate: newEnd,
      tasks:
        project.tasks.length > 0
          ? project.tasks.map((task) => ({
              ...task,
              startDate: addDays(task.startDate, diff),
              endDate: addDays(task.endDate, diff),
            }))
          : project.tasks,
    }
  })
}

export function MemberWorkspaceProjectTimelineView({
  projects: sourceProjects,
  updateProjectScheduleAction,
}: {
  projects: PlatformAdminDashboardLabProject[]
  updateProjectScheduleAction?: (
    projectId: string,
    startDate: string,
    endDate: string,
  ) => Promise<{ ok: true; id: string } | { error: string }>
}) {
  const router = useRouter()
  const [projects, setProjects] = useState(sourceProjects)
  const [expandedProjects, setExpandedProjects] = useState<string[]>(sourceProjects.map((project) => project.id))
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<TimelineViewMode>("Week")
  const [zoom, setZoom] = useState(1)
  const [editDialog, setEditDialog] = useState<TimelineEditDialogState>({
    isOpen: false,
    type: null,
    projectId: null,
    taskId: null,
  })
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")
  const [viewStartDate, setViewStartDate] = useState(getViewStartForToday)
  const [nameColWidth, setNameColWidth] = useState(280)
  const [todayOffsetDays, setTodayOffsetDays] = useState<number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<TimelineConfirmDialogState>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  })

  const nameColRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollToTodayRef = useRef(true)
  const [, startScheduleTransition] = useTransition()
  const canEditTimeline = Boolean(updateProjectScheduleAction)

  useEffect(() => {
    setProjects(sourceProjects)
    setExpandedProjects(sourceProjects.map((project) => project.id))
  }, [sourceProjects])

  const dates = useMemo(
    () =>
      Array.from({ length: getDaysToRender(viewMode) }).map((_, index) =>
        addDays(viewStartDate, index),
      ),
    [viewMode, viewStartDate],
  )

  const cellWidth = Math.max(20, Math.round(getBaseCellWidth(viewMode) * zoom))
  const timelineWidth = dates.length * cellWidth

  useEffect(() => {
    setZoom(1)
  }, [viewMode])

  useEffect(() => {
    const element = nameColRef.current
    if (!element) return
    const update = () => {
      setNameColWidth(Math.round(element.getBoundingClientRect().width))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const offset = differenceInCalendarDays(FIXED_TODAY, dates[0])
    if (offset < 0 || offset >= dates.length) {
      setTodayOffsetDays(null)
      return
    }
    setTodayOffsetDays(offset)
  }, [dates])

  useEffect(() => {
    if (!shouldAutoScrollToTodayRef.current || todayOffsetDays == null) return
    const element = scrollContainerRef.current
    if (!element) return

    const sidebarWidth = isSidebarOpen ? nameColWidth : 0
    const timelineViewportWidth = Math.max(0, element.clientWidth - sidebarWidth)
    const dayX = todayOffsetDays * cellWidth
    const target = Math.max(0, dayX - timelineViewportWidth / 2 + cellWidth / 2)

    element.scrollTo({ left: target, behavior: "smooth" })
    shouldAutoScrollToTodayRef.current = false
  }, [cellWidth, isSidebarOpen, nameColWidth, todayOffsetDays])

  const toggleProject = (projectId: string) => {
    setExpandedProjects((current) =>
      current.includes(projectId)
        ? current.filter((value) => value !== projectId)
        : [...current, projectId],
    )
  }

  const closeConfirmDialog = (confirmed: boolean) => {
    if (confirmed) {
      confirmDialog.onConfirm()
    } else {
      confirmDialog.onCancel()
    }
    setConfirmDialog({
      isOpen: false,
      message: "",
      onConfirm: () => {},
      onCancel: () => {},
    })
  }

  const showConfirmDialog = (message: string, onConfirm: () => void, onCancel: () => void = () => {}) => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm,
      onCancel,
    })
  }

  const commitProjectSchedule = (
    nextProjects: PlatformAdminDashboardLabProject[],
    projectId: string,
    newStart: Date,
    newEnd: Date,
  ) => {
    const previousProjects = projects
    setProjects(nextProjects)

    if (!updateProjectScheduleAction) {
      return
    }

    startScheduleTransition(async () => {
      const result = await updateProjectScheduleAction(
        projectId,
        formatDateOnly(newStart),
        formatDateOnly(newEnd),
      )

      if ("error" in result) {
        toast.error(result.error)
        setProjects(previousProjects)
        return
      }

      router.refresh()
    })
  }

  const updateProjectDuration = (projectId: string, newStart: Date, newEnd: Date) => {
    commitProjectSchedule(
      replaceProjectDuration(projects, projectId, newStart, newEnd),
      projectId,
      newStart,
      newEnd,
    )
  }

  const updateTaskDuration = (projectId: string, taskId: string, newStart: Date, newEnd: Date) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project
        return {
          ...project,
          tasks: project.tasks.map((task) =>
            task.id === taskId ? { ...task, startDate: newStart, endDate: newEnd } : task,
          ),
        }
      }),
    )
  }

  const updateProjectStart = (projectId: string, newStart: Date, confirmed = false) => {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return

    const durationDays = differenceInCalendarDays(project.endDate, project.startDate) + 1
    const newEnd = addDays(newStart, durationDays - 1)

    if (project.tasks.length > 0 && !confirmed) {
      showConfirmDialog(
        "Move task dates together with the project?",
        () => updateProjectStart(projectId, newStart, true),
        () => updateProjectDuration(projectId, newStart, newEnd),
      )
      return
    }

    commitProjectSchedule(
      shiftProjectStartWithTasks(projects, projectId, newStart),
      projectId,
      newStart,
      newEnd,
    )
  }

  const updateTaskStart = (projectId: string, taskId: string, newStart: Date) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project
        const task = project.tasks.find((item) => item.id === taskId)
        if (!task) return project

        const taskDuration = differenceInCalendarDays(task.endDate, task.startDate) + 1
        const newEnd = addDays(newStart, taskDuration - 1)

        if (newStart < project.startDate || newEnd > project.endDate) {
          showConfirmDialog(
            "This task is outside the project range. Expand project to fit?",
            () => {
              setProjects((next) =>
                next.map((item) => {
                  if (item.id !== project.id) return item
                  return {
                    ...item,
                    startDate: newStart < item.startDate ? newStart : item.startDate,
                    endDate: newEnd > item.endDate ? newEnd : item.endDate,
                    tasks: item.tasks.map((entry) =>
                      entry.id === taskId ? { ...entry, startDate: newStart, endDate: newEnd } : entry,
                    ),
                  }
                }),
              )
            },
          )
          return project
        }

        return {
          ...project,
          tasks: project.tasks.map((entry) =>
            entry.id === taskId ? { ...entry, startDate: newStart, endDate: newEnd } : entry,
          ),
        }
      }),
    )
  }

  const toggleTaskStatus = (projectId: string, taskId: string) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) return project
        return {
          ...project,
          tasks: project.tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: task.status === "done" ? "todo" : "done" }
              : task,
          ),
        }
      }),
    )
  }

  const openProjectEditor = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId)
    if (!project) return
    setEditStartDate(format(project.startDate, "yyyy-MM-dd"))
    setEditEndDate(format(project.endDate, "yyyy-MM-dd"))
    setEditDialog({ isOpen: true, type: "project", projectId, taskId: null })
  }

  const openTaskEditor = (projectId: string, taskId: string) => {
    const project = projects.find((item) => item.id === projectId)
    const task = project?.tasks.find((item) => item.id === taskId)
    if (!project || !task) return
    setEditStartDate(format(task.startDate, "yyyy-MM-dd"))
    setEditEndDate(format(task.endDate, "yyyy-MM-dd"))
    setEditDialog({ isOpen: true, type: "task", projectId, taskId })
  }

  const saveEditDialog = () => {
    if (!editDialog.projectId || !editDialog.type) return
    const newStart = new Date(`${editStartDate}T00:00:00.000Z`)
    const newEnd = new Date(`${editEndDate}T00:00:00.000Z`)

    if (editDialog.type === "project") {
      updateProjectDuration(editDialog.projectId, newStart, newEnd)
    }
    if (editDialog.type === "task" && editDialog.taskId) {
      updateTaskDuration(editDialog.projectId, editDialog.taskId, newStart, newEnd)
    }

    setEditDialog({ isOpen: false, type: null, projectId: null, taskId: null })
  }

  return (
    <div className="flex h-full flex-col">
      <TimelineToolbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        onPrevious={() => setViewStartDate((date) => subWeeks(date, 1))}
        onNext={() => setViewStartDate((date) => addWeeks(date, 1))}
        onToday={() => {
          shouldAutoScrollToTodayRef.current = true
          setViewStartDate(getViewStartForToday())
        }}
        onZoomOut={() => setZoom((current) => Math.max(0.5, current - 0.25))}
        onZoomIn={() => setZoom((current) => Math.min(2, current + 0.25))}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-max">
          {isSidebarOpen ? (
            <TimelineSidebar
              projects={projects}
              expandedProjects={expandedProjects}
              nameColRef={nameColRef}
              canEdit={canEditTimeline}
              onToggleProject={toggleProject}
              onToggleTaskStatus={toggleTaskStatus}
              onEditProject={openProjectEditor}
              onEditTask={openTaskEditor}
            />
          ) : null}

          <TimelineCanvas
            projects={projects}
            expandedProjects={expandedProjects}
            dates={dates}
            cellWidth={cellWidth}
            timelineWidth={timelineWidth}
            todayOffsetDays={todayOffsetDays}
            canEdit={canEditTimeline}
            onEditProject={openProjectEditor}
            onEditTask={openTaskEditor}
            onUpdateProject={updateProjectStart}
            onUpdateProjectDuration={updateProjectDuration}
            onUpdateTask={updateTaskStart}
            onUpdateTaskDuration={updateTaskDuration}
          />
        </div>
      </div>

      <TimelineEditDialog
        editDialog={editDialog}
        editStartDate={editStartDate}
        editEndDate={editEndDate}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog({ isOpen: false, type: null, projectId: null, taskId: null })
          }
        }}
        onChangeStartDate={setEditStartDate}
        onChangeEndDate={setEditEndDate}
        onSave={saveEditDialog}
      />

      <TimelineConfirmDialog
        confirmDialog={confirmDialog}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmDialog(false)
          }
        }}
        onConfirm={() => closeConfirmDialog(true)}
      />
    </div>
  )
}
