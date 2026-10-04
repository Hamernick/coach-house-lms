import { parseScheduleDay } from "../lib/project-schedule"
import { projectOptionSettingsSchema, type ProjectOptionSettings } from "../lib/project-option-settings"
import type { MemberWorkspaceCreateProjectFormInput } from "../types"
import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabStatus,
} from "@/features/platform-admin-dashboard"

export type MemberWorkspaceNormalizedCreateProjectInput = {
  recurrence?: "none" | "monthly"
  name: string
  description: string | null
  overviewDocumentHtml: string | null
  hasOverviewDocumentHtml: boolean
  status: PlatformAdminDashboardLabStatus
  priority: PlatformAdminDashboardLabPriority
  startDate: string | null
  endDate: string | null
  clientName: string | null
  typeLabel: string | null
  durationLabel: string | null
  optionSettings?: ProjectOptionSettings
  tags: string[]
  memberLabels: string[]
}

function parseList(value: string | undefined) {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatDurationLabel(startDate: string, endDate: string) {
  const start = toUtcDate(startDate)
  const end = toUtcDate(endDate)
  const diffInDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  )

  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"}`
  }

  if (diffInDays < 31) {
    const weeks = Math.max(1, Math.round(diffInDays / 7))
    return `${weeks} week${weeks === 1 ? "" : "s"}`
  }

  const months = Math.max(1, Math.round(diffInDays / 30))
  return `${months} month${months === 1 ? "" : "s"}`
}

export function normalizeMemberWorkspaceCreateProjectInput(
  input: MemberWorkspaceCreateProjectFormInput
):
  | { ok: true; value: MemberWorkspaceNormalizedCreateProjectInput }
  | { ok: false; error: string } {
  const name = input.name.trim()
  if (!name) {
    return { ok: false, error: "Project name is required." }
  }

  const startDate = input.startDate?.trim() || null
  const endDate = input.endDate?.trim() || null
  if ((startDate && parseScheduleDay(startDate) === null) ||
      (endDate && parseScheduleDay(endDate) === null)) {
    return { ok: false, error: "Enter valid project dates." }
  }
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: "End date must be on or after the start date." }
  }

  if (input.recurrence !== undefined && input.recurrence !== "none" && input.recurrence !== "monthly") {
    return { ok: false, error: "Choose a valid repeat schedule." }
  }
  if (input.recurrence === "monthly" && (!startDate || !endDate)) {
    return { ok: false, error: "Monthly projects require a start date and an end date." }
  }

  if (input.fiscalSponsorshipEnabled !== undefined && typeof input.fiscalSponsorshipEnabled !== "boolean") {
    return { ok: false, error: "Choose a valid fiscal sponsorship option." }
  }
  const settings = input.optionSettings === undefined ? undefined : projectOptionSettingsSchema.safeParse(input.optionSettings)
  if (settings && !settings.success) return { ok: false, error: "Check option names and colors." }

  return {
    ok: true,
    value: {
      ...(input.recurrence === undefined ? {} : { recurrence: input.recurrence }),
      ...(settings?.success ? { optionSettings: settings.data } : {}),
      name,
      description: input.description?.trim() ? input.description.trim() : null,
      overviewDocumentHtml:
        typeof input.overviewDocumentHtml === "string"
          ? input.overviewDocumentHtml.trim()
          : null,
      hasOverviewDocumentHtml: typeof input.overviewDocumentHtml === "string",
      status: input.status,
      priority: input.priority,
      startDate,
      endDate,
      clientName: input.clientName?.trim() ? input.clientName.trim() : null,
      typeLabel: input.typeLabel?.trim() ? input.typeLabel.trim() : null,
      durationLabel: input.durationLabel?.trim()
        ? input.durationLabel.trim()
        : startDate && endDate ? formatDurationLabel(startDate, endDate) : null,
      tags: parseList(input.tags),
      memberLabels: parseList(input.memberLabels),
    },
  }
}
