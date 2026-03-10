"use client"

import { sortTrackerTickets } from "./workspace-board-formation-tracker-card-helpers"
import type {
  WorkspaceSeedData,
  WorkspaceTrackerState,
  WorkspaceTrackerTicket,
} from "./workspace-board-types"

export type AcceleratorGroup = {
  id: string
  title: string
  modules: WorkspaceSeedData["formationSummary"]["visibleModules"]
}

export function buildAcceleratorGroups(
  seed: WorkspaceSeedData,
): AcceleratorGroup[] {
  const next: AcceleratorGroup[] = []
  if (seed.formationSummary.visibleModules.length > 0) {
    next.push({
      id: "formation",
      title: "Formation",
      modules: seed.formationSummary.visibleModules,
    })
  }
  if (seed.formationSummary.acceleratorModules.length > 0) {
    next.push({
      id: "electives",
      title: "Electives",
      modules: seed.formationSummary.acceleratorModules,
    })
  }
  return next
}

export function splitTrackerCategories(tracker: WorkspaceTrackerState) {
  const activeCategories = tracker.categories.filter((category) => !category.archived)
  const archivedCategories = tracker.categories.filter((category) => category.archived)

  return {
    activeCategories,
    archivedCategories,
  }
}

export function buildTicketsByCategory(
  tickets: WorkspaceTrackerState["tickets"],
) {
  const map = new Map<string, WorkspaceTrackerTicket[]>()
  const sortedTickets = sortTrackerTickets(tickets)
  for (const ticket of sortedTickets) {
    if (ticket.archived) continue
    const list = map.get(ticket.categoryId) ?? []
    list.push(ticket)
    map.set(ticket.categoryId, list)
  }
  return map
}

export function summarizeTrackerTicketCounts(
  tickets: WorkspaceTrackerState["tickets"],
) {
  const openTicketCount = tickets.filter(
    (ticket) => !ticket.archived && ticket.status !== "done",
  ).length
  const doneTicketCount = tickets.filter(
    (ticket) => !ticket.archived && ticket.status === "done",
  ).length

  return {
    openTicketCount,
    doneTicketCount,
  }
}
