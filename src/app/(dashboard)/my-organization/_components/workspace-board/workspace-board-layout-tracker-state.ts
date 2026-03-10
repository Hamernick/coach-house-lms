import type {
  WorkspaceTrackerCategory,
  WorkspaceTrackerState,
  WorkspaceTrackerTab,
  WorkspaceTrackerTicketPriority,
  WorkspaceTrackerTicket,
  WorkspaceTrackerTicketStatus,
} from "./workspace-board-types"

const DEFAULT_TRACKER_CATEGORY_ID = "general"

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback
  return value.trim()
}

function normalizeTrackerTab(value: unknown): WorkspaceTrackerTab {
  if (value === "objectives" || value === "tickets") return "objectives"
  return "accelerator"
}

function normalizeTrackerTicketStatus(value: unknown): WorkspaceTrackerTicketStatus {
  if (value === "done" || value === "in_progress") return value
  return "todo"
}

function normalizeTrackerTicketPriority(value: unknown): WorkspaceTrackerTicketPriority {
  if (value === "low" || value === "high" || value === "critical") return value
  return "normal"
}

function normalizeTrackerCategory(
  value: unknown,
  fallbackCreatedAt: string,
): WorkspaceTrackerCategory | null {
  if (!value || typeof value !== "object") return null
  const record = value as Partial<WorkspaceTrackerCategory>
  const id = normalizeText(record.id)
  const title = normalizeText(record.title)
  if (!id || !title) return null

  const createdAt =
    typeof record.createdAt === "string" && record.createdAt.trim().length > 0
      ? record.createdAt
      : fallbackCreatedAt

  return {
    id,
    title,
    archived: Boolean(record.archived),
    createdAt,
  }
}

function normalizeTrackerTicket(
  value: unknown,
  categoryIds: Set<string>,
  fallbackCategoryId: string,
  fallbackTimestamp: string,
): WorkspaceTrackerTicket | null {
  if (!value || typeof value !== "object") return null
  const record = value as Partial<WorkspaceTrackerTicket>
  const id = normalizeText(record.id)
  const title = normalizeText(record.title)
  if (!id || !title) return null

  const preferredCategoryId = normalizeText(record.categoryId, fallbackCategoryId)
  const categoryId = categoryIds.has(preferredCategoryId) ? preferredCategoryId : fallbackCategoryId
  const createdAt =
    typeof record.createdAt === "string" && record.createdAt.trim().length > 0
      ? record.createdAt
      : fallbackTimestamp
  const updatedAt =
    typeof record.updatedAt === "string" && record.updatedAt.trim().length > 0
      ? record.updatedAt
      : createdAt

  return {
    id,
    categoryId,
    title,
    description:
      typeof record.description === "string" && record.description.trim().length > 0
        ? record.description.trim()
        : null,
    status: normalizeTrackerTicketStatus(record.status),
    priority: normalizeTrackerTicketPriority(record.priority),
    dueAt:
      typeof record.dueAt === "string" && record.dueAt.trim().length > 0
        ? record.dueAt
        : null,
    assigneeUserIds: Array.isArray(record.assigneeUserIds)
      ? Array.from(new Set(record.assigneeUserIds.filter((value): value is string => typeof value === "string")))
      : [],
    archived: Boolean(record.archived),
    createdAt,
    updatedAt,
  }
}

export function buildDefaultWorkspaceTrackerState(): WorkspaceTrackerState {
  const now = new Date().toISOString()
  return {
    tab: "accelerator",
    archivedAcceleratorGroups: [],
    categories: [
      {
        id: DEFAULT_TRACKER_CATEGORY_ID,
        title: "General",
        archived: false,
        createdAt: now,
      },
    ],
    tickets: [],
  }
}

export function normalizeWorkspaceTrackerState(value: unknown): WorkspaceTrackerState {
  const fallback = buildDefaultWorkspaceTrackerState()
  if (!value || typeof value !== "object") return fallback

  const record = value as Partial<WorkspaceTrackerState>
  const now = new Date().toISOString()

  const categoryMap = new Map<string, WorkspaceTrackerCategory>()
  if (Array.isArray(record.categories)) {
    for (const categoryValue of record.categories) {
      const category = normalizeTrackerCategory(categoryValue, now)
      if (!category) continue
      categoryMap.set(category.id, category)
    }
  }

  if (!categoryMap.has(DEFAULT_TRACKER_CATEGORY_ID)) {
    categoryMap.set(DEFAULT_TRACKER_CATEGORY_ID, {
      id: DEFAULT_TRACKER_CATEGORY_ID,
      title: "General",
      archived: false,
      createdAt: now,
    })
  }

  const categories = Array.from(categoryMap.values())
  const categoryIds = new Set(categories.map((category) => category.id))

  const archivedAcceleratorGroups = Array.isArray(record.archivedAcceleratorGroups)
    ? Array.from(
        new Set(
          record.archivedAcceleratorGroups
            .map((entry) => normalizeText(entry))
            .filter((entry) => entry.length > 0),
        ),
      )
    : []

  const tickets: WorkspaceTrackerTicket[] = []
  if (Array.isArray(record.tickets)) {
    for (const ticketValue of record.tickets) {
      const ticket = normalizeTrackerTicket(
        ticketValue,
        categoryIds,
        DEFAULT_TRACKER_CATEGORY_ID,
        now,
      )
      if (!ticket) continue
      tickets.push(ticket)
    }
  }

  return {
    tab: normalizeTrackerTab(record.tab),
    archivedAcceleratorGroups,
    categories,
    tickets,
  }
}
