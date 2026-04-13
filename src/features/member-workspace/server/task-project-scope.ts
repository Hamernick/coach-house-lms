import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  isMissingOrganizationProjectsTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export type TaskProjectOption = {
  id: string
  label: string
}

export async function loadTaskProjectScope({
  orgId,
  supabase,
}: {
  orgId?: string
  supabase: ServerSupabaseClient
}): Promise<{ projectIds: Set<string>; projectOptions: TaskProjectOption[] }> {
  let query = supabase
    .from("organization_projects")
    .select("id, name")
    .eq("project_kind", "standard")
    .neq("created_source", "system")
    .order("name", { ascending: true })

  if (orgId) {
    query = query.eq("org_id", orgId)
  }

  const { data, error } = await query.returns<Array<{ id: string; name: string }>>()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) {
      return {
        projectIds: new Set(),
        projectOptions: [],
      }
    }
    throw toMemberWorkspaceDataError(error, "Unable to load task projects.")
  }

  const rows = data ?? []

  return {
    projectIds: new Set(rows.map((project) => project.id)),
    projectOptions: rows.map((project) => ({
      id: project.id,
      label: project.name,
    })),
  }
}
