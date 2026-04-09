import { supabaseErrorToError } from "@/lib/supabase/errors"

function isMissingMemberWorkspaceTableError(error: unknown, tableName: string) {
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

export function isMissingOrganizationProjectsTableError(error: unknown) {
  return isMissingMemberWorkspaceTableError(error, "organization_projects")
}

export function isMissingOrganizationProjectNotesTableError(error: unknown) {
  return isMissingMemberWorkspaceTableError(error, "organization_project_notes")
}

export function isMissingOrganizationProjectAssetsTableError(error: unknown) {
  return isMissingMemberWorkspaceTableError(error, "organization_project_assets")
}

export function isMissingOrganizationProjectQuickLinksTableError(error: unknown) {
  return isMissingMemberWorkspaceTableError(error, "organization_project_quick_links")
}

export function isMissingOrganizationWorkspaceStarterStateTableError(
  error: unknown,
) {
  return isMissingMemberWorkspaceTableError(
    error,
    "organization_workspace_starter_state",
  )
}

export function isMissingOrganizationTasksTableError(error: unknown) {
  return isMissingMemberWorkspaceTableError(error, "organization_tasks")
}

export function isMissingOrganizationTaskAssigneesTableError(error: unknown) {
  return isMissingMemberWorkspaceTableError(error, "organization_task_assignees")
}

export function toMemberWorkspaceDataError(
  error: unknown,
  fallbackMessage: string,
) {
  return supabaseErrorToError(error, fallbackMessage)
}
