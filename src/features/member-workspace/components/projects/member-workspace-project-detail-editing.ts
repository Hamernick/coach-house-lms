import type {
  PlatformAdminDashboardLabPriority,
  PlatformAdminDashboardLabStatus,
  ProjectDetails,
} from "@/features/platform-admin-dashboard"
import { htmlToMarkdown } from "@/lib/markdown/convert"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
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
  overviewDocument: string
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

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i
const HTML_DOCUMENT_TAG_PATTERN =
  /<(article|blockquote|br|div|figure|h[1-6]|hr|img|li|ol|p|pre|section|table|tbody|td|th|thead|tr|ul)\b/i
const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+/
const MARKDOWN_BULLET_PATTERN = /^\s*(?:[-*]|\d+[.)])\s+/
const SUMMARY_MAX_LENGTH = 280

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatPlainTextDocumentHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`
    )
    .join("")
}

function getProjectSourceStringField(
  source: ProjectDetails["source"],
  field: string
) {
  if (!source || typeof source !== "object" || !(field in source)) return ""

  const value = (source as Record<string, unknown>)[field]
  return typeof value === "string" ? value.trim() : ""
}

export function formatMemberWorkspaceProjectOverviewDocumentHtml(
  value: string
) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return sanitizeHtml(
    HTML_TAG_PATTERN.test(trimmed)
      ? trimmed
      : formatPlainTextDocumentHtml(trimmed)
  ).trim()
}

export function formatMemberWorkspaceProjectOverviewDocumentMarkdown(
  value: string
) {
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (HTML_TAG_PATTERN.test(trimmed)) {
    return htmlToMarkdown(sanitizeHtml(trimmed))
  }

  return trimmed
}

function stripMarkdownSummarySyntax(value: string) {
  return value
    .replace(MARKDOWN_HEADING_PATTERN, "")
    .replace(MARKDOWN_BULLET_PATTERN, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim()
}

export function formatMemberWorkspaceProjectOverviewDocumentSummary(
  value: string
) {
  const markdown =
    formatMemberWorkspaceProjectOverviewDocumentMarkdown(value).trim()
  if (!markdown) return ""

  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const contentLines = lines.filter(
    (line) => !MARKDOWN_HEADING_PATTERN.test(line)
  )
  const candidates = contentLines.length > 0 ? contentLines : lines
  const summary = candidates
    .map(stripMarkdownSummarySyntax)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  if (summary.length <= SUMMARY_MAX_LENGTH) return summary
  return `${summary.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`
}

export function isMemberWorkspaceProjectOverviewDocumentHtml(value: string) {
  return HTML_DOCUMENT_TAG_PATTERN.test(value.trim())
}

export function resolveMemberWorkspaceProjectOverviewDocumentSource(
  project: ProjectDetails
) {
  if (project.overviewDocument?.trim()) {
    return project.overviewDocument.trim()
  }

  const sourceDescription = getProjectSourceStringField(
    project.source,
    "description"
  )
  if (sourceDescription) return sourceDescription

  return project.description.trim()
}

function buildOverviewDocument(project: ProjectDetails) {
  return formatMemberWorkspaceProjectOverviewDocumentHtml(
    resolveMemberWorkspaceProjectOverviewDocumentSource(project)
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
    overviewDocument: buildOverviewDocument(project),
  }
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
    overviewDocument: formatMemberWorkspaceProjectOverviewDocumentHtml(
      draft.overviewDocument
    ),
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
  const overviewDocumentHtml = formatMemberWorkspaceProjectOverviewDocumentHtml(
    draft.overviewDocument
  )
  const description =
    formatMemberWorkspaceProjectOverviewDocumentSummary(overviewDocumentHtml)

  return {
    name: draft.name,
    description: description || undefined,
    overviewDocumentHtml,
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
