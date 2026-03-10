"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type {
  WorkspaceMemberOption,
  WorkspaceTrackerCategory,
  WorkspaceTrackerTicketPriority,
} from "./workspace-board-types"

export function WorkspaceBoardFormationTrackerEditorPanel({
  editTitle,
  onEditTitleChange,
  editDescription,
  onEditDescriptionChange,
  editPriority,
  onEditPriorityChange,
  editDueDate,
  onEditDueDateChange,
  editCategoryId,
  onEditCategoryIdChange,
  editAssigneeIds,
  members,
  activeCategories,
  onToggleAssignee,
  onCancel,
  onSave,
}: {
  editTitle: string
  onEditTitleChange: (next: string) => void
  editDescription: string
  onEditDescriptionChange: (next: string) => void
  editPriority: WorkspaceTrackerTicketPriority
  onEditPriorityChange: (next: WorkspaceTrackerTicketPriority) => void
  editDueDate: string
  onEditDueDateChange: (next: string) => void
  editCategoryId: string
  onEditCategoryIdChange: (next: string) => void
  editAssigneeIds: string[]
  members: WorkspaceMemberOption[]
  activeCategories: WorkspaceTrackerCategory[]
  onToggleAssignee: (userId: string) => void
  onCancel: () => void
  onSave: () => void
}) {
  const normalizedEditCategoryId = activeCategories.some((category) => category.id === editCategoryId)
    ? editCategoryId
    : undefined

  return (
    <div className="mb-2 space-y-2 rounded-lg border border-border/70 bg-background/60 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">Edit objective</p>
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>

      <Input
        value={editTitle}
        onChange={(event) => onEditTitleChange(event.target.value)}
        placeholder="Objective title"
        className="h-8 text-xs"
        aria-label="Edit objective title"
      />
      <Input
        value={editDescription}
        onChange={(event) => onEditDescriptionChange(event.target.value)}
        placeholder="Description"
        className="h-8 text-xs"
        aria-label="Edit objective description"
      />

      <div className="grid grid-cols-3 gap-1.5">
        <Select value={editPriority} onValueChange={(value) => onEditPriorityChange(value as WorkspaceTrackerTicketPriority)}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low" className="text-xs">Low</SelectItem>
            <SelectItem value="normal" className="text-xs">Normal</SelectItem>
            <SelectItem value="high" className="text-xs">High</SelectItem>
            <SelectItem value="critical" className="text-xs">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={editDueDate}
          onChange={(event) => onEditDueDateChange(event.target.value)}
          className="h-8 text-xs"
          aria-label="Edit objective due date"
        />
        <Select value={normalizedEditCategoryId} onValueChange={onEditCategoryIdChange}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {activeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="text-xs">
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground">Assignees</p>
        <div className="grid max-h-24 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
          {members.map((member) => {
            const label = member.name?.trim() || member.email || member.userId
            const checked = editAssigneeIds.includes(member.userId)
            return (
              <label key={member.userId} className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1 text-xs">
                <Checkbox checked={checked} onCheckedChange={() => onToggleAssignee(member.userId)} />
                <span className="truncate">{label}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
