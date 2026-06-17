export type WorkspaceTrackerTab = "accelerator" | "objectives"
export type WorkspaceTrackerTicketStatus = "todo" | "in_progress" | "done"
export type WorkspaceTrackerTicketPriority =
  | "low"
  | "normal"
  | "high"
  | "critical"

export type WorkspaceTrackerCategory = {
  id: string
  title: string
  archived: boolean
  createdAt: string
}

export type WorkspaceTrackerTicket = {
  id: string
  categoryId: string
  title: string
  description: string | null
  status: WorkspaceTrackerTicketStatus
  priority: WorkspaceTrackerTicketPriority
  dueAt: string | null
  assigneeUserIds: string[]
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type WorkspaceTrackerState = {
  tab: WorkspaceTrackerTab
  archivedAcceleratorGroups: string[]
  categories: WorkspaceTrackerCategory[]
  tickets: WorkspaceTrackerTicket[]
}
