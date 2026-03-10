import type { PublicTables } from "@/lib/supabase/schema/tables"
import type { InternalDbViewerRow, InternalDbViewerTableName } from "../types"

const KNOWN_PUBLIC_TABLE_NAMES = [
  "organizations",
  "module_assignments",
  "assignment_submissions",
  "attachments",
  "enrollment_invites",
  "profiles",
  "classes",
  "modules",
  "enrollments",
  "module_progress",
  "subscriptions",
  "stripe_webhook_events",
  "module_content",
  "onboarding_responses",
  "roadmap_events",
  "roadmap_calendar_public_events",
  "roadmap_calendar_internal_events",
  "roadmap_calendar_public_feeds",
  "roadmap_calendar_internal_feeds",
  "search_events",
  "accelerator_purchases",
  "elective_purchases",
  "organization_memberships",
  "organization_invites",
  "organization_access_settings",
  "organization_workspace_boards",
  "organization_workspace_communication_channels",
  "organization_workspace_communication_deliveries",
  "organization_workspace_communications",
  "organization_workspace_invites",
  "organization_workspace_objective_activity",
  "organization_workspace_objective_assignees",
  "organization_workspace_objective_groups",
  "organization_workspace_objective_links",
  "organization_workspace_objective_steps",
  "organization_workspace_objectives",
  "notifications",
] as const satisfies readonly (keyof PublicTables)[]

const FALLBACK_VIEWER_TABLES = ["organizations"] as const satisfies readonly InternalDbViewerTableName[]

export const INTERNAL_DB_VIEWER_ALLOWED_LIMITS = [25, 50, 100] as const
export const INTERNAL_DB_VIEWER_DEFAULT_ROW_LIMIT = INTERNAL_DB_VIEWER_ALLOWED_LIMITS[1]

function normalizeCsv(raw: string | null | undefined): string[] {
  if (typeof raw !== "string") return []
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function resolveInternalDbViewerAllowedEmails(raw: string | null | undefined): Set<string> {
  const emails = normalizeCsv(raw).map((entry) => entry.toLowerCase())
  return new Set(emails)
}

function isKnownViewerTable(value: string): value is InternalDbViewerTableName {
  return (KNOWN_PUBLIC_TABLE_NAMES as readonly string[]).includes(value)
}

export function resolveInternalDbViewerTables(raw: string | null | undefined): InternalDbViewerTableName[] {
  const requested = normalizeCsv(raw)
  const allowed = requested.filter(isKnownViewerTable)
  if (allowed.length === 0) {
    return [...FALLBACK_VIEWER_TABLES]
  }
  return [...new Set(allowed)]
}

export function resolveInternalDbViewerSelectedTable({
  allowedTables,
  candidate,
}: {
  allowedTables: InternalDbViewerTableName[]
  candidate: string | null | undefined
}): InternalDbViewerTableName {
  if (candidate && allowedTables.includes(candidate as InternalDbViewerTableName)) {
    return candidate as InternalDbViewerTableName
  }
  return allowedTables[0] ?? FALLBACK_VIEWER_TABLES[0]
}

export function resolveInternalDbViewerRowLimit(candidate: string | number | null | undefined): number {
  const numericCandidate =
    typeof candidate === "number"
      ? candidate
      : typeof candidate === "string"
        ? Number.parseInt(candidate, 10)
        : Number.NaN
  if (Number.isNaN(numericCandidate)) {
    return INTERNAL_DB_VIEWER_DEFAULT_ROW_LIMIT
  }

  if ((INTERNAL_DB_VIEWER_ALLOWED_LIMITS as readonly number[]).includes(numericCandidate)) {
    return numericCandidate
  }

  if (numericCandidate < INTERNAL_DB_VIEWER_ALLOWED_LIMITS[0]) {
    return INTERNAL_DB_VIEWER_ALLOWED_LIMITS[0]
  }
  return INTERNAL_DB_VIEWER_ALLOWED_LIMITS[INTERNAL_DB_VIEWER_ALLOWED_LIMITS.length - 1]
}

export function collectInternalDbViewerColumns(rows: InternalDbViewerRow[]): string[] {
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue
      seen.add(key)
    }
  }
  return [...seen]
}

export function formatInternalDbViewerCellValue(value: unknown): string {
  if (value === null) return "null"
  if (value === undefined) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Date) return value.toISOString()
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
