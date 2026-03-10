import type {
  WorkspaceTrackerCategory,
  WorkspaceTrackerState,
  WorkspaceTrackerTicket,
  WorkspaceTrackerTicketPriority,
  WorkspaceTrackerTicketStatus,
} from "./workspace-board-types"

export const LEGACY_TRACKER_ID_PREFIX = "legacy-"
export const RUNTIME_TRACKER_ID_PREFIX = "tracker-"

export function createRuntimeId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`
}

export function trimToSingleLine(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function sortTrackerTickets(tickets: WorkspaceTrackerTicket[]) {
  return [...tickets].sort((left, right) => {
    if (left.status === "done" && right.status !== "done") return 1
    if (left.status !== "done" && right.status === "done") return -1
    return right.updatedAt.localeCompare(left.updatedAt)
  })
}

export function createLocalCategoryState({
  tracker,
  title,
}: {
  tracker: WorkspaceTrackerState
  title: string
}) {
  const nextCategory: WorkspaceTrackerCategory = {
    id: createRuntimeId("tracker-category"),
    title,
    archived: false,
    createdAt: new Date().toISOString(),
  }

  return {
    nextState: {
      ...tracker,
      categories: [...tracker.categories, nextCategory],
    },
    nextCategoryId: nextCategory.id,
  }
}

export function toggleLocalCategoryArchiveState({
  tracker,
  categoryId,
}: {
  tracker: WorkspaceTrackerState
  categoryId: string
}): WorkspaceTrackerState {
  const now = new Date().toISOString()
  const nextCategories = tracker.categories.map((category) =>
    category.id === categoryId ? { ...category, archived: !category.archived } : category,
  )
  const nextArchived = nextCategories.find((category) => category.id === categoryId)?.archived ?? false
  const nextTickets = tracker.tickets.map((ticket) =>
    ticket.categoryId === categoryId ? { ...ticket, archived: nextArchived, updatedAt: now } : ticket,
  )

  return {
    ...tracker,
    categories: nextCategories,
    tickets: nextTickets,
  }
}

export function createLocalTicketState({
  tracker,
  categoryId,
  title,
  description = null,
  priority = "normal",
  dueAt = null,
  assigneeUserIds = [],
}: {
  tracker: WorkspaceTrackerState
  categoryId: string
  title: string
  description?: string | null
  priority?: WorkspaceTrackerTicketPriority
  dueAt?: string | null
  assigneeUserIds?: string[]
}): WorkspaceTrackerState {
  const now = new Date().toISOString()
  const nextTicket: WorkspaceTrackerTicket = {
    id: createRuntimeId("tracker-ticket"),
    categoryId,
    title,
    description,
    status: "todo",
    priority,
    dueAt,
    assigneeUserIds,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }

  return {
    ...tracker,
    tickets: [nextTicket, ...tracker.tickets],
  }
}

export function toggleLocalTicketStatusState({
  tracker,
  ticketId,
  resolveNextStatus,
}: {
  tracker: WorkspaceTrackerState
  ticketId: string
  resolveNextStatus: (current: WorkspaceTrackerTicketStatus) => WorkspaceTrackerTicketStatus
}): WorkspaceTrackerState {
  const now = new Date().toISOString()
  return {
    ...tracker,
    tickets: tracker.tickets.map((ticket) =>
      ticket.id === ticketId
        ? { ...ticket, status: resolveNextStatus(ticket.status), updatedAt: now }
        : ticket,
    ),
  }
}

export function updateLocalTicketState({
  tracker,
  ticketId,
  updates,
}: {
  tracker: WorkspaceTrackerState
  ticketId: string
  updates: Partial<
    Pick<
      WorkspaceTrackerTicket,
      "title" | "description" | "priority" | "dueAt" | "categoryId" | "assigneeUserIds"
    >
  >
}): WorkspaceTrackerState {
  const now = new Date().toISOString()
  return {
    ...tracker,
    tickets: tracker.tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            ...updates,
            updatedAt: now,
          }
        : ticket,
    ),
  }
}

export function isLegacyOrRuntimeTrackerId(id: string) {
  return id.startsWith(LEGACY_TRACKER_ID_PREFIX) || id.startsWith(RUNTIME_TRACKER_ID_PREFIX)
}
