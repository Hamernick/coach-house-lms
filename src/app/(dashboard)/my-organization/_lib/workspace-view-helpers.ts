import type { OrganizationMemberRole } from "@/lib/organization/active-org"

import type {
  WorkspaceTrackerState,
  WorkspaceTrackerTicketPriority,
  WorkspaceTrackerTicketStatus,
} from "../_components/workspace-board/workspace-board-types"

export function normalizeMembershipRole(role: string | null | undefined): OrganizationMemberRole {
  if (role === "owner") return "owner"
  if (role === "admin") return "admin"
  if (role === "staff") return "staff"
  if (role === "board") return "board"
  return "member"
}

function isMissingWorkspaceTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01" || record.code === "PGRST205") return true
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.details === "string"
        ? record.details
        : ""
  if (message.includes(tableName)) return true
  const hint = typeof record.hint === "string" ? record.hint : ""
  return hint.includes(tableName)
}

export function isMissingWorkspaceCommunicationsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_communications")
}

export function isMissingWorkspaceCommunicationChannelsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_communication_channels")
}

export function isMissingWorkspaceObjectiveGroupsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_objective_groups")
}

export function isMissingWorkspaceObjectivesTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_objectives")
}

export function isMissingWorkspaceObjectiveAssigneesTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_objective_assignees")
}

export function isMissingModuleProgressTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "module_progress")
}

export function isMissingRoadmapCalendarInternalEventsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "roadmap_calendar_internal_events")
}

export function mapObjectiveRowsToTrackerState({
  groups,
  objectives,
  assignees,
  tab,
}: {
  groups: Array<{
    id: string
    title: string
    archived_at: string | null
    created_at: string
  }>
  objectives: Array<{
    id: string
    group_id: string | null
    title: string
    description: string | null
    priority: "low" | "normal" | "high" | "critical" | string
    due_at: string | null
    status: string
    created_at: string
    updated_at: string
  }>
  assignees: Array<{
    objective_id: string
    user_id: string
  }>
  tab: WorkspaceTrackerState["tab"]
}): WorkspaceTrackerState | null {
  if (groups.length === 0 && objectives.length === 0) return null

  const categories =
    groups.length > 0
      ? groups.map((group) => ({
          id: group.id,
          title: group.title,
          archived: Boolean(group.archived_at),
          createdAt: group.created_at,
        }))
      : [
          {
            id: "general",
            title: "General",
            archived: false,
            createdAt: new Date().toISOString(),
          },
        ]

  const categoryArchivedById = new Map(categories.map((category) => [category.id, category.archived]))
  const defaultCategoryId = categories[0]?.id ?? "general"
  const assigneeMap = new Map<string, string[]>()
  for (const assignee of assignees) {
    const current = assigneeMap.get(assignee.objective_id)
    if (current) current.push(assignee.user_id)
    else assigneeMap.set(assignee.objective_id, [assignee.user_id])
  }

  const tickets = objectives.map((objective) => {
    const categoryId =
      objective.group_id && categoryArchivedById.has(objective.group_id)
        ? objective.group_id
        : defaultCategoryId
    const categoryArchived = categoryArchivedById.get(categoryId) ?? false
    const status: WorkspaceTrackerTicketStatus =
      objective.status === "done"
        ? "done"
        : objective.status === "in_progress" || objective.status === "blocked"
          ? "in_progress"
          : "todo"
    const priority: WorkspaceTrackerTicketPriority =
      objective.priority === "low" ||
      objective.priority === "high" ||
      objective.priority === "critical"
        ? objective.priority
        : "normal"

    return {
      id: objective.id,
      categoryId,
      title: objective.title,
      description: objective.description,
      status,
      priority,
      dueAt: objective.due_at,
      assigneeUserIds: assigneeMap.get(objective.id) ?? [],
      archived: objective.status === "archived" || categoryArchived,
      createdAt: objective.created_at,
      updatedAt: objective.updated_at,
    }
  })

  return {
    tab,
    archivedAcceleratorGroups: [],
    categories,
    tickets,
  }
}
