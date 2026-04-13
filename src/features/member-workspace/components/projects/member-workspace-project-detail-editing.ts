import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabStatus,
  ProjectDetails,
} from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceCreateProjectFormInput } from "../../types"

export const MEMBER_WORKSPACE_PROJECT_STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies ReadonlyArray<{
  value: PlatformAdminDashboardLabStatus
  label: string
}>

export const MEMBER_WORKSPACE_PROJECT_PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const satisfies ReadonlyArray<{
  value: PlatformAdminDashboardLabPriority
  label: string
}>

export type MemberWorkspaceProjectDetailDraft = {
  name: string
  status: PlatformAdminDashboardLabStatus
  priority: PlatformAdminDashboardLabPriority
  startDate: string
  endDate: string
  clientName: string
  typeLabel: string
  durationLabel: string
  tags: string
  memberLabels: string
  summary: string
  scopeIn: string
  scopeOut: string
  outcomes: string
  keyFeaturesP0: string
  keyFeaturesP1: string
  keyFeaturesP2: string
}

function toDateValue(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : ""
}

function normalizeCsvList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

function normalizeTextLines(value: string) {
  return Array.from(
    new Set(
      value
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

function normalizeProjectStatus(
  project: ProjectDetails
): PlatformAdminDashboardLabStatus {
  if (project.source?.status) {
    return project.source.status
  }

  switch (project.backlog.statusLabel) {
    case "Active":
      return "active"
    case "Planned":
      return "planned"
    case "Completed":
      return "completed"
    case "Cancelled":
      return "cancelled"
    default:
      return "backlog"
  }
}

function normalizeProjectPriority(
  project: ProjectDetails
): PlatformAdminDashboardLabPriority {
  const sourcePriority = project.source?.priority
  if (sourcePriority) {
    return sourcePriority
  }

  const fallback = project.meta.priorityLabel.trim().toLowerCase()
  if (
    fallback === "urgent" ||
    fallback === "high" ||
    fallback === "medium" ||
    fallback === "low"
  ) {
    return fallback
  }

  return "medium"
}

export function buildMemberWorkspaceProjectDetailDraft(
  project: ProjectDetails
): MemberWorkspaceProjectDetailDraft {
  return {
    name: project.name,
    status: normalizeProjectStatus(project),
    priority: normalizeProjectPriority(project),
    startDate: toDateValue(project.source?.startDate),
    endDate: toDateValue(project.source?.endDate),
    clientName: project.source?.client ?? "",
    typeLabel: project.source?.typeLabel ?? "",
    durationLabel: project.source?.durationLabel ?? "",
    tags: (project.source?.tags ?? []).join(", "),
    memberLabels: (project.source?.members ?? []).join(", "),
    summary: project.description,
    scopeIn: project.scope.inScope.join("\n"),
    scopeOut: project.scope.outOfScope.join("\n"),
    outcomes: project.outcomes.join("\n"),
    keyFeaturesP0: project.keyFeatures.p0.join("\n"),
    keyFeaturesP1: project.keyFeatures.p1.join("\n"),
    keyFeaturesP2: project.keyFeatures.p2.join("\n"),
  }
}

function buildOverviewDescription(draft: MemberWorkspaceProjectDetailDraft) {
  const summary = normalizeTextLines(draft.summary)
  const scopeIn = normalizeTextLines(draft.scopeIn)
  const scopeOut = normalizeTextLines(draft.scopeOut)
  const outcomes = normalizeTextLines(draft.outcomes)
  const p0 = normalizeTextLines(draft.keyFeaturesP0)
  const p1 = normalizeTextLines(draft.keyFeaturesP1)
  const p2 = normalizeTextLines(draft.keyFeaturesP2)
  const lines: string[] = []

  if (summary.length > 0) {
    lines.push("Goal:")
    for (const item of summary) {
      lines.push(`- ${item}`)
    }
  }

  if (scopeIn.length > 0) {
    lines.push("In scope:")
    for (const item of scopeIn) {
      lines.push(`- ${item}`)
    }
  }

  if (scopeOut.length > 0) {
    lines.push("Out of scope:")
    for (const item of scopeOut) {
      lines.push(`- ${item}`)
    }
  }

  if (outcomes.length > 0) {
    lines.push("Expected outcomes:")
    for (const item of outcomes) {
      lines.push(`- ${item}`)
    }
  }

  if (p0.length > 0 || p1.length > 0 || p2.length > 0) {
    lines.push("Key features:")
  }

  if (p0.length > 0) {
    lines.push("P0:")
    for (const item of p0) {
      lines.push(`- ${item}`)
    }
  }

  if (p1.length > 0) {
    lines.push("P1:")
    for (const item of p1) {
      lines.push(`- ${item}`)
    }
  }

  if (p2.length > 0) {
    lines.push("P2:")
    for (const item of p2) {
      lines.push(`- ${item}`)
    }
  }

  return lines.join("\n").trim()
}

function normalizeDraftForComparison(draft: MemberWorkspaceProjectDetailDraft) {
  return {
    name: draft.name.trim(),
    status: draft.status,
    priority: draft.priority,
    startDate: draft.startDate.trim(),
    endDate: draft.endDate.trim(),
    clientName: draft.clientName.trim(),
    typeLabel: draft.typeLabel.trim(),
    durationLabel: draft.durationLabel.trim(),
    tags: normalizeCsvList(draft.tags).join(","),
    memberLabels: normalizeCsvList(draft.memberLabels).join(","),
    summary: normalizeTextLines(draft.summary).join("\n"),
    scopeIn: normalizeTextLines(draft.scopeIn).join("\n"),
    scopeOut: normalizeTextLines(draft.scopeOut).join("\n"),
    outcomes: normalizeTextLines(draft.outcomes).join("\n"),
    keyFeaturesP0: normalizeTextLines(draft.keyFeaturesP0).join("\n"),
    keyFeaturesP1: normalizeTextLines(draft.keyFeaturesP1).join("\n"),
    keyFeaturesP2: normalizeTextLines(draft.keyFeaturesP2).join("\n"),
  }
}

export function areMemberWorkspaceProjectDetailDraftsEqual(
  left: MemberWorkspaceProjectDetailDraft,
  right: MemberWorkspaceProjectDetailDraft
) {
  return (
    JSON.stringify(normalizeDraftForComparison(left)) ===
    JSON.stringify(normalizeDraftForComparison(right))
  )
}

export function buildMemberWorkspaceProjectUpdateInput({
  project,
  draft,
}: {
  project: ProjectDetails
  draft: MemberWorkspaceProjectDetailDraft
}): MemberWorkspaceCreateProjectFormInput {
  const description = buildOverviewDescription(draft)

  return {
    name: draft.name,
    description: description || undefined,
    status: draft.status,
    priority: draft.priority,
    startDate: draft.startDate,
    endDate: draft.endDate,
    clientName: draft.clientName || undefined,
    typeLabel: draft.typeLabel || undefined,
    durationLabel: draft.durationLabel || undefined,
    tags: normalizeCsvList(draft.tags).join(", "),
    memberLabels: normalizeCsvList(draft.memberLabels).join(", "),
  }
}
