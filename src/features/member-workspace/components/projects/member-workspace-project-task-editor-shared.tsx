"use client"

import { useState } from "react"
import { format } from "date-fns"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronsUpDownIcon from "lucide-react/dist/esm/icons/chevrons-up-down"

import type {
  CreateTaskContext,
  ProjectDetails,
  ProjectTask,
} from "@/features/platform-admin-dashboard"
import { Badge } from "@/features/platform-admin-dashboard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type {
  MemberWorkspaceCreateTaskInput,
  MemberWorkspacePersonOption,
} from "../../types"

export type TaskDraft = {
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  startDate: string
  endDate: string
  priority: "no-priority" | "low" | "medium" | "high" | "urgent"
  tagLabel: string
  workstreamName: string
  assigneeId: string
}

export const NEW_TASK_ID = "__new_task__"
const UNASSIGNED_ASSIGNEE_ID = "__unassigned__"

const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const

const TASK_PRIORITY_OPTIONS = [
  { value: "no-priority", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const

function initialsFor(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "?"

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
}

function formatAssigneeMeta(option?: MemberWorkspacePersonOption | null) {
  if (!option) return "No one assigned yet"

  return [option.roleLabel, option.email].filter(Boolean).join(" · ") || "Assignable teammate"
}

function groupAssigneeOptions(options: MemberWorkspacePersonOption[]) {
  const groups = new Map<
    string,
    {
      key: string
      label: string
      options: MemberWorkspacePersonOption[]
    }
  >()

  for (const option of options) {
    const key = option.groupKey ?? "organization-team"
    const label =
      option.groupLabel ??
      (key === "platform-admins" ? "Coach House admins" : "Organization team")
    const group = groups.get(key)

    if (group) {
      group.options.push(option)
      continue
    }

    groups.set(key, {
      key,
      label,
      options: [option],
    })
  }

  return Array.from(groups.values())
}

function toDateValue(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
}

export function formatTaskDateLabel(date?: Date) {
  return date ? format(date, "MMM d, yyyy") : "No date"
}

function normalizeTaskPriority(task: ProjectTask): TaskDraft["priority"] {
  const priority = task.priority ?? "no-priority"
  if (
    priority === "no-priority" ||
    priority === "low" ||
    priority === "medium" ||
    priority === "high" ||
    priority === "urgent"
  ) {
    return priority
  }

  return "no-priority"
}

export function buildTaskDraft({
  project,
  task,
  context,
}: {
  project: ProjectDetails
  task?: ProjectTask
  context?: CreateTaskContext
}): TaskDraft {
  const startDate = task?.startDate ?? project.source?.startDate ?? new Date()
  const endDate = task?.endDate ?? task?.startDate ?? project.source?.endDate ?? startDate

  return {
    title: task?.name ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    startDate: toDateValue(startDate),
    endDate: toDateValue(endDate),
    priority: task ? normalizeTaskPriority(task) : "medium",
    tagLabel: task?.tag ?? "",
    workstreamName: context?.workstreamName ?? task?.workstreamName ?? "",
    assigneeId: task?.assignee?.id ?? UNASSIGNED_ASSIGNEE_ID,
  }
}

export function buildTaskInput({
  draft,
  projectId,
}: {
  draft: TaskDraft
  projectId: string
}): MemberWorkspaceCreateTaskInput {
  return {
    projectId,
    title: draft.title,
    description: draft.description || undefined,
    status: draft.status,
    startDate: draft.startDate,
    endDate: draft.endDate,
    priority: draft.priority,
    tagLabel: draft.tagLabel || undefined,
    workstreamName: draft.workstreamName || undefined,
    assigneeUserId:
      draft.assigneeId && draft.assigneeId !== UNASSIGNED_ASSIGNEE_ID
        ? draft.assigneeId
        : undefined,
  }
}

export function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  if (!moved) {
    return items
  }
  next.splice(toIndex, 0, moved)
  return next
}

export function TaskToneBadge({
  label,
  tone = "default",
}: {
  label: string
  tone?: "default" | "outline"
}) {
  return (
    <Badge
      variant={tone === "outline" ? "outline" : "secondary"}
      className="text-[11px]"
    >
      {label}
    </Badge>
  )
}

function TaskAssigneeOptionRow({
  option,
  selected = false,
}: {
  option?: MemberWorkspacePersonOption
  selected?: boolean
}) {
  const label = option?.name ?? "Unassigned"
  const meta = formatAssigneeMeta(option)

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar className="size-9 border border-border/60">
        <AvatarImage src={option?.avatarUrl ?? undefined} alt={label} />
        <AvatarFallback className="text-[11px] font-semibold">
          {initialsFor(label)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <CheckIcon
        aria-hidden
        className={cn(
          "size-4 shrink-0 text-foreground transition-opacity",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  )
}

function TaskAssigneePicker({
  assigneeOptions,
  formId,
  selectedAssigneeId,
  onSelectAssignee,
}: {
  assigneeOptions: MemberWorkspacePersonOption[]
  formId: string
  selectedAssigneeId: string
  onSelectAssignee: (value: string) => void
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const labelId = `${formId}-assignee-label`
  const triggerId = `${formId}-assignee-trigger`
  const selectedOption =
    assigneeOptions.find((option) => option.id === selectedAssigneeId) ?? null
  const groupedOptions = groupAssigneeOptions(assigneeOptions)

  const trigger = (
    <Button
      id={triggerId}
      type="button"
      variant="outline"
      aria-labelledby={labelId}
      aria-expanded={open}
      className="min-h-11 w-full justify-between gap-3 rounded-xl px-3 text-left font-normal"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          {selectedOption?.name ?? "Unassigned"}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {formatAssigneeMeta(selectedOption)}
        </span>
      </span>
      <ChevronsUpDownIcon aria-hidden className="size-4 shrink-0 opacity-60" />
    </Button>
  )

  const command = (
    <Command className="bg-background">
      <CommandInput
        placeholder="Search by name or email…"
        className="text-base"
      />
      <CommandList className="max-h-[320px]">
        <CommandEmpty>No matching people.</CommandEmpty>
        <CommandGroup heading="Assignment">
          <CommandItem
            value="unassigned nobody none"
            onSelect={() => {
              onSelectAssignee(UNASSIGNED_ASSIGNEE_ID)
              setOpen(false)
            }}
            className="min-h-12 px-3 py-3"
          >
            <TaskAssigneeOptionRow
              selected={selectedOption == null}
            />
          </CommandItem>
        </CommandGroup>
        {groupedOptions.map((group) => (
          <div key={group.key}>
            <CommandSeparator />
            <CommandGroup heading={group.label}>
              {group.options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={[
                    option.name,
                    option.email,
                    option.roleLabel,
                    group.label,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onSelect={() => {
                    onSelectAssignee(option.id)
                    setOpen(false)
                  }}
                  className="min-h-12 px-3 py-3"
                >
                  <TaskAssigneeOptionRow
                    option={option}
                    selected={selectedOption?.id === option.id}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </Command>
  )

  return (
    <div className="space-y-2">
      <Label id={labelId}>Assignee</Label>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent className="max-h-[85dvh] rounded-t-[28px] p-0">
            <DrawerHeader className="text-left">
              <DrawerTitle>Assign task</DrawerTitle>
              <DrawerDescription>
                Search teammates and choose who owns the next step.
              </DrawerDescription>
            </DrawerHeader>
            <div className="border-t border-border/60 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {command}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="start" className="w-[min(420px,calc(100vw-2rem))] rounded-2xl p-0">
            {command}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

type TaskInlineFormProps = {
  assigneeOptions: MemberWorkspacePersonOption[]
  draft: TaskDraft
  formId: string
  isNewTask?: boolean
  isSaving?: boolean
  onCancel: () => void
  onChangeDraftField: (field: keyof TaskDraft, value: string) => void
  onDelete?: () => void
  onSave: () => void
  workstreamSuggestions: string[]
}

export function TaskInlineForm({
  assigneeOptions,
  draft,
  formId,
  isNewTask = false,
  isSaving = false,
  onCancel,
  onChangeDraftField,
  onDelete,
  onSave,
  workstreamSuggestions,
}: TaskInlineFormProps) {
  return (
    <div className="border-border/70 mt-4 rounded-2xl border bg-background/70 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2 md:col-span-2 xl:col-span-3">
          <Label htmlFor={`${formId}-title`}>Task title</Label>
          <Input
            id={`${formId}-title`}
            value={draft.title}
            placeholder="Write the task title"
            onChange={(event) => onChangeDraftField("title", event.currentTarget.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2 xl:col-span-3">
          <Label htmlFor={`${formId}-description`}>Description</Label>
          <Textarea
            id={`${formId}-description`}
            value={draft.description}
            placeholder="Add implementation detail, owner context, or notes for this task."
            className="min-h-28 resize-y"
            onChange={(event) =>
              onChangeDraftField("description", event.currentTarget.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-status`}>Status</Label>
          <Select
            value={draft.status}
            onValueChange={(value) => onChangeDraftField("status", value)}
          >
            <SelectTrigger id={`${formId}-status`} className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-priority`}>Priority</Label>
          <Select
            value={draft.priority}
            onValueChange={(value) => onChangeDraftField("priority", value)}
          >
            <SelectTrigger id={`${formId}-priority`} className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TaskAssigneePicker
          assigneeOptions={assigneeOptions}
          formId={formId}
          selectedAssigneeId={draft.assigneeId}
          onSelectAssignee={(value) => onChangeDraftField("assigneeId", value)}
        />

        <div className="space-y-2">
          <Label htmlFor={`${formId}-start-date`}>Start date</Label>
          <Input
            id={`${formId}-start-date`}
            type="date"
            value={draft.startDate}
            onChange={(event) => onChangeDraftField("startDate", event.currentTarget.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-end-date`}>End date</Label>
          <Input
            id={`${formId}-end-date`}
            type="date"
            value={draft.endDate}
            onChange={(event) => onChangeDraftField("endDate", event.currentTarget.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-workstream`}>Workstream</Label>
          <Input
            id={`${formId}-workstream`}
            value={draft.workstreamName}
            list={`${formId}-workstream-options`}
            placeholder="Planning, Design, QA"
            onChange={(event) =>
              onChangeDraftField("workstreamName", event.currentTarget.value)
            }
          />
          {workstreamSuggestions.length > 0 ? (
            <datalist id={`${formId}-workstream-options`}>
              {workstreamSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-tag`}>Classification</Label>
          <Input
            id={`${formId}-tag`}
            value={draft.tagLabel}
            placeholder="feature, bug, internal"
            onChange={(event) => onChangeDraftField("tagLabel", event.currentTarget.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Saving..." : isNewTask ? "Create task" : "Save task"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {!isNewTask && onDelete ? (
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            Delete task
          </Button>
        ) : null}
      </div>
    </div>
  )
}
