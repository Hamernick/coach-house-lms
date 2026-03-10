"use client"

import ArchiveRestoreIcon from "lucide-react/dist/esm/icons/archive-restore"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  WorkspaceMemberOption,
  WorkspaceTrackerCategory,
  WorkspaceTrackerTicketPriority,
} from "./workspace-board-types"

export function TrackerTicketComposer({
  presentationMode,
  draftCategoryTitle,
  onDraftCategoryTitleChange,
  draftTicketTitle,
  onDraftTicketTitleChange,
  draftTicketDescription,
  onDraftTicketDescriptionChange,
  draftTicketPriority,
  onDraftTicketPriorityChange,
  draftTicketDueDate,
  onDraftTicketDueDateChange,
  draftTicketAssigneeId,
  onDraftTicketAssigneeIdChange,
  draftTicketCategoryId,
  onDraftTicketCategoryIdChange,
  activeCategories,
  archivedCategories,
  members,
  onCreateCategory,
  onCreateTicket,
  onToggleCategoryArchive,
}: {
  presentationMode: boolean
  draftCategoryTitle: string
  onDraftCategoryTitleChange: (next: string) => void
  draftTicketTitle: string
  onDraftTicketTitleChange: (next: string) => void
  draftTicketDescription: string
  onDraftTicketDescriptionChange: (next: string) => void
  draftTicketPriority: WorkspaceTrackerTicketPriority
  onDraftTicketPriorityChange: (next: WorkspaceTrackerTicketPriority) => void
  draftTicketDueDate: string
  onDraftTicketDueDateChange: (next: string) => void
  draftTicketAssigneeId: string
  onDraftTicketAssigneeIdChange: (next: string) => void
  draftTicketCategoryId: string
  onDraftTicketCategoryIdChange: (next: string) => void
  activeCategories: WorkspaceTrackerCategory[]
  archivedCategories: WorkspaceTrackerCategory[]
  members: WorkspaceMemberOption[]
  onCreateCategory: () => void
  onCreateTicket: () => void
  onToggleCategoryArchive: (categoryId: string) => void
}) {
  const normalizedDraftTicketAssigneeId =
    draftTicketAssigneeId && members.some((member) => member.userId === draftTicketAssigneeId)
      ? draftTicketAssigneeId
      : "none"
  const normalizedDraftTicketCategoryId =
    draftTicketCategoryId.trim().length > 0 ? draftTicketCategoryId : undefined

  return (
    <div className="space-y-2 border-t border-border/50 pt-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
        <Input
          value={draftCategoryTitle}
          onChange={(event) => onDraftCategoryTitleChange(event.target.value)}
          placeholder="New category"
          className="h-8 text-xs"
          aria-label="New ticket category"
          disabled={presentationMode}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={onCreateCategory}
          disabled={presentationMode}
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Add category</span>
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
        <Input
          value={draftTicketTitle}
          onChange={(event) => onDraftTicketTitleChange(event.target.value)}
          placeholder="Add objective"
          className="h-8 text-xs"
          aria-label="New objective title"
          disabled={presentationMode}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={onCreateTicket}
          disabled={presentationMode || !draftTicketCategoryId}
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Add objective</span>
        </Button>
      </div>

      <Input
        value={draftTicketDescription}
        onChange={(event) => onDraftTicketDescriptionChange(event.target.value)}
        placeholder="Description"
        className="h-8 text-xs"
        aria-label="Objective description"
        disabled={presentationMode}
      />

      <div className="grid grid-cols-3 gap-1.5">
        <Select
          value={draftTicketPriority}
          onValueChange={(value) => onDraftTicketPriorityChange(value as WorkspaceTrackerTicketPriority)}
          disabled={presentationMode}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low" className="text-xs">
              Low
            </SelectItem>
            <SelectItem value="normal" className="text-xs">
              Normal
            </SelectItem>
            <SelectItem value="high" className="text-xs">
              High
            </SelectItem>
            <SelectItem value="critical" className="text-xs">
              Critical
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={draftTicketDueDate}
          onChange={(event) => onDraftTicketDueDateChange(event.target.value)}
          className="h-8 text-xs"
          aria-label="Objective due date"
          disabled={presentationMode}
        />

        <Select
          value={normalizedDraftTicketAssigneeId}
          onValueChange={(value) => onDraftTicketAssigneeIdChange(value === "none" ? "" : value)}
          disabled={presentationMode}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">
              Unassigned
            </SelectItem>
            {members.map((member) => (
              <SelectItem key={member.userId} value={member.userId} className="text-xs">
                {member.name?.trim() || member.email || member.userId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select value={normalizedDraftTicketCategoryId} onValueChange={onDraftTicketCategoryIdChange} disabled={presentationMode}>
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue placeholder="Assign category" />
        </SelectTrigger>
        <SelectContent>
          {activeCategories.map((category) => (
            <SelectItem key={category.id} value={category.id} className="text-xs">
              {category.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {archivedCategories.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {archivedCategories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant="ghost"
              className="h-7 rounded-full border border-border/60 px-2 text-[11px] text-muted-foreground"
              onClick={() => onToggleCategoryArchive(category.id)}
              disabled={presentationMode}
            >
              <ArchiveRestoreIcon className="mr-1 h-3 w-3" aria-hidden />
              {category.title}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
