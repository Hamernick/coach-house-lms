import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  buildStarterOrganizationProjects,
} from "./project-starter-data"
import { MEMBER_WORKSPACE_STARTER_VERSION } from "./starter-data"
import {
  isMissingOrganizationProjectsTableError,
  isMissingOrganizationWorkspaceStarterStateTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function ensureStarterProjectsForOrg({
  canEdit,
  orgId,
  userId,
  supabase,
}: {
  canEdit: boolean
  orgId: string
  userId: string
  supabase: ServerSupabaseClient
}) {
  const { count, error: existingProjectsError } = await supabase
    .from("organization_projects")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("project_kind", "standard")
    .neq("created_source", "system")

  if (existingProjectsError) {
    if (isMissingOrganizationProjectsTableError(existingProjectsError)) return
    throw toMemberWorkspaceDataError(
      existingProjectsError,
      "Unable to load workspace projects.",
    )
  }

  if ((count ?? 0) > 0 || !canEdit) {
    return
  }

  const starterProjects = buildStarterOrganizationProjects({
    orgId,
    actorId: userId,
  })

  const { error: insertError } = await supabase
    .from("organization_projects")
    .upsert(starterProjects, { onConflict: "org_id,starter_seed_key" })

  if (insertError) {
    if (isMissingOrganizationProjectsTableError(insertError)) return
    throw toMemberWorkspaceDataError(
      insertError,
      "Unable to initialize workspace projects.",
    )
  }

  const { error: starterStateError } = await supabase
    .from("organization_workspace_starter_state")
    .upsert(
      {
        org_id: orgId,
        seed_version: MEMBER_WORKSPACE_STARTER_VERSION,
        seeded_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "org_id" },
    )

  if (starterStateError) {
    if (
      isMissingOrganizationWorkspaceStarterStateTableError(starterStateError)
    ) {
      return
    }
    throw toMemberWorkspaceDataError(
      starterStateError,
      "Unable to initialize workspace starter data.",
    )
  }
}

export async function loadOrganizationProjectStarterIdMap({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: ServerSupabaseClient
}) {
  const { data, error } = await supabase
    .from("organization_projects")
    .select("id, starter_seed_key")
    .eq("org_id", orgId)
    .eq("project_kind", "standard")
    .neq("created_source", "system")
    .not("starter_seed_key", "is", null)
    .returns<Array<{ id: string; starter_seed_key: string | null }>>()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) return new Map()
    throw toMemberWorkspaceDataError(error, "Unable to load workspace projects.")
  }

  const starterProjectIdByKey = new Map<string, string>()
  for (const row of data ?? []) {
    if (!row.starter_seed_key) continue
    starterProjectIdByKey.set(row.starter_seed_key, row.id)
  }

  return starterProjectIdByKey
}
