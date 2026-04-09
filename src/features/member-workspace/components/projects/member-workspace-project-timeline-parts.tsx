"use client"

import { format, isSameDay } from "date-fns"
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react/dist/ssr"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { MemberWorkspaceProjectPriorityGlyphIcon } from "./member-workspace-project-priority"
import { MemberWorkspaceProjectTimelineDraggableBar } from "./member-workspace-project-timeline-draggable-bar"

export const FIXED_TODAY = new Date(2024, 0, 23)
export const TIMELINE_VIEW_MODES = ["Day", "Week", "Month", "Quarter"] as const
export type TimelineViewMode = (typeof TIMELINE_VIEW_MODES)[number]

export type TimelineEditDialogState = {
  isOpen: boolean
  type: "project" | "task" | null
  projectId: string | null
  taskId: string | null
}

export type TimelineConfirmDialogState = {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function TimelineToolbar({
  isSidebarOpen,
  onToggleSidebar,
  onPrevious,
  onNext,
  onToday,
  onZoomOut,
  onZoomIn,
  viewMode,
  onViewModeChange,
}: {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onZoomOut: () => void
  onZoomIn: () => void
  viewMode: TimelineViewMode
  onViewModeChange: (viewMode: TimelineViewMode) => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleSidebar}>
          <CaretDown className={cn("h-4 w-4 transition-transform", !isSidebarOpen && "-rotate-90")} />
          {isSidebarOpen ? "Collapse" : "Expand"}
        </Button>
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <CaretLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <CaretRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onZoomOut}>
          <MagnifyingGlassMinus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onZoomIn}>
          <MagnifyingGlassPlus className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {viewMode}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 rounded-xl p-1" align="end">
            {TIMELINE_VIEW_MODES.map((mode) => (
              <button
                key={mode}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-accent",
                  viewMode === mode && "bg-accent",
                )}
                onClick={() => onViewModeChange(mode)}
              >
                {mode}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export function TimelineSidebar({
  projects,
  expandedProjects,
  nameColRef,
  canEdit,
  onToggleProject,
  onToggleTaskStatus,
  onEditProject,
  onEditTask,
}: {
  projects: PlatformAdminDashboardLabProject[]
  expandedProjects: string[]
  nameColRef: React.RefObject<HTMLDivElement | null>
  canEdit: boolean
  onToggleProject: (projectId: string) => void
  onToggleTaskStatus: (projectId: string, taskId: string) => void
  onEditProject: (projectId: string) => void
  onEditTask: (projectId: string, taskId: string) => void
}) {
  return (
    <div ref={nameColRef} className="sticky left-0 z-10 shrink-0 border-r border-border bg-background">
      <div className="flex h-12 items-center border-b border-border px-4 text-sm font-medium text-muted-foreground">
        Projects
      </div>
      {projects.map((project) => (
        <div key={project.id}>
          <div className="flex min-h-[54px] items-center gap-2 border-b border-border px-4">
            <button className="rounded p-1 hover:bg-accent" onClick={() => onToggleProject(project.id)}>
              <CaretDown
                className={cn("h-4 w-4 transition-transform", !expandedProjects.includes(project.id) && "-rotate-90")}
              />
            </button>
            <button
              className="min-w-0 flex-1 text-left"
              onDoubleClick={canEdit ? () => onEditProject(project.id) : undefined}
            >
              <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
              <div className="text-xs text-muted-foreground">{project.client ?? "Project workspace"}</div>
            </button>
            <MemberWorkspaceProjectPriorityGlyphIcon level={project.priority} />
          </div>

          {expandedProjects.includes(project.id)
            ? project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex min-h-[42px] items-center gap-2 border-b border-border px-6 text-sm text-muted-foreground"
                >
                  <Checkbox
                    checked={task.status === "done"}
                    disabled={!canEdit}
                    onCheckedChange={() => onToggleTaskStatus(project.id, task.id)}
                  />
                  <button
                    className="min-w-0 flex-1 truncate text-left"
                    onDoubleClick={canEdit ? () => onEditTask(project.id, task.id) : undefined}
                  >
                    {task.name}
                  </button>
                </div>
              ))
            : null}
        </div>
      ))}
    </div>
  )
}

