import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  isMissingOrganizationProjectsTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>

export type TaskProjectOption = {
  id: string
  label: string
}

export async function loadTaskProjectScope({
  includeOrganizationAdmin = false,
  orgId,
  supabase,
}: {
  includeOrganizationAdmin?: boolean
  orgId?: string
  supabase: ServerSupabaseClient
}): Promise<{ projectIds: Set<string>; projectOptions: TaskProjectOption[] }> {
  let query = supabase
    .from("organization_projects")
    .select("id, name, project_kind, created_source")
    .order("name", { ascending: true })

  query = includeOrganizationAdmin
    ? query.in("project_kind", ["standard", "organization_admin"])
    : query.eq("project_kind", "standard").neq("created_source", "system")

  if (orgId) {
    query = query.eq("org_id", orgId)
  }

  const { data, error } = await query.returns<
    Array<{
      id: string
      name: string
      project_kind: string
      created_source: string
    }>
  >()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) {
      return {
        projectIds: new Set(),
        projectOptions: [],
      }
    }
    throw toMemberWorkspaceDataError(error, "Unable to load task projects.")
  }

  const rows = (data ?? []).filter(
    (project) =>
      (project.project_kind === "standard" &&
        project.created_source !== "system") ||
      (includeOrganizationAdmin &&
        project.project_kind === "organization_admin")
  )

  return {
    projectIds: new Set(rows.map((project) => project.id)),
    projectOptions: rows.map((project) => ({
      id: project.id,
      label: project.name,
    })),
  }
}
