import type { WorkspaceObjectiveCollection, WorkspaceObjectiveRecord } from "@/features/workspace-objectives"

import type {
  WorkspaceTrackerCategory,
  WorkspaceTrackerState,
  WorkspaceTrackerTab,
  WorkspaceTrackerTicket,
  WorkspaceTrackerTicketStatus,
} from "./workspace-board-types"

const DEFAULT_CATEGORY_ID = "general"

function mapObjectiveStatusToTrackerStatus(status: WorkspaceObjectiveRecord["status"]): WorkspaceTrackerTicketStatus {
  if (status === "done") return "done"
  if (status === "in_progress" || status === "blocked") return "in_progress"
  return "todo"
}

export function mapTrackerStatusToObjectiveStatus(
  status: WorkspaceTrackerTicketStatus,
): "todo" | "in_progress" | "done" {
  if (status === "done") return "done"
  if (status === "in_progress") return "in_progress"
  return "todo"
}

export function mapObjectiveCollectionToTrackerState({
  collection,
  tab,
}: {
  collection: WorkspaceObjectiveCollection
  tab: WorkspaceTrackerTab
}): WorkspaceTrackerState {
  const categories: WorkspaceTrackerCategory[] = collection.groups.map((group) => ({
    id: group.id,
    title: group.title,
    archived: Boolean(group.archivedAt),
    createdAt: group.createdAt,
  }))

  if (categories.length === 0) {
    categories.push({
      id: DEFAULT_CATEGORY_ID,
      title: "General",
      archived: false,
      createdAt: new Date().toISOString(),
    })
  }

  const activeCategoryIds = new Set(categories.map((category) => category.id))
  const categoryArchivedMap = new Map(categories.map((category) => [category.id, category.archived]))
  const defaultCategoryId = categories[0]?.id ?? DEFAULT_CATEGORY_ID

  const tickets: WorkspaceTrackerTicket[] = collection.objectives.map((objective) => ({
    ...(function () {
      const mappedCategoryId =
        objective.groupId && activeCategoryIds.has(objective.groupId) ? objective.groupId : defaultCategoryId
      const categoryArchived = categoryArchivedMap.get(mappedCategoryId) ?? false
      return {
        id: objective.id,
        categoryId: mappedCategoryId,
        title: objective.title,
        description: objective.description,
        status: mapObjectiveStatusToTrackerStatus(objective.status),
        priority: objective.priority,
        dueAt: objective.dueAt,
        assigneeUserIds: objective.assignees.map((assignee) => assignee.userId),
        archived: objective.status === "archived" || categoryArchived,
        createdAt: objective.createdAt,
        updatedAt: objective.updatedAt,
      }
    })(),
  }))

  return {
    tab,
    archivedAcceleratorGroups: [],
    categories,
    tickets,
  }
}