export function TimelineCanvas({
  projects,
  expandedProjects,
  dates,
  cellWidth,
  timelineWidth,
  todayOffsetDays,
  canEdit,
  onEditProject,
  onEditTask,
  onUpdateProject,
  onUpdateProjectDuration,
  onUpdateTask,
  onUpdateTaskDuration,
}: {
  projects: PlatformAdminDashboardLabProject[]
  expandedProjects: string[]
  dates: Date[]
  cellWidth: number
  timelineWidth: number
  todayOffsetDays: number | null
  canEdit: boolean
  onEditProject: (projectId: string) => void
  onEditTask: (projectId: string, taskId: string) => void
  onUpdateProject: (projectId: string, newStart: Date) => void
  onUpdateProjectDuration: (projectId: string, newStart: Date, newEnd: Date) => void
  onUpdateTask: (projectId: string, taskId: string, newStart: Date) => void
  onUpdateTaskDuration: (projectId: string, taskId: string, newStart: Date, newEnd: Date) => void
}) {
  return (
    <div className="relative" style={{ width: `${timelineWidth}px` }}>
      <div className="sticky top-0 z-10 flex border-b border-border bg-background/95 backdrop-blur">
        {dates.map((date) => (
          <div
            key={date.toISOString()}
            className="border-l border-border px-1 py-3 text-center text-[10px] text-muted-foreground"
            style={{ width: `${cellWidth}px` }}
          >
            <div>{format(date, "EEE")}</div>
            <div className={cn(isSameDay(date, FIXED_TODAY) && "font-semibold text-foreground")}>
              {format(date, "d")}
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        {todayOffsetDays != null ? (
          <div
            className="pointer-events-none absolute top-0 z-0 h-full w-px bg-primary/30"
            style={{ left: `${todayOffsetDays * cellWidth}px` }}
          />
        ) : null}

        {projects.map((project) => (
          <div key={project.id}>
            <div className="relative h-[54px] border-b border-border">
              <MemberWorkspaceProjectTimelineDraggableBar
                item={{
                  id: project.id,
                  name: project.name,
                  startDate: project.startDate,
                  endDate: project.endDate,
                  progress: project.progress,
                }}
                variant="project"
                viewStartDate={dates[0]}
                cellWidth={cellWidth}
                onUpdateStart={(id, newStart) => onUpdateProject(id, newStart)}
                onUpdateDuration={(id, newStart, newEnd) =>
                  onUpdateProjectDuration(id, newStart, newEnd)
                }
                onDoubleClick={canEdit ? () => onEditProject(project.id) : undefined}
                disabled={!canEdit}
              />
            </div>

            {expandedProjects.includes(project.id)
              ? project.tasks.map((task) => (
                  <div key={task.id} className="relative h-[42px] border-b border-border">
                    <MemberWorkspaceProjectTimelineDraggableBar
                      item={task}
                      variant="task"
                      viewStartDate={dates[0]}
                      cellWidth={cellWidth}
                      onUpdateStart={(id, newStart) => onUpdateTask(project.id, id, newStart)}
                      onUpdateDuration={(id, newStart, newEnd) =>
                        onUpdateTaskDuration(project.id, id, newStart, newEnd)
                      }
                      onDoubleClick={canEdit ? () => onEditTask(project.id, task.id) : undefined}
                      disabled={!canEdit}
                    />
                  </div>
                ))
              : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimelineEditDialog({
  editDialog,
  editStartDate,
  editEndDate,
  onOpenChange,
  onChangeStartDate,
  onChangeEndDate,
  onSave,
}: {
  editDialog: TimelineEditDialogState
  editStartDate: string
  editEndDate: string
  onOpenChange: (open: boolean) => void
  onChangeStartDate: (value: string) => void
  onChangeEndDate: (value: string) => void
  onSave: () => void
}) {
  return (
    <Dialog open={editDialog.isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit dates</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="timeline-start-date">
              Start date
            </label>
            <Input
              id="timeline-start-date"
              type="date"
              value={editStartDate}
              onChange={(event) => onChangeStartDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="timeline-end-date">
              End date
            </label>
            <Input
              id="timeline-end-date"
              type="date"
              value={editEndDate}
              onChange={(event) => onChangeEndDate(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TimelineConfirmDialog({
  confirmDialog,
  onOpenChange,
  onConfirm,
}: {
  confirmDialog: TimelineConfirmDialogState
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={confirmDialog.isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm change</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
