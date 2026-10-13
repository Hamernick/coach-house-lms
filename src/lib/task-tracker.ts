export type TaskTrackerDetails = {
  sourceId: string
  ownerName?: string
  collaboratorNames: string[]
  collaboratorUserIds: string[]
  proposedOwnerName?: string
  proposedUserId?: string
  assignmentStatus?: string
  proposedBy?: string
  proposedDate?: string
  acceptedDate?: string
  acceptanceNotes?: string
  estimatedMinutes?: number
  plannedWeek?: string
  completedDate?: string
  waitingType?: string
  waitingFor?: string
  sourceType?: string
  sourcePerson?: string
  sourceReference?: string
}

export function readTaskTrackerDetails(value: unknown): TaskTrackerDetails | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const row = value as Record<string, unknown>
  if (typeof row.sourceId !== "string" || !row.sourceId.trim()) return undefined
  const text = (key: string) => typeof row[key] === "string" ? row[key] as string : undefined
  const list = (key: string) => Array.isArray(row[key]) ? row[key].filter((item): item is string => typeof item === "string") : []
  return {
    sourceId: row.sourceId,
    ownerName: text("ownerName"), collaboratorNames: list("collaboratorNames"),
    collaboratorUserIds: list("collaboratorUserIds"),
    proposedOwnerName: text("proposedOwnerName"), proposedUserId: text("proposedUserId"),
    assignmentStatus: text("assignmentStatus"), proposedBy: text("proposedBy"),
    proposedDate: text("proposedDate"), acceptedDate: text("acceptedDate"),
    acceptanceNotes: text("acceptanceNotes"),
    estimatedMinutes: typeof row.estimatedMinutes === "number" && Number.isFinite(row.estimatedMinutes) ? row.estimatedMinutes : undefined,
    plannedWeek: text("plannedWeek"), completedDate: text("completedDate"),
    waitingType: text("waitingType"), waitingFor: text("waitingFor"),
    sourceType: text("sourceType"), sourcePerson: text("sourcePerson"), sourceReference: text("sourceReference"),
  }
}

export type PersonalTaskRelation = "owned" | "proposed" | "collaborating"

export function matchesPersonalTaskRelation(task: {
  assignee?: { id: string } | null
  tracker?: TaskTrackerDetails
  status: string
}, userId: string, relation: PersonalTaskRelation) {
  if (relation === "collaborating") return task.tracker?.collaboratorUserIds.includes(userId) ?? false
  if (relation === "proposed") return !task.assignee && task.status !== "done" && task.tracker?.assignmentStatus === "Proposed" && task.tracker.proposedUserId === userId
  return task.assignee?.id === userId || (!task.assignee && !task.tracker)
}
