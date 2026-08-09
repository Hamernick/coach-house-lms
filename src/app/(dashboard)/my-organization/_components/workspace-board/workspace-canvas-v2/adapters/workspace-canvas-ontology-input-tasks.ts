import type {
  WorkspaceOntologyNodeInput,
  WorkspaceOntologyStatus,
} from "@/features/workspace-ontology"

import type {
  WorkspaceSeedData,
  WorkspaceTrackerState,
  WorkspaceTrackerTicket,
} from "../../workspace-board-types"

function taskStatus(
  status: WorkspaceTrackerTicket["status"]
): WorkspaceOntologyStatus {
  if (status === "done") return "complete"
  if (status === "in_progress") return "in-progress"
  return "missing"
}

function buildTaskNode({
  ticket,
  memberById,
}: {
  ticket: WorkspaceTrackerTicket
  memberById: ReadonlyMap<string, string>
}): WorkspaceOntologyNodeInput {
  return {
    id: `ontology:task:${ticket.id}`,
    label: ticket.title,
    description: ticket.description?.trim() || "Organization objective.",
    category: "tasks",
    kind: "Task",
    status: taskStatus(ticket.status),
    statusLabel:
      ticket.status === "done"
        ? "Complete"
        : ticket.status === "in_progress"
          ? "In progress"
          : "Not started",
    relationshipLabel: "contains",
    href: null,
    actionLabel: "Open task",
    actionTarget: { kind: "task", ticketId: ticket.id },
    ownerLabel:
      ticket.assigneeUserIds
        .map((userId) => memberById.get(userId))
        .filter((name): name is string => Boolean(name))
        .join(", ") || "Unassigned",
    keywords: [ticket.priority, ticket.dueAt ?? "", "objective"],
  }
}

function buildTaskGroupNode({
  id,
  label,
  tickets,
  memberById,
  uncategorized = false,
}: {
  id: string
  label: string
  tickets: WorkspaceTrackerTicket[]
  memberById: ReadonlyMap<string, string>
  uncategorized?: boolean
}): WorkspaceOntologyNodeInput {
  const completeCount = tickets.filter(
    (ticket) => ticket.status === "done"
  ).length
  return {
    id,
    label,
    description: uncategorized
      ? "Tasks that still need an operating category."
      : "Related organization objectives and operating work.",
    category: "tasks",
    kind: "Task group",
    status:
      tickets.length === 0
        ? "missing"
        : completeCount === tickets.length
          ? "complete"
          : "in-progress",
    statusLabel: uncategorized
      ? `${tickets.length} need categorization`
      : tickets.length === 0
        ? "No tasks"
        : `${completeCount}/${tickets.length} complete`,
    relationshipLabel: "groups",
    href: null,
    actionLabel: "Open objectives",
    actionTarget: { kind: "task", ticketId: null },
    children: tickets.map((ticket) => buildTaskNode({ ticket, memberById })),
  }
}

export function buildWorkspaceTasksOntologyNode(
  seed: WorkspaceSeedData,
  tracker: WorkspaceTrackerState = seed.boardState.tracker
): WorkspaceOntologyNodeInput {
  const memberById = new Map(
    seed.members.map((member) => [
      member.userId,
      member.name?.trim() || member.email?.trim() || "Team member",
    ])
  )
  const activeTickets = tracker.tickets.filter((ticket) => !ticket.archived)
  const activeCategories = tracker.categories.filter(
    (category) => !category.archived
  )
  const visibleCategoryIds = new Set(
    activeCategories.map((category) => category.id)
  )
  const categoryNodes = activeCategories.map((category) =>
    buildTaskGroupNode({
      id: `ontology:tasks:category:${category.id}`,
      label: category.title,
      tickets: activeTickets.filter(
        (ticket) => ticket.categoryId === category.id
      ),
      memberById,
    })
  )
  const uncategorizedTickets = activeTickets.filter(
    (ticket) => !visibleCategoryIds.has(ticket.categoryId)
  )
  if (uncategorizedTickets.length > 0) {
    categoryNodes.push(
      buildTaskGroupNode({
        id: "ontology:tasks:category:uncategorized",
        label: "Uncategorized",
        tickets: uncategorizedTickets,
        memberById,
        uncategorized: true,
      })
    )
  }

  return {
    id: "ontology:tasks:portfolio",
    label: "Objectives and tasks",
    description: "Ownership, priority, progress, and operating follow-up.",
    category: "tasks",
    kind: "Task portfolio",
    status:
      activeTickets.length === 0
        ? "missing"
        : activeTickets.every((ticket) => ticket.status === "done")
          ? "complete"
          : "in-progress",
    statusLabel:
      activeTickets.length === 0
        ? "No tasks"
        : `${activeTickets.filter((ticket) => ticket.status === "done").length}/${activeTickets.length} complete`,
    relationshipLabel: "tracks",
    href: null,
    actionLabel: "Open objectives",
    actionTarget: { kind: "task", ticketId: null },
    children: categoryNodes,
  }
}
