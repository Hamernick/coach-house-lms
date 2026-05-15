import {
  createLocalCategoryState,
  createLocalTicketState,
} from "./workspace-board-formation-tracker-card-helpers"
import type {
  WorkspaceTrackerState,
  WorkspaceTrackerTicketPriority,
} from "./workspace-board-types"

export function applyCreateCategoryLocal({
  tracker,
  title,
  commitTracker,
  setDraftTicketCategoryId,
  setDraftCategoryTitle,
}: {
  tracker: WorkspaceTrackerState
  title: string
  commitTracker: (next: WorkspaceTrackerState) => void
  setDraftTicketCategoryId: (value: string) => void
  setDraftCategoryTitle: (value: string) => void
}) {
  const { nextState, nextCategoryId } = createLocalCategoryState({ tracker, title })
  commitTracker(nextState)
  setDraftTicketCategoryId(nextCategoryId)
  setDraftCategoryTitle("")
}

export function applyCreateTicketLocal({
  tracker,
  categoryId,
  title,
  description,
  priority,
  dueAt,
  assigneeUserIds,
  commitTracker,
  setDraftTicketTitle,
  setDraftTicketDescription,
  setDraftTicketPriority,
  setDraftTicketDueDate,
  setDraftTicketAssigneeId,
}: {
  tracker: WorkspaceTrackerState
  categoryId: string
  title: string
  description: string | null
  priority: WorkspaceTrackerTicketPriority
  dueAt: string | null
  assigneeUserIds: string[]
  commitTracker: (next: WorkspaceTrackerState) => void
  setDraftTicketTitle: (value: string) => void
  setDraftTicketDescription: (value: string) => void
  setDraftTicketPriority: (value: WorkspaceTrackerTicketPriority) => void
  setDraftTicketDueDate: (value: string) => void
  setDraftTicketAssigneeId: (value: string) => void
}) {
  commitTracker(
    createLocalTicketState({
      tracker,
      categoryId,
      title,
      description,
      priority,
      dueAt,
      assigneeUserIds,
    }),
  )
  setDraftTicketTitle("")
  setDraftTicketDescription("")
  setDraftTicketPriority("normal")
  setDraftTicketDueDate("")
  setDraftTicketAssigneeId("")
}
